namespace HomeOps.Contracts.Events;

public sealed record EventSourceDto(
    Guid Id,
    string Name,
    string Icon,
    EventSourceType SourceType,
    bool Enabled,
    bool Writable,
    bool IsSystem,
    EventSourceHealthStatus HealthStatus,
    EventSourcePollInterval PollInterval,
    DateTimeOffset? LastSyncAttemptUtc,
    DateTimeOffset? LastSuccessfulSyncUtc,
    DateTimeOffset? LastFailedSyncUtc,
    DateTimeOffset? NextSyncAfterUtc,
    EventSourceLastError? LastError,
    string? ProviderSourceId,
    EventSourceProviderConfigurationDto? ProviderConfiguration);

public sealed record CreateEventSourceRequest(
    string Name,
    string Icon,
    EventSourceType SourceType,
    bool Enabled,
    EventSourcePollInterval PollInterval,
    EventSourceProviderConfigurationRequest? ProviderConfiguration);

public sealed record UpdateEventSourceRequest(
    string Name,
    string Icon,
    bool Enabled,
    EventSourcePollInterval PollInterval,
    EventSourceProviderConfigurationRequest? ProviderConfiguration);

public sealed record SyncSourceResultDto(
    Guid SourceId,
    bool Succeeded,
    EventSourceHealthStatus HealthStatus,
    DateTimeOffset AttemptedAtUtc,
    DateTimeOffset? SuccessfulAtUtc,
    DateTimeOffset? FailedAtUtc,
    int CreatedCount,
    int UpdatedCount,
    int DeletedCount,
    int UnchangedCount,
    int WarningCount,
    TimeSpan Duration,
    EventSourceLastError? Error);

public sealed record RefreshAllResultDto(IReadOnlyCollection<SyncSourceResultDto> Results);
