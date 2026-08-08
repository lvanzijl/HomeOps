namespace HomeOps.Api.WeeklyReset;

public sealed class WeeklyResetCandidate
{
    public Guid Id { get; set; }
    public Guid WeeklyResetSessionId { get; set; }
    public WeeklyResetCandidateType CandidateType { get; set; }
    public Guid SourceId { get; set; }
    public string DisplayLabel { get; set; } = string.Empty;
    public string ContextLabel { get; set; } = string.Empty;
    public WeeklyResetDecision? Decision { get; set; }
    public string? ActorLabel { get; set; }
    public DateTimeOffset? DecidedUtc { get; set; }
    public WeeklyResetSession? WeeklyResetSession { get; set; }
}
