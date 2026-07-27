using HomeOps.Api.AvatarCatalog;

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
    AvatarV2ConfigDto AvatarV2Config,
    AvatarSelectionDto AvatarSelection);

public sealed record FamilyMemberDependencyDto(int Tasks, int Rooms, int Goals, int PrivateKnownPeople);

public sealed record RemovedFamilyMemberDto(FamilyMemberDto Member, DateTimeOffset? DeletedUtc, FamilyMemberDependencyDto Dependencies);

public sealed record RestoreFamilyMemberConflictDto(string Field, string Message);

public sealed record RestoreFamilyMemberResultDto(FamilyMemberDto? Member, IReadOnlyCollection<RestoreFamilyMemberConflictDto> Conflicts);

public sealed record CreateFamilyMemberRequest(
    string Name,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    string? DisplayColor,
    string? Initials,
    AvatarV2ConfigDto? AvatarV2Config,
    AvatarSelectionDto? AvatarSelection = null);

public sealed record UpdateFamilyMemberRequest(
    string Name,
    string DisplayColor,
    string Initials,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    AvatarV2ConfigDto? AvatarV2Config,
    AvatarSelectionDto? AvatarSelection = null);
