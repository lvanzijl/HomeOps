using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Tests.Lists;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class FloorPlanApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task FloorLifecycleValidatesNamesOrderingArchiveAndDeleteSafety()
    {
        var first = await CreateFloor("  First  ");
        var second = await CreateFloor("Second");
        Assert.Equal("First", first.Name);
        Assert.True(second.SortOrder > first.SortOrder);

        var duplicate = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest("First"));
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);

        var current = await _client.GetFromJsonAsync<FloorDto[]>("/api/floors");
        Assert.NotNull(current);
        var reorderedIds = current.Select(f => f.Id).Where(id => id != first.Id && id != second.Id).Concat(new[] { second.Id, first.Id }).ToArray();
        var reorder = await _client.PostAsJsonAsync("/api/floors/reorder", new ReorderFloorsRequest(reorderedIds));
        Assert.Equal(HttpStatusCode.NoContent, reorder.StatusCode);
        var floors = await _client.GetFromJsonAsync<FloorDto[]>("/api/floors");
        Assert.NotNull(floors);
        Assert.Equal(second.Id, floors[^2].Id);
        Assert.Equal(first.Id, floors[^1].Id);

        var room = await CreateRoom(first.Id, "Bedroom", RoomType.Bedroom, "riley");
        Assert.Equal("riley", room.FamilyMember?.Id);
        var blockedArchive = await _client.PostAsync($"/api/floors/{first.Id}/archive", null);
        Assert.Equal(HttpStatusCode.BadRequest, blockedArchive.StatusCode);
        var blockedDelete = await _client.DeleteAsync($"/api/floors/{first.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, blockedDelete.StatusCode);
    }

    [Fact]
    public async Task RoomLifecycleSupportsSameNameDifferentFloorsReorderMoveArchiveAndRestore()
    {
        var upstairs = await CreateFloor("Upstairs");
        var downstairs = await CreateFloor("Downstairs");
        var bedroom = await CreateRoom(upstairs.Id, "Bedroom", RoomType.Bedroom, null);
        var office = await CreateRoom(upstairs.Id, "Office", RoomType.Office, null);
        var otherBedroom = await CreateRoom(downstairs.Id, "Bedroom", RoomType.Other, null);
        Assert.Equal(RoomType.Other, otherBedroom.RoomType);

        var duplicate = await _client.PostAsJsonAsync($"/api/floors/{upstairs.Id}/rooms", new CreateRoomRequest("Bedroom", RoomType.Bedroom));
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);

        var reorder = await _client.PostAsJsonAsync("/api/rooms/reorder", new ReorderRoomsRequest(upstairs.Id, [office.Id, bedroom.Id]));
        Assert.Equal(HttpStatusCode.NoContent, reorder.StatusCode);

        var conflict = await _client.PostAsJsonAsync($"/api/rooms/{bedroom.Id}/move", new MoveRoomRequest(downstairs.Id));
        Assert.Equal(HttpStatusCode.BadRequest, conflict.StatusCode);
        await _client.PutAsJsonAsync($"/api/rooms/{bedroom.Id}", new UpdateRoomRequest("Guest room", RoomType.Bedroom));
        var movedResponse = await _client.PostAsJsonAsync($"/api/rooms/{bedroom.Id}/move", new MoveRoomRequest(downstairs.Id));
        Assert.Equal(HttpStatusCode.OK, movedResponse.StatusCode);
        var moved = await movedResponse.Content.ReadFromJsonAsync<RoomDto>();
        Assert.NotNull(moved);
        Assert.Equal(bedroom.Id, moved.Id);
        Assert.Equal(downstairs.Id, moved.FloorId);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsync($"/api/rooms/{moved.Id}/archive", null)).StatusCode);
        var restore = await _client.PostAsync($"/api/rooms/{moved.Id}/restore", null);
        Assert.Equal(HttpStatusCode.OK, restore.StatusCode);
    }


    [Fact]
    public async Task BackupExportIncludesFloorsAndRoomsWithOrderingArchiveStateAndFamilyMemberAssociation()
    {
        var floor = await CreateFloor("Backup floor");
        var room = await CreateRoom(floor.Id, "Backup room", RoomType.UtilityRoom, "alex");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);

        Assert.Contains(export.Calendar.Floors ?? [], exported => exported.Id == floor.Id && exported.Name == "Backup floor");
        Assert.Contains(export.Calendar.Rooms ?? [], exported => exported.Id == room.Id && exported.FloorId == floor.Id && exported.RoomType == RoomType.UtilityRoom.ToString() && exported.FamilyMemberId == "alex");
    }

    private async Task<FloorDto> CreateFloor(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest(name));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<FloorDto>())!;
    }

    private async Task<RoomDto> CreateRoom(Guid floorId, string name, RoomType roomType, string? familyMemberId)
    {
        var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/rooms", new CreateRoomRequest(name, roomType, familyMemberId));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<RoomDto>())!;
    }
}
