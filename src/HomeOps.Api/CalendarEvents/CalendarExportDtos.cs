namespace HomeOps.Api.CalendarEvents;

public sealed record CalendarExportDocument(
    string Format,
    int SchemaVersion,
    DateTimeOffset ExportedUtc,
    CalendarExportHousehold Household,
    CalendarExportPayload Calendar,
    IReadOnlyDictionary<string, string> Metadata)
{
    public const string CurrentFormat = "homeops.calendar.export";
    public const int CurrentSchemaVersion = 1;
}

public sealed record CalendarExportHousehold(Guid Id, string TimeZoneId);

public sealed record CalendarExportPayload(
    int Version,
    IReadOnlyCollection<CalendarExportEventSource> EventSources,
    IReadOnlyCollection<CalendarExportEventSeries> EventSeries,
    CalendarExportRecurrenceSection Recurrence,
    IReadOnlyCollection<CalendarExportEventException> Exceptions,
    IReadOnlyDictionary<string, string> Metadata,
    IReadOnlyCollection<CalendarExportFloor>? Floors = null,
    IReadOnlyCollection<CalendarExportRoom>? Rooms = null,
    IReadOnlyCollection<CalendarExportRoomClimateConfiguration>? RoomClimateConfigurations = null,
    IReadOnlyCollection<CalendarExportClimateProvider>? ClimateProviders = null,
    IReadOnlyCollection<CalendarExportRoomClimateSourceMapping>? RoomClimateSourceMappings = null,
    IReadOnlyCollection<CalendarExportFloorPlanAsset>? FloorPlanAssets = null,
    IReadOnlyCollection<CalendarExportRoomOverlay>? RoomOverlays = null)
{
    public const int CurrentVersion = 1;
}

public sealed record CalendarExportEventSource(
    Guid Id,
    string Name,
    string SourceType,
    bool IsWritable,
    DateTimeOffset CreatedUtc,
    DateTimeOffset UpdatedUtc,
    string? Icon = null,
    bool? IsEnabled = null,
    bool? IsSystem = null,
    string? HealthStatus = null,
    string? PollInterval = null,
    CalendarExportProviderConfiguration? ProviderConfiguration = null);

public sealed record CalendarExportProviderConfiguration(
    string ProviderType,
    CalendarExportICalFeedConfiguration? ICalFeed = null,
    CalendarExportICalFileConfiguration? ICalFile = null);

public sealed record CalendarExportICalFeedConfiguration(string FeedUrl);

public sealed record CalendarExportICalFileConfiguration(
    string FileReference,
    string OriginalFilename,
    string ContentHash,
    DateTimeOffset UploadedUtc);

public sealed record CalendarExportEventSeries(
    Guid Id,
    Guid EventSourceId,
    string Title,
    string? Description,
    bool IsAllDay,
    DateOnly StartDate,
    TimeOnly? StartTime,
    DateOnly EndDate,
    TimeOnly? EndTime,
    CalendarExportRecurrence? Recurrence,
    DateTimeOffset CreatedUtc,
    DateTimeOffset UpdatedUtc,
    string? Location = null,
    string? ProviderEventId = null,
    string? ProviderInstanceId = null,
    string? ProviderRevision = null,
    string? ContentFingerprint = null,
    DateTimeOffset? ImportedAtUtc = null);

public sealed record CalendarExportRecurrenceSection(IReadOnlyCollection<CalendarExportRecurrence> Rules);

public sealed record CalendarExportRecurrence(
    string RuleType,
    string Value,
    string? Frequency = null,
    int? Interval = null,
    string? EndMode = null,
    DateOnly? UntilDate = null,
    int? Count = null,
    string? WeeklyDays = null,
    int? MonthlyDayOfMonth = null,
    int? YearlyMonth = null,
    int? YearlyDayOfMonth = null,
    string? RawProviderRecurrenceRule = null,
    string? UnsupportedRecurrenceStatus = null,
    string? UnsupportedRecurrenceReason = null);

public sealed record CalendarExportEventException(
    Guid Id,
    Guid EventSeriesId,
    DateOnly OccurrenceDate,
    string ExceptionType,
    string? Title = null,
    string? Description = null,
    DateOnly? StartDate = null,
    TimeOnly? StartTime = null,
    DateOnly? EndDate = null,
    TimeOnly? EndTime = null,
    string? OccurrenceKey = null,
    string? Location = null,
    bool? IsAllDay = null,
    string? RawProviderRecurrenceId = null,
    string? NormalizedProviderRecurrenceId = null,
    string? DetachedProviderEventId = null,
    string? DetachedProviderRevision = null,
    string? DetachedContentFingerprint = null,
    string? RawDetachedRecurrenceMetadata = null);


public sealed record CalendarExportFloor(Guid Id, string Name, int SortOrder, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record CalendarExportRoom(Guid Id, Guid FloorId, string Name, string RoomType, int SortOrder, string? FamilyMemberId, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);

public sealed record CalendarExportRoomClimateConfiguration(Guid RoomId, bool IsClimateEnabled, bool IsBedtimeRelevant, decimal? MinimumPreferredTemperatureCelsius, decimal? MaximumPreferredTemperatureCelsius, decimal? MinimumPreferredRelativeHumidity, decimal? MaximumPreferredRelativeHumidity, string HeatingPolicyIntent, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);


public sealed record CalendarExportClimateProvider(Guid Id, string DisplayName, string ProviderType, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, string? ExternalInstanceReference, string? DiagnosticMetadata, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record CalendarExportRoomClimateSourceMapping(Guid Id, Guid RoomId, Guid ProviderId, string SourceRole, string ExternalSourceId, string? ExternalDisplayName, string? ExternalSourceKind, string? ExternalAreaId, string? ExternalAreaName, string? ExternalDeviceId, string? ExternalDeviceName, int Priority, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, string Health, DateTimeOffset? LastCheckedUtc, DateTimeOffset? LastSuccessfulUtc, string? DiagnosticSummary, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);

public sealed record CalendarExportFloorPlanAsset(Guid Id, Guid FloorId, string OriginalFilename, string DetectedMediaType, string ContentHash, string? SourceContentBase64, string? DerivativeContentBase64, string? DerivativeContentHash, int? SourceWidth, int? SourceHeight, decimal CoordinateBasisWidth, decimal CoordinateBasisHeight, decimal AspectRatio, string State, Guid? ReplacementOfAssetId, DateTimeOffset UploadedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, string? ValidationSummary, string SourceAvailability, string DerivativeAvailability);

public sealed record CalendarExportRoomOverlay(Guid Id, Guid RoomId, Guid FloorId, Guid FloorPlanAssetId, string State, IReadOnlyList<HomeOps.Api.FloorPlans.NormalizedPoint> Polygon, HomeOps.Api.FloorPlans.NormalizedPoint? LabelAnchor, DateTimeOffset? ArchivedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
