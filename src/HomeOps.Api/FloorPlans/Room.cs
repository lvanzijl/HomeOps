using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public sealed class Room
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid FloorId { get; set; }
    public Floor? Floor { get; set; }
    public string Name { get; set; } = string.Empty;
    public RoomType RoomType { get; set; } = RoomType.Other;
    public int SortOrder { get; set; }
    public string? FamilyMemberId { get; set; }
    public FamilyMember? FamilyMember { get; set; }
    public bool IsEnabled { get; set; } = true;
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
