using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomClimateConfigurationApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task LifecycleSupportsMissingCreateUpdateDisableReenableDeleteAndDerivedRoles()
    {
        var floor = await CreateFloor("Climate floor");
        var room = await CreateRoom(floor.Id, "Bedroom", RoomType.Bedroom);

        var missing = await _client.GetFromJsonAsync<RoomClimateConfigurationDto>($"/api/rooms/{room.Id}/climate-configuration");
        Assert.NotNull(missing);
        Assert.False(missing!.IsConfigured);

        var createdResponse = await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true));
        createdResponse.EnsureSuccessStatusCode();
        var created = await createdResponse.Content.ReadFromJsonAsync<RoomClimateConfigurationDto>();
        Assert.True(created!.IsConfigured);
        Assert.True(created.IsClimateEnabled);
        Assert.Empty(created.RequiredSourceRoles);

        var updatedResponse = await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, true, new ClimateRangeDto(18, 21), new ClimateRangeDto(40, 60), HeatingPolicyIntent.ReadOnlyStatus));
        updatedResponse.EnsureSuccessStatusCode();
        var updated = await updatedResponse.Content.ReadFromJsonAsync<RoomClimateConfigurationDto>();
        Assert.Equal(new ClimateRangeDto(18, 21), updated!.TemperatureRange);
        Assert.Equal(new ClimateRangeDto(40, 60), updated.HumidityRange);
        Assert.Equal(HeatingPolicyIntent.ReadOnlyStatus, updated.HeatingPolicyIntent);
        Assert.Contains(ClimateSourceRole.ComfortTemperature, updated.RequiredSourceRoles);
        Assert.Contains(ClimateSourceRole.Humidity, updated.RequiredSourceRoles);
        Assert.Contains(ClimateSourceRole.HeatingStatus, updated.RequiredSourceRoles);

        var disabled = await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(false));
        disabled.EnsureSuccessStatusCode();
        Assert.False((await disabled.Content.ReadFromJsonAsync<RoomClimateConfigurationDto>())!.IsClimateEnabled);

        var reenabled = await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, new ClimateRangeDto(19, 22)));
        reenabled.EnsureSuccessStatusCode();
        Assert.True((await reenabled.Content.ReadFromJsonAsync<RoomClimateConfigurationDto>())!.IsClimateEnabled);

        var deleted = await _client.DeleteAsync($"/api/rooms/{room.Id}/climate-configuration");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        var afterDelete = await _client.GetFromJsonAsync<RoomClimateConfigurationDto>($"/api/rooms/{room.Id}/climate-configuration");
        Assert.False(afterDelete!.IsConfigured);
    }

    [Fact]
    public async Task ValidationRejectsInvalidRangesAndUnsupportedLifecycleStates()
    {
        var floor = await CreateFloor("Validation floor");
        var room = await CreateRoom(floor.Id, "Nursery", RoomType.Bedroom);

        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, new ClimateRangeDto(21, 21)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, new ClimateRangeDto(-31, 20)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, null, new ClimateRangeDto(80, 60)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, null, new ClimateRangeDto(-1, 50)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(false, true))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, null, null, HeatingPolicyIntent.BoundedControl))).StatusCode);

        await _client.PostAsync($"/api/rooms/{room.Id}/archive", null);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true))).StatusCode);
    }

    [Fact]
    public async Task RoomArchiveRestoreAndMovePreserveClimateConfiguration()
    {
        var first = await CreateFloor("First climate move");
        var second = await CreateFloor("Second climate move");
        var room = await CreateRoom(first.Id, "Office climate", RoomType.Office);
        await (await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(true, false, new ClimateRangeDto(19, 22), null, HeatingPolicyIntent.BoundedControl))).Content.ReadAsStringAsync();

        await _client.PostAsync($"/api/rooms/{room.Id}/archive", null);
        await _client.PostAsync($"/api/rooms/{room.Id}/restore", null);
        await _client.PostAsJsonAsync($"/api/rooms/{room.Id}/move", new MoveRoomRequest(second.Id));

        var config = await _client.GetFromJsonAsync<RoomClimateConfigurationDto>($"/api/rooms/{room.Id}/climate-configuration");
        Assert.True(config!.IsConfigured);
        Assert.Equal(HeatingPolicyIntent.BoundedControl, config.HeatingPolicyIntent);
        Assert.Contains(ClimateSourceRole.HeatingControl, config.RequiredSourceRoles);
    }

    [Fact]
    public async Task BackupRestoreExportsValidatesAndAtomicallyReplacesClimateConfiguration()
    {
        var floor = await CreateFloor("Climate portability floor");
        var room = await CreateRoom(floor.Id, "Climate portability room", RoomType.LivingRoom);
        await _client.PutAsJsonAsync($"/api/rooms/{room.Id}/climate-configuration", new UpsertRoomClimateConfigurationRequest(false, false, new ClimateRangeDto(17, 23), new ClimateRangeDto(35, 65), HeatingPolicyIntent.ReadOnlyStatus));

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var export = await CalendarPortabilityService.ExportAsync(db);
        var exported = Assert.Single(export.Calendar.RoomClimateConfigurations!);
        Assert.Equal(room.Id, exported.RoomId);
        Assert.False(exported.IsClimateEnabled);
        Assert.Equal("ReadOnlyStatus", exported.HeatingPolicyIntent);

        var duplicate = export with { Calendar = export.Calendar with { RoomClimateConfigurations = [exported, exported] } };
        Assert.False((await CalendarPortabilityService.RestoreAsync(db, duplicate)).Succeeded);
        Assert.Single(await db.RoomClimateConfigurations.Where(config => config.RoomId == room.Id).ToListAsync());

        var invalid = export with { Calendar = export.Calendar with { RoomClimateConfigurations = [exported with { MinimumPreferredRelativeHumidity = 90, MaximumPreferredRelativeHumidity = 10 }] } };
        Assert.False((await CalendarPortabilityService.RestoreAsync(db, invalid)).Succeeded);
        Assert.Single(await db.RoomClimateConfigurations.Where(config => config.RoomId == room.Id).ToListAsync());

        var empty = export with { Calendar = export.Calendar with { RoomClimateConfigurations = [] } };
        Assert.True((await CalendarPortabilityService.RestoreAsync(db, empty)).Succeeded);
        Assert.Empty(await db.RoomClimateConfigurations.Where(config => config.HouseholdId == SeedHousehold.Id).ToListAsync());
    }

    private async Task<FloorDto> CreateFloor(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest(name));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FloorDto>())!;
    }

    private async Task<RoomDto> CreateRoom(Guid floorId, string name, RoomType roomType)
    {
        var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/rooms", new CreateRoomRequest(name, roomType));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RoomDto>())!;
    }
}
