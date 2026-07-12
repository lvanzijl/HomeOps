namespace HomeOps.Api.FloorPlans;

public sealed record FloorDto(Guid Id, string Name, int SortOrder, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, int ActiveRoomCount);
public sealed record CreateFloorRequest(string Name);
public sealed record UpdateFloorRequest(string Name, bool? IsEnabled = null);
public sealed record ReorderFloorsRequest(IReadOnlyList<Guid> FloorIds);

public sealed record RoomFamilyMemberDto(string Id, string Name);
public sealed record RoomDto(Guid Id, Guid FloorId, string Name, RoomType RoomType, int SortOrder, RoomFamilyMemberDto? FamilyMember, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record CreateRoomRequest(string Name, RoomType RoomType, string? FamilyMemberId = null);
public sealed record UpdateRoomRequest(string Name, RoomType RoomType, string? FamilyMemberId = null, bool? IsEnabled = null);
public sealed record ReorderRoomsRequest(Guid FloorId, IReadOnlyList<Guid> RoomIds);
public sealed record MoveRoomRequest(Guid DestinationFloorId);
