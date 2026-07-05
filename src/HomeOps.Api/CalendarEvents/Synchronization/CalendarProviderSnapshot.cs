using HomeOps.Api.CalendarEvents.ICalendar;

namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed record CalendarProviderSnapshot(
    CalendarProviderSnapshotStatus Status,
    IReadOnlyList<NormalizedProviderEvent> Events,
    IReadOnlyList<ICalendarParseDiagnostic> Diagnostics,
    string? ProviderSourceId = null,
    string? FailureCode = null,
    string? FailureMessage = null,
    string? FailureDetail = null)
{
    public static CalendarProviderSnapshot Successful(
        IReadOnlyList<NormalizedProviderEvent> events,
        IReadOnlyList<ICalendarParseDiagnostic>? diagnostics = null,
        string? providerSourceId = null) =>
        new(CalendarProviderSnapshotStatus.Successful, events, diagnostics ?? [], providerSourceId);

    public static CalendarProviderSnapshot Failed(
        string failureCode,
        string failureMessage,
        IReadOnlyList<ICalendarParseDiagnostic>? diagnostics = null,
        string? failureDetail = null,
        string? providerSourceId = null) =>
        new(CalendarProviderSnapshotStatus.Failed, [], diagnostics ?? [], providerSourceId, failureCode, failureMessage, failureDetail);

    public static CalendarProviderSnapshot NotModified(
        IReadOnlyList<ICalendarParseDiagnostic>? diagnostics = null,
        string? providerSourceId = null) =>
        new(CalendarProviderSnapshotStatus.NotModified, [], diagnostics ?? [], providerSourceId);
}

public enum CalendarProviderSnapshotStatus
{
    Successful = 0,
    Failed = 1,
    NotModified = 2,
}
