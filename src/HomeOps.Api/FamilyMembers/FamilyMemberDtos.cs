namespace HomeOps.Api.FamilyMembers;

public sealed record FamilyMemberAvatarDto(
    FamilyMemberAgeGroup AgeGroup,
    FamilyMemberPresentation Presentation,
    string SkinTone,
    string HairColor,
    FamilyMemberHairStyle HairStyle,
    bool Glasses,
    string ShirtColor);

public sealed record FamilyMemberDto(
    string Id,
    string Name,
    string DisplayColor,
    string Initials,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    FamilyMemberAvatarDto Avatar);

public sealed record CreateFamilyMemberRequest(
    string Name,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    string? DisplayColor,
    string? Initials,
    FamilyMemberAvatarDto? Avatar);

public sealed record UpdateFamilyMemberRequest(
    string Name,
    string DisplayColor,
    string Initials,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    FamilyMemberAvatarDto Avatar);
