using HomeOps.Api.CalendarEvents.ICalendar;

namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed record CalendarSourceSynchronizationResult(
    bool Succeeded,
    int CreatedCount,
    int UpdatedCount,
    int DeletedCount,
    int UnchangedCount,
    int WarningCount,
    IReadOnlyList<ICalendarParseDiagnostic> Diagnostics,
    TimeSpan Duration,
    EventSourceHealthStatus SourceHealthStatus,
    DateTimeOffset LastSyncAttemptUtc,
    DateTimeOffset? LastSuccessfulSyncUtc,
    DateTimeOffset? LastFailedSyncUtc)
{
    public static CalendarSourceSynchronizationResult Success(
        int createdCount,
        int updatedCount,
        int deletedCount,
        int unchangedCount,
        int warningCount,
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        TimeSpan duration,
        DateTimeOffset attemptUtc) =>
        new(true, createdCount, updatedCount, deletedCount, unchangedCount, warningCount, diagnostics, duration, EventSourceHealthStatus.Healthy, attemptUtc, attemptUtc, null);

    public static CalendarSourceSynchronizationResult Failed(
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        TimeSpan duration,
        DateTimeOffset attemptUtc) =>
        new(false, 0, 0, 0, 0, diagnostics.Count(diagnostic => diagnostic.Severity == ICalendarParseDiagnosticSeverity.Warning), diagnostics, duration, EventSourceHealthStatus.Failed, attemptUtc, null, attemptUtc);
}
