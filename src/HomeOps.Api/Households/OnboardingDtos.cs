using System.ComponentModel.DataAnnotations;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.FamilyMembers;

namespace HomeOps.Api.Households;

public sealed record OnboardingStatusDto(bool OnboardingCompleted, bool HasActiveFamilyMembers, bool RequiresOnboarding);

public sealed record CompleteOnboardingRequest(
    [property: Required] string HouseholdName,
    [property: Required] string TimeZoneId,
    [property: Required] IReadOnlyCollection<OnboardingMemberRequest> Members);

public sealed record OnboardingMemberRequest(
    [property: Required] string Name,
    [property: Required] string DisplayColor,
    [property: Required] string Initials,
    FamilyMemberKind MemberKind,
    DateOnly? DateOfBirth,
    [property: Required] AvatarSelectionDto? AvatarSelection);
