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
    public FamilyMemberAgeGroup AgeGroup { get; set; } = FamilyMemberAgeGroup.Child;
    public FamilyMemberPresentation Presentation { get; set; } = FamilyMemberPresentation.Neutral;
    public string SkinTone { get; set; } = string.Empty;
    public string HairColor { get; set; } = string.Empty;
    public FamilyMemberHairStyle HairStyle { get; set; } = FamilyMemberHairStyle.Short;
    public bool Glasses { get; set; }
    public string ShirtColor { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public AvatarV2Config? AvatarV2Config { get; set; }
}
