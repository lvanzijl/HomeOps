using System.ComponentModel.DataAnnotations;
using HomeOps.Api.AvatarCatalog;

namespace HomeOps.Api.KnownPeople;

public static class KnownPersonFieldLimits
{
    public const int DisplayNameMaxLength = 160;
    public const int NicknameMaxLength = 80;
    public const int CustomRelationshipLabelMaxLength = 80;
    public const int InitialsMaxLength = 8;
}

public sealed record KnownPersonDto(
    Guid Id,
    [property: StringLength(KnownPersonFieldLimits.DisplayNameMaxLength)] string DisplayName,
    [property: StringLength(KnownPersonFieldLimits.NicknameMaxLength)] string? Nickname,
    KnownPersonRelationshipType RelationshipType,
    [property: StringLength(KnownPersonFieldLimits.CustomRelationshipLabelMaxLength)] string? CustomRelationshipLabel,
    KnownPersonScope Scope,
    string? FamilyMemberId,
    [property: StringLength(KnownPersonFieldLimits.InitialsMaxLength)] string Initials,
    AvatarSelectionDto AvatarSelection,
    DateTimeOffset CreatedUtc,
    DateTimeOffset UpdatedUtc);

public sealed record CreateKnownPersonRequest(
    [property: StringLength(KnownPersonFieldLimits.DisplayNameMaxLength)] string DisplayName,
    [property: StringLength(KnownPersonFieldLimits.NicknameMaxLength)] string? Nickname,
    KnownPersonRelationshipType RelationshipType,
    [property: StringLength(KnownPersonFieldLimits.CustomRelationshipLabelMaxLength)] string? CustomRelationshipLabel,
    KnownPersonScope Scope,
    string? FamilyMemberId,
    [property: StringLength(KnownPersonFieldLimits.InitialsMaxLength)] string? Initials,
    AvatarSelectionDto? AvatarSelection);

public sealed record UpdateKnownPersonRequest(
    [property: StringLength(KnownPersonFieldLimits.DisplayNameMaxLength)] string DisplayName,
    [property: StringLength(KnownPersonFieldLimits.NicknameMaxLength)] string? Nickname,
    KnownPersonRelationshipType RelationshipType,
    [property: StringLength(KnownPersonFieldLimits.CustomRelationshipLabelMaxLength)] string? CustomRelationshipLabel,
    KnownPersonScope Scope,
    string? FamilyMemberId,
    [property: StringLength(KnownPersonFieldLimits.InitialsMaxLength)] string? Initials,
    AvatarSelectionDto? AvatarSelection);
