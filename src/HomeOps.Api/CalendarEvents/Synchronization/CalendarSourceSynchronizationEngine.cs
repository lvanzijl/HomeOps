using System.Diagnostics;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed class CalendarSourceSynchronizationEngine(HomeOpsDbContext dbContext, TimeProvider? timeProvider = null)
{
    private readonly TimeProvider timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<CalendarSourceSynchronizationResult> SynchronizeAsync(EventSource eventSource, CalendarProviderSnapshot snapshot, CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var attemptUtc = timeProvider.GetUtcNow();

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var source = await dbContext.EventSources.SingleAsync(candidate => candidate.Id == eventSource.Id, cancellationToken);

            var duplicateProviderEventIds = snapshot.Events
                .GroupBy(providerEvent => providerEvent.ProviderEventId, StringComparer.Ordinal)
                .Where(group => group.Count() > 1)
                .Select(group => group.Key)
                .ToList();
            if (duplicateProviderEventIds.Count > 0)
            {
                var diagnostics = snapshot.Diagnostics.Concat([
                    Error("DuplicateProviderEventId", $"Provider snapshot contains duplicate ProviderEventId values: {string.Join(", ", duplicateProviderEventIds)}.")
                ]).ToList();
                ApplyFailureMetadata(source, attemptUtc, "DuplicateProviderEventId", "Provider snapshot contained duplicate ProviderEventId values.", string.Join(", ", duplicateProviderEventIds));
                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return CalendarSourceSynchronizationResult.Failed(diagnostics, stopwatch.Elapsed, attemptUtc);
            }

            if (snapshot.Status == CalendarProviderSnapshotStatus.Failed)
            {
                var diagnostics = snapshot.Diagnostics.Count == 0
                    ? [Error(snapshot.FailureCode ?? "ProviderFailure", snapshot.FailureMessage ?? "Provider snapshot failed.")]
                    : snapshot.Diagnostics;
                ApplyFailureMetadata(source, attemptUtc, snapshot.FailureCode ?? "ProviderFailure", snapshot.FailureMessage ?? "Provider snapshot failed.", snapshot.FailureDetail);
                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return CalendarSourceSynchronizationResult.Failed(diagnostics, stopwatch.Elapsed, attemptUtc);
            }

            if (snapshot.Status == CalendarProviderSnapshotStatus.Successful && snapshot.Diagnostics.Any(diagnostic => diagnostic.Severity == ICalendarParseDiagnosticSeverity.Error))
            {
                ApplyFailureMetadata(source, attemptUtc, "ParseFailure", "Provider snapshot contained parser errors.", string.Join(Environment.NewLine, snapshot.Diagnostics.Where(diagnostic => diagnostic.Severity == ICalendarParseDiagnosticSeverity.Error).Select(diagnostic => diagnostic.Message)));
                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return CalendarSourceSynchronizationResult.Failed(snapshot.Diagnostics, stopwatch.Elapsed, attemptUtc);
            }

            if (snapshot.Status == CalendarProviderSnapshotStatus.NotModified)
            {
                ApplySuccessfulMetadata(source, attemptUtc, snapshot.ProviderSourceId);
                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return CalendarSourceSynchronizationResult.Success(0, 0, 0, 0, CountWarnings(snapshot.Diagnostics), snapshot.Diagnostics, stopwatch.Elapsed, attemptUtc);
            }

            var existingImportedSeries = await dbContext.EventSeries
                .Include(series => series.Exceptions)
                .Where(series => series.EventSourceId == source.Id && series.ProviderEventId != null)
                .ToListAsync(cancellationToken);
            var existingByProviderEventId = existingImportedSeries.ToDictionary(series => series.ProviderEventId!, StringComparer.Ordinal);
            var snapshotByProviderEventId = snapshot.Events.ToDictionary(providerEvent => providerEvent.ProviderEventId, StringComparer.Ordinal);
            var created = 0;
            var updated = 0;
            var unchanged = 0;
            var deleted = 0;

            foreach (var providerEvent in snapshot.Events)
            {
                if (!existingByProviderEventId.TryGetValue(providerEvent.ProviderEventId, out var series))
                {
                    dbContext.EventSeries.Add(CreateSeries(source.Id, providerEvent, attemptUtc));
                    created++;
                    continue;
                }

                if (string.Equals(series.ContentFingerprint, providerEvent.ContentFingerprint, StringComparison.Ordinal))
                {
                    series.LastSeenSyncAttemptUtc = attemptUtc;
                    unchanged++;
                    continue;
                }

                ApplyProviderEvent(series, providerEvent, attemptUtc);
                updated++;
            }

            foreach (var series in existingImportedSeries.Where(series => !snapshotByProviderEventId.ContainsKey(series.ProviderEventId!)))
            {
                dbContext.EventSeries.Remove(series);
                deleted++;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            ApplySuccessfulMetadata(source, attemptUtc, snapshot.ProviderSourceId);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return CalendarSourceSynchronizationResult.Success(created, updated, deleted, unchanged, CountWarnings(snapshot.Diagnostics), snapshot.Diagnostics, stopwatch.Elapsed, attemptUtc);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return CalendarSourceSynchronizationResult.Failed([Error("SynchronizationFailed", exception.Message)], stopwatch.Elapsed, attemptUtc);
        }
    }

    private static EventSeries CreateSeries(Guid eventSourceId, NormalizedProviderEvent providerEvent, DateTimeOffset attemptUtc)
    {
        var series = new EventSeries
        {
            Id = Guid.NewGuid(),
            EventSourceId = eventSourceId,
            ImportedAtUtc = attemptUtc,
            CreatedUtc = attemptUtc,
        };
        ApplyProviderEvent(series, providerEvent, attemptUtc);
        return series;
    }

    private static void ApplyProviderEvent(EventSeries series, NormalizedProviderEvent providerEvent, DateTimeOffset attemptUtc)
    {
        series.Title = providerEvent.Title;
        series.Description = providerEvent.Description;
        series.Location = providerEvent.Location;
        series.StartDate = providerEvent.StartDate;
        series.StartTime = providerEvent.StartTime;
        series.EndDate = providerEvent.EndDate;
        series.EndTime = providerEvent.EndTime;
        series.IsAllDay = providerEvent.IsAllDay;
        series.RecurrenceType = providerEvent.RecurrenceRule is null ? providerEvent.RecurrenceType : RecurrenceType.None;
        series.RecurrenceRule = CopyRule(providerEvent.RecurrenceRule);
        ApplyProviderExceptions(series, providerEvent, attemptUtc);
        series.ProviderEventId = providerEvent.ProviderEventId;
        series.ProviderRevision = providerEvent.ProviderRevision;
        series.ContentFingerprint = providerEvent.ContentFingerprint;
        series.LastImportedUtc = attemptUtc;
        series.LastSeenSyncAttemptUtc = attemptUtc;
        series.UpdatedUtc = attemptUtc;
    }


    private static void ApplyProviderExceptions(EventSeries series, NormalizedProviderEvent providerEvent, DateTimeOffset attemptUtc)
    {
        var incoming = (providerEvent.Exceptions ?? []).ToDictionary(exception => exception.OccurrenceKey);
        foreach (var existing in series.Exceptions.Where(exception => !incoming.ContainsKey(exception.OccurrenceKey)).ToArray())
        {
            series.Exceptions.Remove(existing);
        }

        foreach (var incomingException in incoming.Values)
        {
            var exception = series.Exceptions.FirstOrDefault(candidate => candidate.OccurrenceKey == incomingException.OccurrenceKey);
            if (exception is null)
            {
                exception = new EventException
                {
                    Id = Guid.NewGuid(),
                    EventSeriesId = series.Id,
                    OccurrenceDate = incomingException.OccurrenceKey.Date,
                    OccurrenceKey = incomingException.OccurrenceKey,
                    CreatedUtc = attemptUtc,
                };
                series.Exceptions.Add(exception);
            }

            exception.ExceptionType = incomingException.ExceptionType;
            exception.IsSkipped = incomingException.ExceptionType == EventExceptionType.Skipped;
            exception.Title = incomingException.Title;
            exception.Description = incomingException.Description;
            exception.Location = incomingException.Location;
            exception.IsAllDay = incomingException.IsAllDay;
            exception.StartDate = incomingException.StartDate;
            exception.StartTime = incomingException.StartTime;
            exception.EndDate = incomingException.EndDate;
            exception.EndTime = incomingException.EndTime;
            exception.RawProviderRecurrenceId = incomingException.RawProviderRecurrenceId;
            exception.NormalizedProviderRecurrenceId = incomingException.NormalizedProviderRecurrenceId;
            exception.DetachedProviderEventId = incomingException.DetachedProviderEventId;
            exception.DetachedProviderRevision = incomingException.DetachedProviderRevision;
            exception.DetachedContentFingerprint = incomingException.DetachedContentFingerprint;
            exception.RawDetachedRecurrenceMetadata = incomingException.RawDetachedRecurrenceMetadata;
            exception.UpdatedUtc = attemptUtc;
        }
    }

    private static EventRecurrenceRule? CopyRule(EventRecurrenceRule? rule) => rule is null ? null : new EventRecurrenceRule
    {
        Frequency = rule.Frequency,
        Interval = rule.Interval,
        EndMode = rule.EndMode,
        UntilDate = rule.UntilDate,
        Count = rule.Count,
        WeeklyDays = rule.WeeklyDays,
        MonthlyDayOfMonth = rule.MonthlyDayOfMonth,
        YearlyMonth = rule.YearlyMonth,
        YearlyDayOfMonth = rule.YearlyDayOfMonth,
        RawProviderRecurrenceRule = rule.RawProviderRecurrenceRule,
        UnsupportedRecurrenceStatus = rule.UnsupportedRecurrenceStatus,
        UnsupportedRecurrenceReason = rule.UnsupportedRecurrenceReason,
    };

    private static void ApplySuccessfulMetadata(EventSource source, DateTimeOffset attemptUtc, string? providerSourceId)
    {
        source.HealthStatus = EventSourceHealthStatus.Healthy;
        source.LastSyncAttemptUtc = attemptUtc;
        source.LastSuccessfulSyncUtc = attemptUtc;
        source.LastFailedSyncUtc = null;
        source.LastErrorCode = null;
        source.LastErrorMessage = null;
        source.LastErrorDetail = null;
        source.NextSyncAfterUtc = CalculateNextSyncAfter(source.PollInterval, attemptUtc);
        source.UpdatedUtc = attemptUtc;
        if (!string.IsNullOrWhiteSpace(providerSourceId))
        {
            source.ProviderSourceId = providerSourceId;
        }
    }

    private static void ApplyFailureMetadata(EventSource source, DateTimeOffset attemptUtc, string failureCode, string failureMessage, string? failureDetail)
    {
        source.HealthStatus = EventSourceHealthStatus.Failed;
        source.LastSyncAttemptUtc = attemptUtc;
        source.LastFailedSyncUtc = attemptUtc;
        source.LastErrorCode = failureCode;
        source.LastErrorMessage = failureMessage;
        source.LastErrorDetail = failureDetail;
        source.NextSyncAfterUtc = CalculateNextSyncAfter(source.PollInterval, attemptUtc);
        source.UpdatedUtc = attemptUtc;
    }

    private static DateTimeOffset CalculateNextSyncAfter(EventSourcePollInterval pollInterval, DateTimeOffset attemptUtc) => pollInterval switch
    {
        EventSourcePollInterval.EveryHour => attemptUtc.AddHours(1),
        EventSourcePollInterval.EveryDay => attemptUtc.AddDays(1),
        _ => attemptUtc.AddHours(8),
    };

    private static int CountWarnings(IReadOnlyList<ICalendarParseDiagnostic> diagnostics) =>
        diagnostics.Count(diagnostic => diagnostic.Severity == ICalendarParseDiagnosticSeverity.Warning);

    private static ICalendarParseDiagnostic Error(string code, string message) =>
        new(ICalendarParseDiagnosticSeverity.Error, code, message);
}
