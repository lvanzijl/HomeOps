using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class ClimateMappingValidationServiceTests
{
    [Fact]
    public async Task HealthUpdatesApplyConsistentTimestampAndDiagnosticSemantics()
    {
        await using var db = CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var service = new ClimateMappingValidationService(db);
        var created = await db.RoomClimateSourceMappings.SingleAsync(m => m.Id == fixture.MappingId);
        Assert.Equal(MappingHealth.Unverified, created.Health);
        Assert.Null(created.LastCheckedUtc);
        Assert.Null(created.LastSuccessfulUtc);

        var healthy = await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId, new ClimateMappingValidationMetadata(ExternalDisplayName: "  Comfort sensor  ", ExternalSourceKind: " sensor ", ExternalAreaName: " Bedroom ", ExternalDeviceName: " Thermostat "));
        Assert.True(healthy.Succeeded);
        var afterHealthy = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(MappingHealth.Healthy, afterHealthy.Health);
        Assert.NotNull(afterHealthy.LastCheckedUtc);
        Assert.NotNull(afterHealthy.LastSuccessfulUtc);
        Assert.Equal(afterHealthy.LastCheckedUtc, afterHealthy.LastSuccessfulUtc);
        Assert.Equal("Comfort sensor", afterHealthy.ExternalDisplayName);
        Assert.Equal("sensor", afterHealthy.ExternalSourceKind);
        Assert.Equal("Bedroom", afterHealthy.ExternalAreaName);
        Assert.Equal("Thermostat", afterHealthy.ExternalDeviceName);
        Assert.Null(afterHealthy.DiagnosticSummary);

        var firstSuccess = afterHealthy.LastSuccessfulUtc;
        await Task.Delay(5);
        var secondHealthy = await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId);
        Assert.True(secondHealthy.Succeeded);
        var afterSecondHealthy = await ReloadAsync(db, fixture.MappingId);
        Assert.True(afterSecondHealthy.LastCheckedUtc >= afterHealthy.LastCheckedUtc);
        Assert.True(afterSecondHealthy.LastSuccessfulUtc >= firstSuccess);

        var successfulBeforeFailures = afterSecondHealthy.LastSuccessfulUtc;
        Assert.True((await service.MarkDegradedAsync(SeedHousehold.Id, fixture.MappingId, "  shared zone precision  ")).Succeeded);
        var degraded = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(MappingHealth.Degraded, degraded.Health);
        Assert.Equal(successfulBeforeFailures, degraded.LastSuccessfulUtc);
        Assert.Equal("shared zone precision", degraded.DiagnosticSummary);

        Assert.True((await service.MarkUnavailableAsync(SeedHousehold.Id, fixture.MappingId, " provider offline ")).Succeeded);
        var unavailable = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(MappingHealth.Unavailable, unavailable.Health);
        Assert.Equal(successfulBeforeFailures, unavailable.LastSuccessfulUtc);
        Assert.Equal("provider offline", unavailable.DiagnosticSummary);

        Assert.True((await service.MarkMissingAsync(SeedHousehold.Id, fixture.MappingId, " entity not found ")).Succeeded);
        var missing = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(MappingHealth.Missing, missing.Health);
        Assert.Equal(successfulBeforeFailures, missing.LastSuccessfulUtc);
        Assert.Equal("entity not found", missing.DiagnosticSummary);

        Assert.True((await service.MarkNeedsReviewAsync(SeedHousehold.Id, fixture.MappingId, " renamed upstream ")).Succeeded);
        var review = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(MappingHealth.NeedsReview, review.Health);
        Assert.Equal(successfulBeforeFailures, review.LastSuccessfulUtc);
        Assert.Equal("renamed upstream", review.DiagnosticSummary);

        Assert.True((await service.ResetToUnverifiedAsync(SeedHousehold.Id, fixture.MappingId)).Succeeded);
        var reset = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(MappingHealth.Unverified, reset.Health);
        Assert.Null(reset.LastCheckedUtc);
        Assert.Null(reset.LastSuccessfulUtc);
        Assert.Null(reset.DiagnosticSummary);
    }

    [Fact]
    public async Task ValidationSeamRejectsOversizedMetadataAndDoesNotMutateMappingIdentity()
    {
        await using var db = CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var before = await ReloadAsync(db, fixture.MappingId);
        var service = new ClimateMappingValidationService(db);

        var result = await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId, new ClimateMappingValidationMetadata(ExternalDisplayName: new string('x', 241)));

        Assert.False(result.Succeeded);
        Assert.Contains(nameof(ClimateMappingValidationMetadata.ExternalDisplayName), result.ValidationErrors.Keys);
        var after = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(before.RoomId, after.RoomId);
        Assert.Equal(before.ProviderId, after.ProviderId);
        Assert.Equal(before.SourceRole, after.SourceRole);
        Assert.Equal(before.ExternalSourceId, after.ExternalSourceId);
        Assert.Equal(before.Priority, after.Priority);
        Assert.Equal(MappingHealth.Unverified, after.Health);
    }

    [Fact]
    public async Task ValidationSeamEnforcesHouseholdAndLifecycleRules()
    {
        await using var db = CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var service = new ClimateMappingValidationService(db);
        var otherHouseholdId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        db.Households.Add(new Household { Id = otherHouseholdId, Name = "Other", CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();

        Assert.False((await service.MarkHealthyAsync(otherHouseholdId, fixture.MappingId)).Succeeded);
        Assert.False((await service.MarkHealthyAsync(SeedHousehold.Id, Guid.NewGuid())).Succeeded);

        var mapping = await ReloadAsync(db, fixture.MappingId);
        mapping.IsEnabled = false;
        await db.SaveChangesAsync();
        Assert.False((await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId)).Succeeded);
        Assert.True((await service.MarkUnavailableAsync(SeedHousehold.Id, fixture.MappingId, "disabled by user")).Succeeded);
        mapping.IsEnabled = true;

        var provider = await db.ClimateProviders.SingleAsync(p => p.Id == fixture.ProviderId);
        provider.IsEnabled = false;
        await db.SaveChangesAsync();
        Assert.False((await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId)).Succeeded);
        Assert.True((await service.MarkUnavailableAsync(SeedHousehold.Id, fixture.MappingId, "provider disabled")).Succeeded);
        provider.IsEnabled = true;
        provider.IsArchived = true;
        provider.ArchivedUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        Assert.False((await service.MarkUnavailableAsync(SeedHousehold.Id, fixture.MappingId, "provider archived")).Succeeded);
        provider.IsArchived = false;
        provider.ArchivedUtc = null;

        var room = await db.Rooms.SingleAsync(r => r.Id == fixture.RoomId);
        room.IsArchived = true;
        room.IsEnabled = false;
        room.ArchivedUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        Assert.False((await service.MarkMissingAsync(SeedHousehold.Id, fixture.MappingId, "room archived")).Succeeded);
        room.IsArchived = false;
        room.IsEnabled = true;
        room.ArchivedUtc = null;

        var config = await db.RoomClimateConfigurations.SingleAsync(c => c.RoomId == fixture.RoomId);
        config.IsClimateEnabled = false;
        await db.SaveChangesAsync();
        Assert.False((await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId)).Succeeded);
        Assert.True((await service.MarkNeedsReviewAsync(SeedHousehold.Id, fixture.MappingId, "climate disabled")).Succeeded);
        config.IsClimateEnabled = true;

        mapping = await ReloadAsync(db, fixture.MappingId);
        mapping.IsArchived = true;
        mapping.ArchivedUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        Assert.False((await service.MarkMissingAsync(SeedHousehold.Id, fixture.MappingId, "mapping archived")).Succeeded);
    }

    [Fact]
    public async Task RestoredMappingRemainsUnverifiedUntilValidatedAgain()
    {
        await using var db = CreateDbContext();
        var fixture = await CreateFixtureAsync(db);
        var service = new ClimateMappingValidationService(db);
        Assert.True((await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId)).Succeeded);
        var mapping = await ReloadAsync(db, fixture.MappingId);
        mapping.IsArchived = true;
        mapping.IsEnabled = false;
        mapping.ArchivedUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        mapping.IsArchived = false;
        mapping.IsEnabled = true;
        mapping.ArchivedUtc = null;
        mapping.Health = MappingHealth.NeedsReview;
        mapping.LastCheckedUtc = null;
        mapping.LastSuccessfulUtc = null;
        await db.SaveChangesAsync();

        var restored = await ReloadAsync(db, fixture.MappingId);
        restored.Health = MappingHealth.Unverified;
        await db.SaveChangesAsync();
        Assert.Equal(MappingHealth.Unverified, restored.Health);
        Assert.Null(restored.LastCheckedUtc);
        Assert.Null(restored.LastSuccessfulUtc);

        Assert.True((await service.MarkHealthyAsync(SeedHousehold.Id, fixture.MappingId)).Succeeded);
        var validated = await ReloadAsync(db, fixture.MappingId);
        Assert.Equal(MappingHealth.Healthy, validated.Health);
        Assert.NotNull(validated.LastSuccessfulUtc);
    }

    private static async Task<RoomClimateSourceMapping> ReloadAsync(HomeOpsDbContext db, Guid mappingId)
    {
        db.ChangeTracker.Clear();
        return await db.RoomClimateSourceMappings.SingleAsync(m => m.Id == mappingId);
    }

    private static async Task<FixtureIds> CreateFixtureAsync(HomeOpsDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        var now = DateTimeOffset.UtcNow;
        var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = $"Floor {Guid.NewGuid()}", SortOrder = 0, CreatedUtc = now, UpdatedUtc = now };
        var room = new Room { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, Name = $"Room {Guid.NewGuid()}", RoomType = RoomType.Bedroom, SortOrder = 0, CreatedUtc = now, UpdatedUtc = now };
        var config = new RoomClimateConfiguration { RoomId = room.Id, HouseholdId = SeedHousehold.Id, IsClimateEnabled = true, MinimumPreferredTemperatureCelsius = 18, MaximumPreferredTemperatureCelsius = 22, HeatingPolicyIntent = HeatingPolicyIntent.ReadOnlyStatus, CreatedUtc = now, UpdatedUtc = now };
        var provider = new ClimateProvider { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, DisplayName = $"Provider {Guid.NewGuid()}", ProviderType = ProviderType.HomeAssistant, CreatedUtc = now, UpdatedUtc = now };
        var mapping = new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceRole = ClimateSourceRole.ComfortTemperature, ExternalSourceId = "sensor.comfort", Priority = 0, CreatedUtc = now, UpdatedUtc = now };
        db.Floors.Add(floor);
        db.Rooms.Add(room);
        db.RoomClimateConfigurations.Add(config);
        db.ClimateProviders.Add(provider);
        db.RoomClimateSourceMappings.Add(mapping);
        await db.SaveChangesAsync();
        return new FixtureIds(floor.Id, room.Id, provider.Id, mapping.Id);
    }

    private static HomeOpsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"climate-validation-{Guid.NewGuid()}")
            .Options;
        return new HomeOpsDbContext(options);
    }

    private sealed record FixtureIds(Guid FloorId, Guid RoomId, Guid ProviderId, Guid MappingId);
}
