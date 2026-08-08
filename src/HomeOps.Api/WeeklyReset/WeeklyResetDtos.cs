using HomeOps.Api.Motivation;

namespace HomeOps.Api.WeeklyReset;

public sealed record WeeklyResetDto(
    WeeklyResetSessionDto Session,
    IReadOnlyCollection<WeeklyResetCandidateDto> Candidates,
    WeeklyContributionRecapDto ContributionRecap);

public sealed record WeeklyResetSessionDto(
    Guid Id,
    DateOnly WeekStart,
    DateOnly WeekEnd,
    WeeklyResetStatus Status,
    WeeklyResetOutcome? Outcome,
    DateTimeOffset CreatedUtc,
    DateTimeOffset? CompletedUtc,
    int ResolvedCount,
    int TotalCount);

public sealed record WeeklyResetCandidateDto(
    Guid Id,
    WeeklyResetCandidateType CandidateType,
    Guid SourceId,
    string DisplayLabel,
    string ContextLabel,
    WeeklyResetDecision? Decision,
    string? ActorLabel,
    DateTimeOffset? DecidedUtc,
    bool SourceAvailable,
    IReadOnlyCollection<WeeklyResetDecision> AllowedDecisions);

public sealed record WeeklyResetHistoryDto(IReadOnlyCollection<WeeklyResetSessionDto> Sessions);
public sealed record WeeklyResetHistoryDetailDto(
    WeeklyResetSessionDto Session,
    IReadOnlyCollection<WeeklyResetCandidateDto> Candidates);

public sealed record WeeklyContributionRecapDto(
    int CompletedTaskCount,
    int HelpfulMomentCount,
    IReadOnlyCollection<HelpfulMomentDto> HelpfulMoments,
    IReadOnlyCollection<MotivationFamilyCelebrationMemoryDto> CelebrationMemories);

public sealed record DecideWeeklyResetCandidateRequest(WeeklyResetDecision Decision, string? ActorLabel);
public sealed record SkipWeeklyResetRequest(bool Confirmed, string? ActorLabel);
