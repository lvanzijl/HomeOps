using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomHeatingControlFoundationHardeningTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 15, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task CapabilityReportsSupportedActionsDurationsSharedZoneCurrentOverrideAndLatestCommand()
    {
        using var db = Db(); var fake = new FakeProvider { Capability = new(true, SupportsTemporaryCooler: false, MinimumTargetTemperatureCelsius: 17, MaximumTargetTemperatureCelsius: 24) };
        var fx = Seed(db, secondSharedRoom: true); var service = Service(db, fake);
        var cap = await service.GetCapability(fx.Room.Id, default);
        Assert.NotNull(cap); Assert.True(cap!.IsControllable); Assert.Equal([15, 30, 60, 120], cap.AllowedDurationsMinutes); Assert.Contains(RoomHeatingCommandAction.TemporaryWarmer, cap.SupportedActions); Assert.Contains(RoomHeatingCommandAction.ResumeSchedule, cap.SupportedActions); Assert.DoesNotContain(RoomHeatingCommandAction.TemporaryCooler, cap.SupportedActions); Assert.Equal(new ClimateRangeDto(18, 22), cap.TargetRange); Assert.True(cap.IsSharedZone); Assert.Contains(fx.Room.Id, cap.AffectedRoomIds); Assert.Contains(fx.SharedRoomId!.Value, cap.AffectedRoomIds);
        var first = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "warm-1"), null, default);
        Assert.Equal(RoomHeatingCommandStatus.Accepted, first.response!.Command.Status); cap = await service.GetCapability(fx.Room.Id, default);
        Assert.Equal(first.response.Command.CommandId, cap!.CurrentOverride!.CommandId); Assert.Equal(first.response.Command.CommandId, cap.LatestCommand!.CommandId); Assert.Equal(1, fake.TemporaryCalls);
        fake.Capability = fake.Capability with { SupportsTemporaryCooler = true }; cap = await service.GetCapability(fx.Room.Id, default); Assert.Contains(RoomHeatingCommandAction.TemporaryCooler, cap!.SupportedActions);
    }

    [Theory]
    [InlineData("missing-config", "ClimateDisabled")]
    [InlineData("disabled-config", "ClimateDisabled")]
    [InlineData("readonly-policy", "PolicyNotBoundedControl")]
    [InlineData("no-range", "TargetRangeUnavailable")]
    [InlineData("missing-mapping", "MissingControlMapping")]
    [InlineData("disabled-mapping", "InvalidControlMapping")]
    [InlineData("archived-mapping", "InvalidControlMapping")]
    [InlineData("missing-health", "InvalidControlMapping")]
    [InlineData("unavailable-health", "InvalidControlMapping")]
    [InlineData("disabled-provider", "ProviderInactive")]
    [InlineData("archived-provider", "ProviderInactive")]
    [InlineData("no-observation", "CurrentObservationUnavailable")]
    [InlineData("unavailable-observation", "CurrentObservationUnavailable")]
    [InlineData("provider-unavailable", "ProviderUnavailable")]
    [InlineData("sensor-only", "MissingControlMapping")]
    [InlineData("archived-room", "RoomInactive")]
    public async Task CapabilityReturnsStableHouseholdSafeBlockers(string scenario, string expectedCode)
    {
        using var db = Db(); var fake = new FakeProvider { Capability = new(scenario != "provider-unavailable", BlockerCode: "ProviderUnavailable", BlockerMessage: "Heating control provider is unavailable.") }; var fx = Seed(db);
        switch (scenario) { case "missing-config": db.RoomClimateConfigurations.Remove(fx.Config); break; case "disabled-config": fx.Config.IsClimateEnabled = false; break; case "readonly-policy": fx.Config.HeatingPolicyIntent = HeatingPolicyIntent.ReadOnlyStatus; break; case "no-range": fx.Config.MinimumPreferredTemperatureCelsius = null; break; case "missing-mapping": db.RoomClimateObservations.Remove(fx.Observation); db.RoomClimateSourceMappings.Remove(fx.Mapping); break; case "disabled-mapping": fx.Mapping.IsEnabled = false; break; case "archived-mapping": fx.Mapping.IsArchived = true; break; case "missing-health": fx.Mapping.Health = MappingHealth.Missing; break; case "unavailable-health": fx.Mapping.Health = MappingHealth.Unavailable; break; case "disabled-provider": fx.Provider.IsEnabled = false; break; case "archived-provider": fx.Provider.IsArchived = true; break; case "no-observation": db.RoomClimateObservations.Remove(fx.Observation); break; case "unavailable-observation": fx.Observation.IsProviderAvailable = false; break; case "sensor-only": fx.Mapping.SourceRole = ClimateSourceRole.ComfortTemperature; break; case "archived-room": fx.Room.IsArchived = true; break; }
        await db.SaveChangesAsync(); var cap = await Service(db, fake).GetCapability(fx.Room.Id, default);
        Assert.NotNull(cap); Assert.False(cap!.IsControllable); Assert.Contains(cap.Blockers, b => b.Code == expectedCode); Assert.All(cap.Blockers, b => Assert.DoesNotContain("secret", b.Message, StringComparison.OrdinalIgnoreCase)); Assert.DoesNotContain(RoomHeatingCommandAction.TemporaryWarmer, cap.SupportedActions);
        Assert.Null(await Service(db, fake).GetCapability(Guid.NewGuid(), default));
    }

    [Fact]
    public async Task TemporaryWarmerCoversProviderOutcomesPersistenceStatusAndNoObservationMutation()
    {
        foreach (var (outcome, completed, expected) in new[] { (RoomHeatingProviderOutcome.Accepted, false, RoomHeatingCommandStatus.Accepted), (RoomHeatingProviderOutcome.Accepted, true, RoomHeatingCommandStatus.Succeeded), (RoomHeatingProviderOutcome.Rejected, false, RoomHeatingCommandStatus.Failed), (RoomHeatingProviderOutcome.Unavailable, false, RoomHeatingCommandStatus.Failed) })
        {
            using var db = Db(); var fx = Seed(db); var before = fx.Observation.TargetTemperatureCelsius; var fake = new FakeProvider { TemporaryResult = new(outcome, "ref-1", completed ? 21 : null, Completed: completed, FailureCode: outcome == RoomHeatingProviderOutcome.Accepted ? null : outcome.ToString(), FailureMessage: outcome == RoomHeatingProviderOutcome.Accepted ? null : "Safe failure") };
            var result = await Service(db, fake).Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 60, $"key-{outcome}-{completed}"), null, default);
            Assert.Equal(expected, result.response!.Command.Status); Assert.Equal("ref-1", (await db.RoomHeatingCommands.SingleAsync()).ProviderCommandReference); Assert.Equal(completed ? 21 : null, result.response.Command.ConfirmedTargetTemperatureCelsius); Assert.Equal(60, result.response.Command.DurationMinutes); Assert.Equal(Now.AddMinutes(60), result.response.Command.EffectiveUntilUtc); Assert.Equal(before, (await db.RoomClimateObservations.SingleAsync()).TargetTemperatureCelsius); Assert.Equal(1, await db.RoomHeatingCommands.CountAsync()); Assert.NotNull(await Service(db, fake).GetCommand(fx.Room.Id, result.response.Command.CommandId, default));
        }
    }

    [Fact]
    public async Task TemporaryValidationAndUnsupportedCoolerAreAtomicAndPreserveExistingOverride()
    {
        using var db = Db(); var fx = Seed(db); var fake = new FakeProvider(); var service = Service(db, fake);
        var valid = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "valid"), null, default); var validId = valid.response!.Command.CommandId;
        foreach (var request in new[] { new RoomHeatingTemporaryCommandRequest(4, 30, "low"), new(36, 30, "high"), new(17, 30, "room-low"), new(21, 45, "bad-duration"), new(19, 30, "not-warmer") })
        { var failed = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, request, null, default); Assert.Equal(400, failed.status); }
        var cooler = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryCooler, new(19, 30, "cool-no"), null, default); Assert.Equal(400, cooler.status);
        Assert.Equal(1, fake.TemporaryCalls); Assert.Equal(1, await db.RoomHeatingCommands.CountAsync()); Assert.Equal(validId, (await service.GetCapability(fx.Room.Id, default))!.CurrentOverride!.CommandId); Assert.Null((await db.RoomClimateObservations.SingleAsync()).TargetTemperatureCelsius);
    }

    [Fact]
    public async Task CoolerRequiresExplicitSupportAndUsesSameOutcomeAndIdempotencyRules()
    {
        using var db = Db(); var fx = Seed(db, temperature: 22); var fake = new FakeProvider { Capability = new(true, SupportsTemporaryCooler: true) }; var service = Service(db, fake);
        var badDirection = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryCooler, new(23, 30, "bad-cool"), null, default); Assert.Equal(400, badDirection.status);
        var ok = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryCooler, new(20, 30, "cool"), null, default); Assert.Equal(RoomHeatingCommandStatus.Accepted, ok.response!.Command.Status); var replay = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryCooler, new(20, 30, "cool"), null, default); Assert.Equal(ok.response.Command.CommandId, replay.response!.Command.CommandId); Assert.Equal(1, fake.TemporaryCalls);
    }

    [Fact]
    public async Task ResumeSupersedesCurrentCommandsAndIsIdempotentWithoutFabricatingConfirmation()
    {
        using var db = Db(); var fx = Seed(db); var fake = new FakeProvider(); var service = Service(db, fake);
        var first = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "w1"), null, default); var second = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "w2"), null, default);
        Assert.Equal(RoomHeatingCommandStatus.Superseded, (await db.RoomHeatingCommands.FindAsync(first.response!.Command.CommandId))!.Status);
        fake.ResumeResult = new(RoomHeatingProviderOutcome.Accepted, "resume-ref", ScheduleResumed: null, Completed: false); var resume = await service.Resume(fx.Room.Id, new("resume"), null, default); Assert.Equal(RoomHeatingCommandStatus.Accepted, resume.response!.Command.Status); Assert.Null(resume.response.Command.ScheduleResumed); Assert.Equal(RoomHeatingCommandStatus.Superseded, (await db.RoomHeatingCommands.FindAsync(second.response!.Command.CommandId))!.Status); Assert.Equal("ResumePending", (await service.GetCapability(fx.Room.Id, default))!.CurrentOverride!.State);
        var replay = await service.Resume(fx.Room.Id, new("resume"), null, default); Assert.Equal(resume.response.Command.CommandId, replay.response!.Command.CommandId); Assert.Equal(1, fake.ResumeCalls);
        fake.ResumeResult = new(RoomHeatingProviderOutcome.Accepted, ScheduleResumed: true, Completed: true); var confirmed = await service.Resume(fx.Room.Id, new("resume-confirmed"), null, default); Assert.Equal(RoomHeatingCommandStatus.Succeeded, confirmed.response!.Command.Status); Assert.True(confirmed.response.Command.ScheduleResumed);
    }

    [Fact]
    public async Task IdempotencyConflictDoesNotRedispatchOrMutateOriginalCommand()
    {
        using var db = Db(); var fx = Seed(db); var fake = new FakeProvider(); var service = Service(db, fake);
        var original = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "same"), null, default);
        var conflict = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "same"), null, default);
        Assert.Equal(409, conflict.status); Assert.Equal("IdempotencyKeyConflict", conflict.error); Assert.Equal(1, fake.TemporaryCalls); Assert.Equal(1, await db.RoomHeatingCommands.CountAsync()); Assert.Equal(RoomHeatingCommandStatus.Accepted, (await db.RoomHeatingCommands.FindAsync(original.response!.Command.CommandId))!.Status);
    }

    [Fact]
    public async Task FailedNewerCommandDoesNotSupersedeOrFabricateCurrentOverrideAndExceptionsAreSafe()
    {
        using var db = Db(); var fx = Seed(db); var fake = new FakeProvider(); var service = Service(db, fake); var valid = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "valid"), null, default);
        fake.ThrowOnTemporary = true; var failed = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "throws"), null, default);
        Assert.Equal(RoomHeatingCommandStatus.Failed, failed.response!.Command.Status); Assert.Equal("ProviderException", failed.response.Command.FailureCode); Assert.DoesNotContain("secret", failed.response.Command.FailureMessage!, StringComparison.OrdinalIgnoreCase); Assert.Equal(valid.response!.Command.CommandId, (await service.GetCapability(fx.Room.Id, default))!.CurrentOverride!.CommandId); Assert.Equal(RoomHeatingCommandStatus.Accepted, (await db.RoomHeatingCommands.FindAsync(valid.response.Command.CommandId))!.Status);
    }

    [Fact]
    public void PersistenceModelMatchesRoomHeatingCommandSchemaExpectations()
    {
        using var db = Db(); var entity = db.Model.FindEntityType(typeof(RoomHeatingCommand)); Assert.NotNull(entity); Assert.Equal("RoomHeatingCommands", entity!.GetTableName()); Assert.Equal(["Id"], entity.FindPrimaryKey()!.Properties.Select(p => p.Name).ToArray()); Assert.Equal(typeof(string), entity.FindProperty(nameof(RoomHeatingCommand.Action))!.GetProviderClrType()); Assert.Equal(typeof(string), entity.FindProperty(nameof(RoomHeatingCommand.Status))!.GetProviderClrType()); Assert.Equal(5, entity.FindProperty(nameof(RoomHeatingCommand.RequestedTargetTemperatureCelsius))!.GetPrecision()); Assert.Equal(2, entity.FindProperty(nameof(RoomHeatingCommand.ConfirmedTargetTemperatureCelsius))!.GetScale()); Assert.False(entity.FindProperty(nameof(RoomHeatingCommand.IdempotencyKey))!.IsNullable); Assert.False(entity.FindProperty(nameof(RoomHeatingCommand.RequestFingerprint))!.IsNullable); Assert.Equal(240, entity.FindProperty(nameof(RoomHeatingCommand.ProviderCommandReference))!.GetMaxLength()); Assert.Equal(500, entity.FindProperty(nameof(RoomHeatingCommand.FailureMessage))!.GetMaxLength()); Assert.Contains(entity.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(RoomHeatingCommand) && fk.DeleteBehavior == DeleteBehavior.Restrict); Assert.All(entity.GetForeignKeys(), fk => Assert.Equal(DeleteBehavior.Restrict, fk.DeleteBehavior)); Assert.Contains(entity.GetIndexes(), i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomHeatingCommand.HouseholdId), nameof(RoomHeatingCommand.RoomId), nameof(RoomHeatingCommand.RequestedUtc)])); Assert.Contains(entity.GetIndexes(), i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomHeatingCommand.RoomId), nameof(RoomHeatingCommand.Status), nameof(RoomHeatingCommand.EffectiveUntilUtc)])); Assert.Contains(entity.GetIndexes(), i => i.IsUnique && i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomHeatingCommand.HouseholdId), nameof(RoomHeatingCommand.RoomId), nameof(RoomHeatingCommand.IdempotencyKey)])); Assert.Contains(entity.GetIndexes(), i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomHeatingCommand.ProviderId), nameof(RoomHeatingCommand.ProviderCommandReference)]));
    }

    [Fact]
    public async Task DatabaseEnforcesUniqueHouseholdRoomIdempotencyKey()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync(); var options = new DbContextOptionsBuilder<HomeOpsDbContext>().UseSqlite(connection).Options; await using var db = new HomeOpsDbContext(options); await db.Database.EnsureCreatedAsync(); var fx = Seed(db);
        db.RoomHeatingCommands.Add(Command(fx, "dup", "a")); await db.SaveChangesAsync(); db.RoomHeatingCommands.Add(Command(fx, "dup", "b")); await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task PortabilityAndContractsExcludeOperationalCommandState()
    {
        using var db = Db(); var fx = Seed(db); var service = Service(db, new FakeProvider()); await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "heat-key"), null, default);
        var export = await CalendarPortabilityService.ExportAsync(db); var json = System.Text.Json.JsonSerializer.Serialize(export); Assert.DoesNotContain("RoomHeatingCommands", json); Assert.DoesNotContain("heat-key", json); Assert.DoesNotContain("provider-command", json); Assert.Contains("RoomClimateConfigurations", json); Assert.Contains("RoomClimateSourceMappings", json);
        var openApi = JsonNode.Parse(await File.ReadAllTextAsync(FindRepositoryFile("src/HomeOps.Contracts/openapi.json")))!; Assert.NotNull(openApi["paths"]!["/api/rooms/{roomId}/heating-control/capability"]); Assert.NotNull(openApi["paths"]!["/api/rooms/{roomId}/heating-control/temporary-warmer"]); Assert.NotNull(openApi["paths"]!["/api/rooms/{roomId}/heating-control/resume-schedule"]); Assert.NotNull(openApi["components"]!["schemas"]!["RoomHeatingCommandAction"]); Assert.NotNull(openApi["components"]!["schemas"]!["RoomHeatingCommandStatus"]);
        var client = await File.ReadAllTextAsync(FindRepositoryFile("src/HomeOps.Client/src/api/homeOpsApiClient.ts")); Assert.Contains("getRoomHeatingControlCapability(roomId: string): Promise<RoomHeatingControlCapabilityDto>", client); Assert.Contains("submitRoomHeatingTemporaryWarmer(roomId: string, request: RoomHeatingTemporaryCommandRequest): Promise<RoomHeatingCommandResponse>", client); Assert.Contains("export enum RoomHeatingCommandAction", client); Assert.DoesNotContain("submitRoomHeatingTemporaryWarmer(roomId: string, request: RoomHeatingTemporaryCommandRequest): Promise<void>", client);
    }

    private static RoomHeatingCommand Command(Fixture fx, string key, string fp) => new() { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceMappingId = fx.Mapping.Id, Action = RoomHeatingCommandAction.TemporaryWarmer, Status = RoomHeatingCommandStatus.Pending, IdempotencyKey = key, RequestFingerprint = fp, RequestedUtc = Now, UpdatedUtc = Now };
    private static RoomHeatingControlService Service(HomeOpsDbContext db, FakeProvider fake) => new(db, new FixedClock(Now), fake);
    private static HomeOpsDbContext Db() => new(new DbContextOptionsBuilder<HomeOpsDbContext>().UseInMemoryDatabase($"heating-{Guid.NewGuid()}").Options);
    private static Fixture Seed(HomeOpsDbContext db, bool secondSharedRoom = false, decimal temperature = 20)
    {
        if (!db.Households.Any(h => h.Id == SeedHousehold.Id)) db.Households.Add(new Household { Id = SeedHousehold.Id, Name = "Home", TimeZoneId = "UTC", CreatedUtc = Now, UpdatedUtc = Now }); var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = $"Floor {Guid.NewGuid():N}", SortOrder = 0, CreatedUtc = Now, UpdatedUtc = Now }; var room = new Room { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, Name = $"Room {Guid.NewGuid():N}", RoomType = RoomType.Bedroom, SortOrder = 0, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now }; var config = new RoomClimateConfiguration { RoomId = room.Id, HouseholdId = SeedHousehold.Id, IsClimateEnabled = true, MinimumPreferredTemperatureCelsius = 18, MaximumPreferredTemperatureCelsius = 22, HeatingPolicyIntent = HeatingPolicyIntent.BoundedControl, CreatedUtc = Now, UpdatedUtc = Now }; var provider = new ClimateProvider { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, DisplayName = "Provider", ProviderType = ProviderType.Other, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now }; var mapping = new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceRole = ClimateSourceRole.HeatingControl, ExternalSourceId = "climate.shared", Priority = 0, IsEnabled = true, Health = MappingHealth.Healthy, CreatedUtc = Now, UpdatedUtc = Now }; var obs = new RoomClimateObservation { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceMappingId = mapping.Id, ObservedUtc = Now.AddMinutes(-1), ReceivedUtc = Now.AddMinutes(-1), TemperatureCelsius = temperature, OperatingState = RoomClimateOperatingState.Idle, IsProviderAvailable = true, CreatedUtc = Now, UpdatedUtc = Now }; db.Floors.Add(floor); db.Rooms.Add(room); db.RoomClimateConfigurations.Add(config); db.ClimateProviders.Add(provider); db.RoomClimateSourceMappings.Add(mapping); db.RoomClimateObservations.Add(obs); Guid? shared = null; if (secondSharedRoom) { shared = Guid.NewGuid(); db.Rooms.Add(new Room { Id = shared.Value, HouseholdId = SeedHousehold.Id, FloorId = floor.Id, Name = "Shared", RoomType = RoomType.LivingRoom, SortOrder = 1, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now }); db.RoomClimateSourceMappings.Add(new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = shared.Value, ProviderId = provider.Id, SourceRole = ClimateSourceRole.HeatingControl, ExternalSourceId = mapping.ExternalSourceId, Priority = 0, IsEnabled = true, Health = MappingHealth.Healthy, CreatedUtc = Now, UpdatedUtc = Now }); } db.SaveChanges(); return new(room, config, provider, mapping, obs, shared);
    }
    private static string FindRepositoryFile(string relativePath) { var dir = new DirectoryInfo(AppContext.BaseDirectory); while (dir is not null && !File.Exists(Path.Combine(dir.FullName, relativePath))) dir = dir.Parent; return Path.Combine(dir!.FullName, relativePath); }

    private sealed record Fixture(Room Room, RoomClimateConfiguration Config, ClimateProvider Provider, RoomClimateSourceMapping Mapping, RoomClimateObservation Observation, Guid? SharedRoomId);
    private sealed class FixedClock(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
    private sealed class FakeProvider : IRoomHeatingControlProvider
    {
        public RoomHeatingControlProviderCapability Capability { get; set; } = new(true);
        public RoomHeatingProviderResult TemporaryResult { get; set; } = new(RoomHeatingProviderOutcome.Accepted, "provider-command");
        public RoomHeatingProviderResult ResumeResult { get; set; } = new(RoomHeatingProviderOutcome.Accepted, "resume-command");
        public bool ThrowOnTemporary { get; set; }
        public int TemporaryCalls { get; private set; }
        public int ResumeCalls { get; private set; }
        public List<RoomHeatingProviderContext> Contexts { get; } = [];
        public Task<RoomHeatingControlProviderCapability> GetCapabilityAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) { Contexts.Add(context); return Task.FromResult(Capability); }
        public Task<RoomHeatingProviderResult> SubmitTemporaryTargetAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) { TemporaryCalls++; Contexts.Add(context); if (ThrowOnTemporary) throw new InvalidOperationException("secret raw provider payload"); return Task.FromResult(TemporaryResult); }
        public Task<RoomHeatingProviderResult> ResumeScheduleAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) { ResumeCalls++; Contexts.Add(context); return Task.FromResult(ResumeResult); }
    }
}
