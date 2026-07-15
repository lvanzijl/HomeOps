using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public enum RoomHeatingCommandAction { TemporaryWarmer, ResumeSchedule, TemporaryCooler }
public enum RoomHeatingCommandStatus { Pending, Accepted, Succeeded, Failed, Superseded, Expired }
public enum RoomHeatingProviderOutcome { Accepted, Rejected, Unavailable }

public sealed class RoomHeatingCommand
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
    public Guid ProviderId { get; set; }
    public ClimateProvider? Provider { get; set; }
    public Guid SourceMappingId { get; set; }
    public RoomClimateSourceMapping? SourceMapping { get; set; }
    public RoomHeatingCommandAction Action { get; set; }
    public RoomHeatingCommandStatus Status { get; set; }
    public decimal? RequestedTargetTemperatureCelsius { get; set; }
    public int? DurationMinutes { get; set; }
    public DateTimeOffset? EffectiveUntilUtc { get; set; }
    public DateTimeOffset RequestedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public DateTimeOffset? AcceptedUtc { get; set; }
    public DateTimeOffset? CompletedUtc { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string RequestFingerprint { get; set; } = string.Empty;
    public Guid? SupersededByCommandId { get; set; }
    public RoomHeatingCommand? SupersededByCommand { get; set; }
    public string? ProviderCommandReference { get; set; }
    public decimal? ConfirmedTargetTemperatureCelsius { get; set; }
    public bool? ScheduleResumed { get; set; }
    public string? FailureCode { get; set; }
    public string? FailureMessage { get; set; }
}

public sealed record RoomHeatingControlProviderCapability(bool IsAvailable, bool SupportsTemporaryCooler = false, decimal? MinimumTargetTemperatureCelsius = null, decimal? MaximumTargetTemperatureCelsius = null, string? BlockerCode = null, string? BlockerMessage = null);
public sealed record RoomHeatingProviderContext(Guid HouseholdId, Guid RoomId, Guid ProviderId, Guid SourceMappingId, string ExternalSourceId, Guid CommandId, decimal? RequestedTargetTemperatureCelsius, int? DurationMinutes, DateTimeOffset? EffectiveUntilUtc);
public sealed record RoomHeatingProviderResult(RoomHeatingProviderOutcome Outcome, string? ProviderCommandReference = null, decimal? ConfirmedTargetTemperatureCelsius = null, bool? ScheduleResumed = null, bool Completed = false, string? FailureCode = null, string? FailureMessage = null);
public interface IRoomHeatingControlProvider
{
    Task<RoomHeatingControlProviderCapability> GetCapabilityAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken);
    Task<RoomHeatingProviderResult> SubmitTemporaryTargetAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken);
    Task<RoomHeatingProviderResult> ResumeScheduleAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken);
}
internal sealed class UnavailableRoomHeatingControlProvider : IRoomHeatingControlProvider
{
    public Task<RoomHeatingControlProviderCapability> GetCapabilityAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) => Task.FromResult(new RoomHeatingControlProviderCapability(false, BlockerCode: "ProviderUnavailable", BlockerMessage: "Heating control provider is unavailable."));
    public Task<RoomHeatingProviderResult> SubmitTemporaryTargetAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) => Task.FromResult(new RoomHeatingProviderResult(RoomHeatingProviderOutcome.Unavailable, FailureCode: "ProviderUnavailable", FailureMessage: "Heating control provider is unavailable."));
    public Task<RoomHeatingProviderResult> ResumeScheduleAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) => Task.FromResult(new RoomHeatingProviderResult(RoomHeatingProviderOutcome.Unavailable, FailureCode: "ProviderUnavailable", FailureMessage: "Heating control provider is unavailable."));
}
