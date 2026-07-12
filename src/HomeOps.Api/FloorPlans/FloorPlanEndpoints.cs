using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public static class FloorPlanEndpoints
{
    public static IEndpointRouteBuilder MapFloorPlanEndpoints(this IEndpointRouteBuilder app)
    {
        var floors = app.MapGroup("/api/floors").WithTags("Floors");
        floors.MapGet("/", async (bool? includeArchived, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var query = db.Floors.AsNoTracking().Where(f => f.HouseholdId == SeedHousehold.Id);
            if (includeArchived != true) query = query.Where(f => !f.IsArchived);
            var activeRoomCounts = await db.Rooms.AsNoTracking().Where(r => r.HouseholdId == SeedHousehold.Id && !r.IsArchived).GroupBy(r => r.FloorId).Select(g => new { FloorId = g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.FloorId, x => x.Count, ct);
            var list = await query.OrderBy(f => f.SortOrder).ThenBy(f => f.Name).ToListAsync(ct);
            return Results.Ok(list.Select(f => ToFloorDto(f, activeRoomCounts.GetValueOrDefault(f.Id))).ToList());
        }).WithName("GetFloors").Produces<IReadOnlyCollection<FloorDto>>();
        floors.MapGet("/{floorId:guid}", async (Guid floorId, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var f = await db.Floors.AsNoTracking().FirstOrDefaultAsync(x => x.Id == floorId && x.HouseholdId == SeedHousehold.Id, ct);
            if (f is null) return Results.NotFound();
            var count = await db.Rooms.CountAsync(r => r.FloorId == f.Id && !r.IsArchived, ct);
            return Results.Ok(ToFloorDto(f, count));
        }).WithName("GetFloor").Produces<FloorDto>().Produces(404);
        floors.MapPost("/", async (CreateFloorRequest req, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var name = CleanName(req.Name); if (name is null) return Bad("name", "Floor name is required.");
            if (await ActiveFloorNameExists(db, name, null, ct)) return Bad("name", "An active floor with this exact name already exists.");
            var now = DateTimeOffset.UtcNow;
            var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = name, SortOrder = await NextFloorOrder(db, ct), CreatedUtc = now, UpdatedUtc = now };
            db.Floors.Add(floor); await db.SaveChangesAsync(ct); return Results.Created($"/api/floors/{floor.Id}", ToFloorDto(floor, 0));
        }).WithName("CreateFloor").Produces<FloorDto>(201).Produces(400);
        floors.MapPut("/{floorId:guid}", async (Guid floorId, UpdateFloorRequest req, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var floor = await db.Floors.FirstOrDefaultAsync(f => f.Id == floorId && f.HouseholdId == SeedHousehold.Id, ct); if (floor is null) return Results.NotFound();
            var name = CleanName(req.Name); if (name is null) return Bad("name", "Floor name is required.");
            if (!floor.IsArchived && await ActiveFloorNameExists(db, name, floor.Id, ct)) return Bad("name", "An active floor with this exact name already exists.");
            floor.Name = name; floor.IsEnabled = req.IsEnabled ?? floor.IsEnabled; floor.UpdatedUtc = DateTimeOffset.UtcNow; await db.SaveChangesAsync(ct);
            var count = await db.Rooms.CountAsync(r => r.FloorId == floor.Id && !r.IsArchived, ct); return Results.Ok(ToFloorDto(floor, count));
        }).WithName("UpdateFloor").Produces<FloorDto>().Produces(400).Produces(404);
        floors.MapPost("/reorder", async (ReorderFloorsRequest req, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var floorsList = await db.Floors.Where(f => f.HouseholdId == SeedHousehold.Id && !f.IsArchived).ToListAsync(ct);
            var error = ValidateFullSet(req.FloorIds, floorsList.Select(f => f.Id), "floorIds"); if (error is not null) return error;
            ApplyOrder(floorsList, req.FloorIds); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).WithName("ReorderFloors").Produces(204).Produces(400);
        floors.MapPost("/{floorId:guid}/archive", async (Guid floorId, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var floor = await db.Floors.FirstOrDefaultAsync(f => f.Id == floorId && f.HouseholdId == SeedHousehold.Id, ct); if (floor is null) return Results.NotFound();
            if (await db.Rooms.AnyAsync(r => r.FloorId == floor.Id && !r.IsArchived, ct)) return Bad("floor", "Archive active rooms before archiving this floor.");
            floor.IsArchived = true; floor.IsEnabled = false; floor.ArchivedUtc = DateTimeOffset.UtcNow; floor.UpdatedUtc = floor.ArchivedUtc.Value; await CompactFloorOrders(db, ct); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).WithName("ArchiveFloor").Produces(204).Produces(400).Produces(404);
        floors.MapPost("/{floorId:guid}/restore", async (Guid floorId, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var floor = await db.Floors.FirstOrDefaultAsync(f => f.Id == floorId && f.HouseholdId == SeedHousehold.Id, ct); if (floor is null) return Results.NotFound();
            if (await ActiveFloorNameExists(db, floor.Name, floor.Id, ct)) return Bad("name", "Rename the conflicting active floor before restoring this floor.");
            floor.IsArchived = false; floor.IsEnabled = true; floor.ArchivedUtc = null; floor.SortOrder = await NextFloorOrder(db, ct); floor.UpdatedUtc = DateTimeOffset.UtcNow; await db.SaveChangesAsync(ct); return Results.Ok(ToFloorDto(floor, await db.Rooms.CountAsync(r => r.FloorId == floor.Id && !r.IsArchived, ct)));
        }).WithName("RestoreFloor").Produces<FloorDto>().Produces(400).Produces(404);
        floors.MapDelete("/{floorId:guid}", async (Guid floorId, HomeOpsDbContext db, CancellationToken ct) =>
        {
            var floor = await db.Floors.FirstOrDefaultAsync(f => f.Id == floorId && f.HouseholdId == SeedHousehold.Id, ct); if (floor is null) return Results.NotFound();
            if (await db.Rooms.AnyAsync(r => r.FloorId == floor.Id, ct)) return Bad("floor", "A floor with rooms cannot be permanently deleted.");
            db.Floors.Remove(floor); await CompactFloorOrders(db, ct); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).WithName("DeleteFloor").Produces(204).Produces(400).Produces(404);

        floors.MapGet("/{floorId:guid}/rooms", ListRooms).WithName("GetFloorRooms").Produces<IReadOnlyCollection<RoomDto>>().Produces(404);
        floors.MapPost("/{floorId:guid}/rooms", CreateRoom).WithName("CreateRoom").Produces<RoomDto>(201).Produces(400).Produces(404);
        MapRoomEndpoints(app);
        return app;
    }

    private static void MapRoomEndpoints(IEndpointRouteBuilder app)
    {
        var rooms = app.MapGroup("/api/rooms").WithTags("Rooms");
        rooms.MapGet("/{roomId:guid}", async (Guid roomId, HomeOpsDbContext db, CancellationToken ct) => { var room = await RoomQuery(db).FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id, ct); return room is null ? Results.NotFound() : Results.Ok(ToRoomDto(room)); }).WithName("GetRoom").Produces<RoomDto>().Produces(404);
        rooms.MapPut("/{roomId:guid}", UpdateRoom).WithName("UpdateRoom").Produces<RoomDto>().Produces(400).Produces(404);
        rooms.MapPost("/reorder", ReorderRooms).WithName("ReorderRooms").Produces(204).Produces(400).Produces(404);
        rooms.MapPost("/{roomId:guid}/move", MoveRoom).WithName("MoveRoom").Produces<RoomDto>().Produces(400).Produces(404);
        rooms.MapPost("/{roomId:guid}/archive", ArchiveRoom).WithName("ArchiveRoom").Produces(204).Produces(404);
        rooms.MapPost("/{roomId:guid}/restore", RestoreRoom).WithName("RestoreRoom").Produces<RoomDto>().Produces(400).Produces(404);
        rooms.MapDelete("/{roomId:guid}", async (Guid roomId, HomeOpsDbContext db, CancellationToken ct) => { var room = await db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id, ct); if (room is null) return Results.NotFound(); db.Rooms.Remove(room); await CompactRoomOrders(db, room.FloorId, ct); await db.SaveChangesAsync(ct); return Results.NoContent(); }).WithName("DeleteRoom").Produces(204).Produces(404);
    }
    private static async Task<IResult> ListRooms(Guid floorId, bool? includeArchived, HomeOpsDbContext db, CancellationToken ct)
    {
        if (!await db.Floors.AnyAsync(f => f.Id == floorId && f.HouseholdId == SeedHousehold.Id, ct)) return Results.NotFound();
        var q = RoomQuery(db).Where(r => r.FloorId == floorId && r.HouseholdId == SeedHousehold.Id); if (includeArchived != true) q = q.Where(r => !r.IsArchived);
        return Results.Ok((await q.OrderBy(r => r.SortOrder).ThenBy(r => r.Name).ToListAsync(ct)).Select(ToRoomDto).ToList());
    }
    private static async Task<IResult> CreateRoom(Guid floorId, CreateRoomRequest req, HomeOpsDbContext db, CancellationToken ct)
    {
        var floor = await db.Floors.FirstOrDefaultAsync(f => f.Id == floorId && f.HouseholdId == SeedHousehold.Id, ct); if (floor is null) return Results.NotFound(); if (floor.IsArchived || !floor.IsEnabled) return Bad("floorId", "Room requires an active floor.");
        var name = CleanName(req.Name); if (name is null) return Bad("name", "Room name is required.");
        if (await ActiveRoomNameExists(db, floorId, name, null, ct)) return Bad("name", "An active room with this exact name already exists on this floor.");
        var fm = await ValidateFamilyMember(db, req.FamilyMemberId, ct); if (fm.Invalid is not null) return fm.Invalid;
        var now = DateTimeOffset.UtcNow; var room = new Room { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floorId, Name = name, RoomType = req.RoomType, FamilyMemberId = fm.Id, SortOrder = await NextRoomOrder(db, floorId, ct), CreatedUtc = now, UpdatedUtc = now };
        db.Rooms.Add(room); await db.SaveChangesAsync(ct); room.FamilyMember = fm.Member; return Results.Created($"/api/rooms/{room.Id}", ToRoomDto(room));
    }
    private static async Task<IResult> UpdateRoom(Guid roomId, UpdateRoomRequest req, HomeOpsDbContext db, CancellationToken ct)
    {
        var room = await db.Rooms.Include(r => r.FamilyMember).FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id, ct); if (room is null) return Results.NotFound();
        var name = CleanName(req.Name); if (name is null) return Bad("name", "Room name is required.");
        if (!room.IsArchived && await ActiveRoomNameExists(db, room.FloorId, name, room.Id, ct)) return Bad("name", "An active room with this exact name already exists on this floor.");
        var fm = await ValidateFamilyMember(db, req.FamilyMemberId, ct); if (fm.Invalid is not null) return fm.Invalid;
        room.Name = name; room.RoomType = req.RoomType; room.FamilyMemberId = fm.Id; room.FamilyMember = fm.Member; room.IsEnabled = req.IsEnabled ?? room.IsEnabled; room.UpdatedUtc = DateTimeOffset.UtcNow; await db.SaveChangesAsync(ct); return Results.Ok(ToRoomDto(room));
    }
    private static async Task<IResult> ReorderRooms(ReorderRoomsRequest req, HomeOpsDbContext db, CancellationToken ct)
    {
        var floor = await db.Floors.AnyAsync(f => f.Id == req.FloorId && f.HouseholdId == SeedHousehold.Id, ct); if (!floor) return Results.NotFound();
        var roomList = await db.Rooms.Where(r => r.FloorId == req.FloorId && r.HouseholdId == SeedHousehold.Id && !r.IsArchived).ToListAsync(ct);
        var error = ValidateFullSet(req.RoomIds, roomList.Select(r => r.Id), "roomIds"); if (error is not null) return error; ApplyOrder(roomList, req.RoomIds); await db.SaveChangesAsync(ct); return Results.NoContent();
    }
    private static async Task<IResult> MoveRoom(Guid roomId, MoveRoomRequest req, HomeOpsDbContext db, CancellationToken ct)
    {
        var room = await db.Rooms.Include(r => r.FamilyMember).FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id, ct); if (room is null) return Results.NotFound();
        var dest = await db.Floors.FirstOrDefaultAsync(f => f.Id == req.DestinationFloorId && f.HouseholdId == SeedHousehold.Id, ct); if (dest is null) return Results.NotFound(); if (dest.IsArchived || !dest.IsEnabled) return Bad("destinationFloorId", "Destination floor must be active.");
        if (await ActiveRoomNameExists(db, dest.Id, room.Name, room.Id, ct)) return Bad("name", "Destination floor already has an active room with this exact name.");
        var source = room.FloorId; room.FloorId = dest.Id; room.SortOrder = await NextRoomOrder(db, dest.Id, ct); room.UpdatedUtc = DateTimeOffset.UtcNow; await CompactRoomOrders(db, source, ct); await db.SaveChangesAsync(ct); return Results.Ok(ToRoomDto(room));
    }
    private static async Task<IResult> ArchiveRoom(Guid roomId, HomeOpsDbContext db, CancellationToken ct) { var room = await db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id, ct); if (room is null) return Results.NotFound(); room.IsArchived = true; room.IsEnabled = false; room.ArchivedUtc = DateTimeOffset.UtcNow; room.UpdatedUtc = room.ArchivedUtc.Value; await CompactRoomOrders(db, room.FloorId, ct); await db.SaveChangesAsync(ct); return Results.NoContent(); }
    private static async Task<IResult> RestoreRoom(Guid roomId, HomeOpsDbContext db, CancellationToken ct)
    {
        var room = await db.Rooms.Include(r => r.FamilyMember).FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id, ct); if (room is null) return Results.NotFound();
        var floor = await db.Floors.FirstOrDefaultAsync(f => f.Id == room.FloorId && f.HouseholdId == SeedHousehold.Id, ct); if (floor is null || floor.IsArchived || !floor.IsEnabled) return Bad("floorId", "Room can only be restored into an active floor.");
        if (await ActiveRoomNameExists(db, room.FloorId, room.Name, room.Id, ct)) return Bad("name", "Rename the conflicting active room before restoring this room.");
        room.IsArchived = false; room.IsEnabled = true; room.ArchivedUtc = null; room.SortOrder = await NextRoomOrder(db, room.FloorId, ct); room.UpdatedUtc = DateTimeOffset.UtcNow; await db.SaveChangesAsync(ct); return Results.Ok(ToRoomDto(room));
    }
    private static IQueryable<Room> RoomQuery(HomeOpsDbContext db) => db.Rooms.AsNoTracking().Include(r => r.FamilyMember);
    private static string? CleanName(string? name) { var c = name?.Trim(); return string.IsNullOrWhiteSpace(c) ? null : c; }
    private static async Task<bool> ActiveFloorNameExists(HomeOpsDbContext db, string name, Guid? excluding, CancellationToken ct) => await db.Floors.AnyAsync(f => f.HouseholdId == SeedHousehold.Id && !f.IsArchived && f.Id != excluding && f.Name == name, ct);
    private static async Task<bool> ActiveRoomNameExists(HomeOpsDbContext db, Guid floorId, string name, Guid? excluding, CancellationToken ct) => await db.Rooms.AnyAsync(r => r.HouseholdId == SeedHousehold.Id && r.FloorId == floorId && !r.IsArchived && r.Id != excluding && r.Name == name, ct);
    private static async Task<int> NextFloorOrder(HomeOpsDbContext db, CancellationToken ct) => (await db.Floors.Where(f => f.HouseholdId == SeedHousehold.Id && !f.IsArchived).MaxAsync(f => (int?)f.SortOrder, ct) ?? -1) + 1;
    private static async Task<int> NextRoomOrder(HomeOpsDbContext db, Guid floorId, CancellationToken ct) => (await db.Rooms.Where(r => r.FloorId == floorId && !r.IsArchived).MaxAsync(r => (int?)r.SortOrder, ct) ?? -1) + 1;
    private static async Task CompactFloorOrders(HomeOpsDbContext db, CancellationToken ct) { var items = await db.Floors.Where(f => f.HouseholdId == SeedHousehold.Id && !f.IsArchived).OrderBy(f => f.SortOrder).ThenBy(f => f.Name).ToListAsync(ct); for (var i=0;i<items.Count;i++) items[i].SortOrder=i; }
    private static async Task CompactRoomOrders(HomeOpsDbContext db, Guid floorId, CancellationToken ct) { var items = await db.Rooms.Where(r => r.FloorId == floorId && !r.IsArchived).OrderBy(r => r.SortOrder).ThenBy(r => r.Name).ToListAsync(ct); for (var i=0;i<items.Count;i++) items[i].SortOrder=i; }
    private static IResult? ValidateFullSet(IReadOnlyList<Guid> supplied, IEnumerable<Guid> expected, string field) { if (supplied.Count != supplied.Distinct().Count()) return Bad(field, "Duplicate ids are not allowed."); var exp = expected.ToHashSet(); return supplied.ToHashSet().SetEquals(exp) ? null : Bad(field, "Reorder ids must exactly match the active items in scope."); }
    private static void ApplyOrder<T>(IEnumerable<T> items, IReadOnlyList<Guid> ordered) where T : class { var prop = typeof(T).GetProperty("Id")!; var order = typeof(T).GetProperty("SortOrder")!; var map = ordered.Select((id,i)=>(id,i)).ToDictionary(x=>x.id,x=>x.i); foreach (var item in items) order.SetValue(item, map[(Guid)prop.GetValue(item)!]); }
    private sealed record FamilyMemberValidation(string? Id, FamilyMembers.FamilyMember? Member, IResult? Invalid);
    private static async Task<FamilyMemberValidation> ValidateFamilyMember(HomeOpsDbContext db, string? id, CancellationToken ct) { if (string.IsNullOrWhiteSpace(id)) return new(null, null, null); var member = await db.FamilyMembers.FirstOrDefaultAsync(m => m.Id == id.Trim() && m.HouseholdId == SeedHousehold.Id, ct); if (member is null || member.IsDeleted) return new(null, null, Bad("familyMemberId", "Family member must belong to this household and be active.")); return new(member.Id, member, null); }
    private static FloorDto ToFloorDto(Floor f, int count) => new(f.Id, f.Name, f.SortOrder, f.IsEnabled, f.IsArchived, f.ArchivedUtc, f.CreatedUtc, f.UpdatedUtc, count);
    private static RoomDto ToRoomDto(Room r) => new(r.Id, r.FloorId, r.Name, r.RoomType, r.SortOrder, r.FamilyMember is null ? null : new RoomFamilyMemberDto(r.FamilyMember.Id, r.FamilyMember.Name), r.IsEnabled, r.IsArchived, r.ArchivedUtc, r.CreatedUtc, r.UpdatedUtc);
    private static IResult Bad(string field, string message) => Results.BadRequest(new Dictionary<string, string[]> { [field] = [message] });
}
