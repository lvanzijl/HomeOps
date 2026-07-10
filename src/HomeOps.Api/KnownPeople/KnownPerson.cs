using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;

namespace HomeOps.Api.KnownPeople;

public sealed class KnownPerson
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public KnownPersonScope Scope { get; set; } = KnownPersonScope.Shared;
    public string? FamilyMemberId { get; set; }
    public FamilyMember? FamilyMember { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Nickname { get; set; }
    public KnownPersonRelationshipType RelationshipType { get; set; } = KnownPersonRelationshipType.Other;
    public string? CustomRelationshipLabel { get; set; }
    public string Initials { get; set; } = string.Empty;
    public AvatarSelection AvatarSelection { get; set; } = new();
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
