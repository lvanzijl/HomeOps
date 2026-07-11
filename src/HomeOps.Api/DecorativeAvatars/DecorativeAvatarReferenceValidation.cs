using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.KnownPeople;
using HomeOps.Api.Lists;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.DecorativeAvatars;

public static class DecorativeAvatarReferenceValidation
{
    public static async Task<DecorativeAvatarReferenceValidationResult> Validate(
        HomeOpsDbContext dbContext,
        DecorativeAvatarReferenceDto? reference,
        CancellationToken cancellationToken)
    {
        if (reference is null)
        {
            return DecorativeAvatarReferenceValidationResult.Valid(null, null);
        }

        if (reference.ReferenceType is null && string.IsNullOrWhiteSpace(reference.ReferenceId))
        {
            return DecorativeAvatarReferenceValidationResult.Valid(null, null);
        }

        if (reference.ReferenceType is null || string.IsNullOrWhiteSpace(reference.ReferenceId))
        {
            return DecorativeAvatarReferenceValidationResult.Invalid("Decorative avatar reference type and id must both be provided or both be empty.");
        }

        if (!Enum.IsDefined(reference.ReferenceType.Value))
        {
            return DecorativeAvatarReferenceValidationResult.Invalid("Decorative avatar reference type is invalid.");
        }

        var referenceId = reference.ReferenceId.Trim();
        var exists = reference.ReferenceType.Value switch
        {
            DecorativeAvatarReferenceType.FamilyMember => await dbContext.FamilyMembers
                .AsNoTracking()
                .AnyAsync(member => member.Id == referenceId && member.HouseholdId == SeedHousehold.Id && !member.IsDeleted, cancellationToken),
            DecorativeAvatarReferenceType.KnownPerson => Guid.TryParse(referenceId, out var knownPersonId) && await dbContext.KnownPeople
                .AsNoTracking()
                .AnyAsync(person => person.Id == knownPersonId && person.HouseholdId == SeedHousehold.Id && !person.IsDeleted && (person.Scope == KnownPersonScope.Shared || (person.FamilyMember != null && !person.FamilyMember.IsDeleted)), cancellationToken),
            _ => false,
        };

        return exists
            ? DecorativeAvatarReferenceValidationResult.Valid(reference.ReferenceType.Value, referenceId)
            : DecorativeAvatarReferenceValidationResult.Invalid("Decorative avatar reference must point to an active family member or KnownPerson in this household.");
    }
}

public sealed record DecorativeAvatarReferenceValidationResult(bool IsValid, DecorativeAvatarReferenceType? ReferenceType, string? ReferenceId, string? Error)
{
    public static DecorativeAvatarReferenceValidationResult Valid(DecorativeAvatarReferenceType? referenceType, string? referenceId) => new(true, referenceType, referenceId, null);
    public static DecorativeAvatarReferenceValidationResult Invalid(string error) => new(false, null, null, error);
}
