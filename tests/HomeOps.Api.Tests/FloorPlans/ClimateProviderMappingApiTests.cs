using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Tests.Lists;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class ClimateProviderMappingApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HomeOpsWebApplicationFactory _factory = factory;
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task ProviderAndMappingLifecycleSupportsPrioritySharedZonesAndCapabilitySummary()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var floor = await CreateFloor($"Climate floor {suffix}");
        var room = await CreateRoom(floor.Id, $"Climate room {suffix}");
        var otherRoom = await CreateRoom(floor.Id, $"Shared room {suffix}");
        await ConfigureClimate(room.Id, HeatingPolicyIntent.BoundedControl);
        await ConfigureClimate(otherRoom.Id, HeatingPolicyIntent.BoundedControl);
        var provider = await CreateProvider($"HA {suffix}");

        var comfort = await CreateMapping(room.Id, provider.Id, ClimateSourceRole.ComfortTemperature, "sensor.comfort", 0);
        var control = await CreateMapping(room.Id, provider.Id, ClimateSourceRole.HeatingControlTemperature, "climate.zone", 1);
        Assert.Equal(MappingHealth.Unverified, comfort.Health);
        Assert.NotEqual(comfort.Id, control.Id);

        var shared = await CreateMapping(otherRoom.Id, provider.Id, ClimateSourceRole.HeatingControlTemperature, "climate.zone", 0);
        var refreshed = await _client.GetFromJsonAsync<ClimateMappingDto>($"/api/climate-mappings/{control.Id}");
        Assert.NotNull(refreshed);
        Assert.True(refreshed.IsSharedSource);
        Assert.Contains(otherRoom.Id, refreshed.SharedRoomIds);

        var duplicate = await _client.PostAsJsonAsync($"/api/rooms/{room.Id}/climate-mappings", new CreateClimateMappingRequest(provider.Id, ClimateSourceRole.ComfortTemperature, new ExternalSourceReferenceDto("sensor.comfort")));
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);

        var summary = await _client.GetFromJsonAsync<ClimateCapabilitySummaryDto>($"/api/rooms/{room.Id}/climate-capabilities");
        Assert.NotNull(summary);
        Assert.Contains(summary.Roles, role => role.Role == ClimateSourceRole.ComfortTemperature && role.Status == "Unverified");
        Assert.Contains(summary.Roles, role => role.Role == ClimateSourceRole.HeatingControlTemperature && role.HasSharedSource);

        var deleteProvider = await _client.DeleteAsync($"/api/climate-providers/{provider.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, deleteProvider.StatusCode);

        var deleteClimate = await _client.DeleteAsync($"/api/rooms/{room.Id}/climate-configuration");
        Assert.Equal(HttpStatusCode.BadRequest, deleteClimate.StatusCode);
    }

    [Fact]
    public async Task MappingLifecyclePreservesDiagnosticsAndEnforcesPriorityAndRestoreDependencies()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var floor = await CreateFloor($"Lifecycle floor {suffix}");
        var room = await CreateRoom(floor.Id, $"Lifecycle room {suffix}");
        await ConfigureClimate(room.Id, HeatingPolicyIntent.None);
        var provider = await CreateProvider($"Lifecycle HA {suffix}");
        var primary = await CreateMapping(room.Id, provider.Id, ClimateSourceRole.ComfortTemperature, $"sensor.primary_{suffix}", 0);
        var secondary = await CreateMapping(room.Id, provider.Id, ClimateSourceRole.ComfortTemperature, $"sensor.secondary_{suffix}", 1);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var stored = await db.RoomClimateSourceMappings.SingleAsync(mapping => mapping.Id == primary.Id);
            stored.DiagnosticSummary = "Provider-owned safe diagnostic";
            await db.SaveChangesAsync();
        }

        var conflict = await _client.PutAsJsonAsync($"/api/climate-mappings/{secondary.Id}", new UpdateClimateMappingRequest(Priority: 0));
        Assert.Equal(HttpStatusCode.BadRequest, conflict.StatusCode);

        var update = await _client.PutAsJsonAsync($"/api/climate-mappings/{primary.Id}", new UpdateClimateMappingRequest(new ExternalSourceReferenceDto($"sensor.updated_{suffix}", "Updated sensor"), 0, false));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var updated = (await update.Content.ReadFromJsonAsync<ClimateMappingDto>())!;
        Assert.False(updated.IsEnabled);
        Assert.Equal("Provider-owned safe diagnostic", updated.DiagnosticSummary);
        Assert.Equal(MappingHealth.NeedsReview, updated.Health);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsync($"/api/climate-mappings/{primary.Id}/archive", null)).StatusCode);
        var reprioritize = await _client.PutAsJsonAsync($"/api/climate-mappings/{secondary.Id}", new UpdateClimateMappingRequest(Priority: 0));
        Assert.Equal(HttpStatusCode.OK, reprioritize.StatusCode);

        var unconfirmedArchive = await _client.PostAsJsonAsync($"/api/climate-providers/{provider.Id}/archive", new ArchiveClimateProviderRequest(false));
        Assert.Equal(HttpStatusCode.BadRequest, unconfirmedArchive.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsJsonAsync($"/api/climate-providers/{provider.Id}/archive", new ArchiveClimateProviderRequest(true))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/climate-mappings/{primary.Id}/restore", null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsync($"/api/climate-providers/{provider.Id}/restore", null)).StatusCode);

        var restoredSecondary = await _client.GetFromJsonAsync<ClimateMappingDto>($"/api/climate-mappings/{secondary.Id}");
        Assert.NotNull(restoredSecondary);
        Assert.Equal(MappingHealth.Unverified, restoredSecondary.Health);
        Assert.Null(restoredSecondary.LastCheckedUtc);

        var restore = await _client.PostAsync($"/api/climate-mappings/{primary.Id}/restore", null);
        Assert.Equal(HttpStatusCode.OK, restore.StatusCode);
        var restored = (await restore.Content.ReadFromJsonAsync<ClimateMappingDto>())!;
        Assert.True(restored.IsEnabled);
        Assert.False(restored.IsArchived);
        Assert.Equal(1, restored.Priority);
        Assert.Equal(MappingHealth.NeedsReview, restored.Health);
    }

    [Fact]
    public async Task ProviderManagementExposesOnlyCredentialPresenceAndDependencyCounts()
    {
        const string secret = "raw-token-must-never-round-trip";
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var floor = await CreateFloor($"Secret floor {suffix}");
        var room = await CreateRoom(floor.Id, $"Secret room {suffix}");
        await ConfigureClimate(room.Id, HeatingPolicyIntent.None);

        var embeddedCredential = await _client.PostAsJsonAsync("/api/climate-providers", new CreateClimateProviderRequest($"Unsafe HA {suffix}", ProviderType.HomeAssistant, $"https://user:{secret}@ha.local"));
        Assert.Equal(HttpStatusCode.BadRequest, embeddedCredential.StatusCode);
        Assert.DoesNotContain(secret, await embeddedCredential.Content.ReadAsStringAsync());

        var response = await _client.PostAsJsonAsync("/api/climate-providers", new
        {
            displayName = $"Secret HA {suffix}",
            providerType = ProviderType.HomeAssistant,
            externalInstanceReference = "https://ha.local",
            diagnosticMetadata = secret
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var provider = (await response.Content.ReadFromJsonAsync<ClimateProviderDto>())!;
        Assert.Equal("HOMEASSISTANT__ACCESSTOKEN", provider.CredentialConfigurationKey);
        Assert.DoesNotContain(secret, await response.Content.ReadAsStringAsync());

        await CreateMapping(room.Id, provider.Id, ClimateSourceRole.ComfortTemperature, $"sensor.secret_{suffix}", 0);
        var listed = (await _client.GetFromJsonAsync<List<ClimateProviderDto>>("/api/climate-providers?includeArchived=true"))!.Single(item => item.Id == provider.Id);
        Assert.Equal(1, listed.ActiveMappingCount);
        Assert.Equal(0, listed.ArchivedMappingCount);
        Assert.Equal(1, listed.MappedRoomCount);

        var credential = await _client.GetFromJsonAsync<HomeAssistantCredentialStatusDto>("/api/climate-providers/home-assistant/credential-status");
        Assert.NotNull(credential);
        Assert.Equal("HOMEASSISTANT__ACCESSTOKEN", credential.ConfigurationKey);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.Null((await db.ClimateProviders.SingleAsync(item => item.Id == provider.Id)).DiagnosticMetadata);
    }

    private async Task<FloorDto> CreateFloor(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest(name));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<FloorDto>())!;
    }

    private async Task<RoomDto> CreateRoom(Guid floorId, string name)
    {
        var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/rooms", new CreateRoomRequest(name, RoomType.Other));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<RoomDto>())!;
    }

    private async Task ConfigureClimate(Guid roomId, HeatingPolicyIntent intent)
    {
        var response = await _client.PutAsJsonAsync($"/api/rooms/{roomId}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, new ClimateRangeDto(18, 22), new ClimateRangeDto(35, 60), intent));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<ClimateProviderDto> CreateProvider(string displayName)
    {
        var response = await _client.PostAsJsonAsync("/api/climate-providers", new CreateClimateProviderRequest(displayName, ProviderType.HomeAssistant, "http://ha.local:8123"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<ClimateProviderDto>())!;
    }

    private async Task<ClimateMappingDto> CreateMapping(Guid roomId, Guid providerId, ClimateSourceRole role, string sourceId, int priority)
    {
        var response = await _client.PostAsJsonAsync($"/api/rooms/{roomId}/climate-mappings", new CreateClimateMappingRequest(providerId, role, new ExternalSourceReferenceDto(sourceId), priority));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<ClimateMappingDto>())!;
    }
}
