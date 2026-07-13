using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Tests.Lists;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class ClimateProviderMappingApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
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
        var response = await _client.PostAsJsonAsync("/api/climate-providers", new CreateClimateProviderRequest(displayName, ProviderType.HomeAssistant));
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
