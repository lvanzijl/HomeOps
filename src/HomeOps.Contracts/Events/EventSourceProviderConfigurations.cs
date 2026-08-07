namespace HomeOps.Contracts.Events;

/// <summary>
/// Provider-safe source configuration shape returned by source management APIs.
/// The Kind discriminator selects exactly one provider-specific payload.
/// </summary>
public sealed record EventSourceProviderConfigurationDto(
    EventSourceProviderConfigurationKind Kind,
    ICalFeedSourceConfigurationDto? ICalFeed = null,
    ICalFileSourceConfigurationDto? ICalFile = null);

public sealed record ICalFeedSourceConfigurationDto(
    string FeedUrl,
    string? ETag = null,
    string? LastModified = null,
    string? LastContentHash = null);

public sealed record ICalFileSourceConfigurationDto(
    string OriginalFilename,
    string ContentHash,
    long ContentLength,
    DateTimeOffset UploadedUtc,
    bool HasContent);

/// <summary>
/// Provider configuration shape accepted by source management APIs.
/// The Kind discriminator selects exactly one provider-specific payload.
/// </summary>
public sealed record EventSourceProviderConfigurationRequest(
    EventSourceProviderConfigurationKind Kind,
    ICalFeedSourceConfigurationRequest? ICalFeed = null);

public sealed record ICalFeedSourceConfigurationRequest(string FeedUrl);
