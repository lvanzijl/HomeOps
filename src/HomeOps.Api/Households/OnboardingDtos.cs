namespace HomeOps.Api.Households;

public sealed record OnboardingStatusDto(bool OnboardingCompleted, bool HasActiveFamilyMembers, bool RequiresOnboarding);
