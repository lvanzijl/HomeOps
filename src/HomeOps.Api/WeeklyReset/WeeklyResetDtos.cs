using HomeOps.Api.Motivation;
using HomeOps.Api.Tasks;

namespace HomeOps.Api.WeeklyReset;

public sealed record WeeklyResetDto(IReadOnlyCollection<HouseholdTaskDto> ReviewCandidates, MotivationFamilyGoalDto? FamilyGoal, IReadOnlyCollection<MotivationIndividualGoalDto> IndividualGoals, IReadOnlyCollection<ShoppingReviewCandidateDto> ShoppingReviewCandidates, WeeklyContributionRecapDto ContributionRecap);
public sealed record ShoppingReviewCandidateDto(Guid Id, string Name, string Reason, DateTimeOffset UpdatedUtc, int ItemCount);
public sealed record WeeklyContributionRecapDto(int CompletedTaskCount, int HelpfulMomentCount, MotivationFamilyGoalDto? FamilyGoal, IReadOnlyCollection<MotivationIndividualGoalDto> IndividualGoals, IReadOnlyCollection<HelpfulMomentDto> HelpfulMoments, IReadOnlyCollection<MotivationFamilyCelebrationMemoryDto> CelebrationMemories);
