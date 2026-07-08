using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.Households;

namespace HomeOps.Api.FamilyMembers;

public sealed class FamilyMember
{
    public string Id { get; set; } = string.Empty;
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayColor { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public FamilyMemberKind MemberKind { get; set; } = FamilyMemberKind.Child;
    public DateOnly? DateOfBirth { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public AvatarV2Config? AvatarV2Config { get; set; }
    public AvatarSelection? AvatarSelection { get; set; }
}
