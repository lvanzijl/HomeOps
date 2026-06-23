namespace HomeOps.Api.FamilyMembers;

public sealed record AvatarV2ConfigDto(
    string HeadVariant,
    string HairStyle,
    string HairColor,
    string ClothingStyle,
    string ClothingColor,
    string Accessory,
    string AccessoryColor);

public sealed record FamilyMemberDto(
    string Id,
    string Name,
    string DisplayColor,
    string Initials,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    AvatarV2ConfigDto AvatarV2Config);

public sealed record CreateFamilyMemberRequest(
    string Name,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    string? DisplayColor,
    string? Initials,
    AvatarV2ConfigDto? AvatarV2Config);

public sealed record UpdateFamilyMemberRequest(
    string Name,
    string DisplayColor,
    string Initials,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    AvatarV2ConfigDto? AvatarV2Config);
