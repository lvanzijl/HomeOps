using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HomeOps.Api.CalendarEvents;

public static class CalendarPortabilityService
{
    private static readonly JsonSerializerOptions SnapshotJsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    private static readonly string DefaultPreRestoreSnapshotDirectory = Path.Combine(AppContext.BaseDirectory, "calendar-restore-snapshots");

    public static string PreRestoreSnapshotDirectory { get; set; } = DefaultPreRestoreSnapshotDirectory;

    public static void ConfigurePreRestoreSnapshotDirectory(string? configuredDirectory)
    {
        PreRestoreSnapshotDirectory = string.IsNullOrWhiteSpace(configuredDirectory)
            ? DefaultPreRestoreSnapshotDirectory
            : configuredDirectory.Trim();
    }

    public static async Task<CalendarExportDocument> ExportAsync(HomeOpsDbContext dbContext, CancellationToken cancellationToken = default)
    {
        var household = await dbContext.Households.AsNoTracking().SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
        var sources = await dbContext.EventSources
            .AsNoTracking()
            .Where(source => source.HouseholdId == SeedHousehold.Id)
            .OrderBy(source => source.Name)
            .Select(source => new CalendarExportEventSource(source.Id, source.Name, source.SourceType, source.IsWritable, source.CreatedUtc, source.UpdatedUtc))
            .ToListAsync(cancellationToken);
        var series = await dbContext.EventSeries
            .AsNoTracking()
            .Where(candidate => candidate.EventSource!.HouseholdId == SeedHousehold.Id)
            .OrderBy(candidate => candidate.StartDate)
            .ThenBy(candidate => candidate.StartTime)
            .ThenBy(candidate => candidate.Title)
            .Select(candidate => new CalendarExportEventSeries(
                candidate.Id,
                candidate.EventSourceId,
                candidate.Title,
                candidate.Description,
                candidate.IsAllDay,
                candidate.StartDate,
                candidate.StartTime,
                candidate.EndDate,
                candidate.EndTime,
                new CalendarExportRecurrence(candidate.RecurrenceType.ToString(), string.Empty),
                candidate.CreatedUtc,
                candidate.UpdatedUtc))
            .ToListAsync(cancellationToken);
        var exceptions = await dbContext.EventExceptions
            .AsNoTracking()
            .Where(exception => exception.EventSeries!.EventSource!.HouseholdId == SeedHousehold.Id)
            .OrderBy(exception => exception.OccurrenceDate)
            .Select(exception => new CalendarExportEventException(exception.Id, exception.EventSeriesId, exception.OccurrenceDate, exception.IsSkipped ? "Skipped" : "Modified", exception.Title, exception.Description, exception.StartDate, exception.StartTime, exception.EndDate, exception.EndTime))
            .ToListAsync(cancellationToken);

        return new CalendarExportDocument(
            CalendarExportDocument.CurrentFormat,
            CalendarExportDocument.CurrentSchemaVersion,
            DateTimeOffset.UtcNow,
            new CalendarExportHousehold(household.Id, household.TimeZoneId),
            new CalendarExportPayload(CalendarExportPayload.CurrentVersion, sources, series, new CalendarExportRecurrenceSection([]), exceptions, new Dictionary<string, string>()),
            new Dictionary<string, string>());
    }

    public static async Task<CalendarRestoreResult> RestoreAsync(HomeOpsDbContext dbContext, CalendarExportDocument? document, CancellationToken cancellationToken = default)
    {
        var validationErrors = Validate(document);
        if (validationErrors.Count > 0)
        {
            return new CalendarRestoreResult(false, validationErrors);
        }

        try
        {
            var snapshot = await ExportAsync(dbContext, cancellationToken);
            await WritePreRestoreSnapshotAsync(snapshot, cancellationToken);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or NotSupportedException or ArgumentException or System.Security.SecurityException)
        {
            return new CalendarRestoreResult(false, new Dictionary<string, string[]>
            {
                ["PreRestoreExport"] = [$"Restore was cancelled because the local pre-restore export snapshot could not be created: {exception.Message}"]
            });
        }

        var household = await dbContext.Households.SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
        if (!string.IsNullOrWhiteSpace(document!.Household.TimeZoneId) && IsValidTimeZone(document.Household.TimeZoneId))
        {
            household.TimeZoneId = document.Household.TimeZoneId;
            household.UpdatedUtc = DateTimeOffset.UtcNow;
        }

        var existingSeries = await dbContext.EventSeries
            .Where(series => series.EventSource!.HouseholdId == SeedHousehold.Id)
            .ToListAsync(cancellationToken);
        dbContext.EventSeries.RemoveRange(existingSeries);
        var existingSources = await dbContext.EventSources.Where(source => source.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
        dbContext.EventSources.RemoveRange(existingSources);
        dbContext.EventSources.AddRange(document.Calendar.EventSources.Select(source => new EventSource
        {
            Id = source.Id,
            HouseholdId = SeedHousehold.Id,
            Name = source.Name.Trim(),
            SourceType = NormalizeSourceType(source.SourceType),
            Icon = "📅",
            IsEnabled = true,
            IsWritable = source.IsWritable,
            HealthStatus = EventSourceHealthStatus.Healthy,
            PollInterval = EventSourcePollInterval.Every8Hours,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = source.UpdatedUtc,
        }));
        dbContext.EventSeries.AddRange(document.Calendar.EventSeries.Select(series => new EventSeries
        {
            Id = series.Id,
            EventSourceId = series.EventSourceId,
            Title = series.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(series.Description) ? null : series.Description.Trim(),
            IsAllDay = series.IsAllDay,
            StartDate = series.StartDate,
            StartTime = series.IsAllDay ? null : series.StartTime,
            EndDate = series.EndDate,
            EndTime = series.IsAllDay ? null : series.EndTime,
            RecurrenceType = ParseRecurrenceType(series.Recurrence),
            CreatedUtc = series.CreatedUtc,
            UpdatedUtc = series.UpdatedUtc,
        }));
        dbContext.EventExceptions.AddRange(document.Calendar.Exceptions.Select(exception => new EventException
        {
            Id = exception.Id,
            EventSeriesId = exception.EventSeriesId,
            OccurrenceDate = exception.OccurrenceDate,
            IsSkipped = string.Equals(exception.ExceptionType, "Skipped", StringComparison.OrdinalIgnoreCase),
            Title = string.IsNullOrWhiteSpace(exception.Title) ? null : exception.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(exception.Description) ? null : exception.Description.Trim(),
            StartDate = exception.StartDate,
            StartTime = exception.StartTime,
            EndDate = exception.EndDate,
            EndTime = exception.EndTime,
            CreatedUtc = DateTimeOffset.UtcNow,
            UpdatedUtc = DateTimeOffset.UtcNow,
        }));
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CalendarRestoreResult(true, new Dictionary<string, string[]>());
    }

    private static async Task WritePreRestoreSnapshotAsync(CalendarExportDocument snapshot, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(PreRestoreSnapshotDirectory);
        var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmssfff");
        var path = Path.Combine(PreRestoreSnapshotDirectory, $"calendar-pre-restore-{timestamp}.json");
        await using var stream = File.Create(path);
        await JsonSerializer.SerializeAsync(stream, snapshot, SnapshotJsonOptions, cancellationToken);
    }

    private static Dictionary<string, string[]> Validate(CalendarExportDocument? document)
    {
        var errors = new Dictionary<string, string[]>();
        if (document is null) return new() { ["document"] = ["Calendar export document is required."] };
        var household = document.Household;
        var calendar = document.Calendar;
        if (household is null) errors[nameof(document.Household)] = ["Household metadata is required."];
        if (calendar is null) errors[nameof(document.Calendar)] = ["Calendar payload is required."];
        if (errors.Count > 0) return errors;

        if (document.Format != CalendarExportDocument.CurrentFormat) errors[nameof(document.Format)] = ["Unsupported calendar export format."];
        if (document.SchemaVersion != CalendarExportDocument.CurrentSchemaVersion) errors[nameof(document.SchemaVersion)] = ["Unsupported calendar export schema version."];
        if (calendar!.Version != CalendarExportPayload.CurrentVersion) errors["Calendar.Version"] = ["Unsupported calendar export payload version."];
        if (!IsValidTimeZone(household!.TimeZoneId)) errors["Household.TimeZoneId"] = ["Household timezone is invalid."];
        var eventSources = calendar.EventSources;
        var eventSeries = calendar.EventSeries;
        var recurrence = calendar.Recurrence;
        var exceptions = calendar.Exceptions;
        var documentMetadata = document.Metadata;
        var calendarMetadata = calendar.Metadata;
        if (eventSources is null) errors["Calendar.EventSources"] = ["Event sources are required."];
        if (eventSeries is null) errors["Calendar.EventSeries"] = ["EventSeries records are required."];
        if (recurrence is null) errors["Calendar.Recurrence"] = ["Recurrence section is required for V1 contract stability."];
        if (exceptions is null) errors["Calendar.Exceptions"] = ["EventException collection is required."];
        if (documentMetadata is null) errors["Metadata"] = ["Document metadata section is required for V1 contract stability."];
        if (calendarMetadata is null) errors["Calendar.Metadata"] = ["Calendar metadata section is required for V1 contract stability."];
        if (errors.Count > 0) return errors;

        var requiredEventSources = eventSources!;
        var requiredEventSeries = eventSeries!;
        var requiredRecurrence = recurrence!;
        var requiredExceptions = exceptions!;
        var sourceIds = requiredEventSources.Select(source => source.Id).ToHashSet();
        var seriesIds = requiredEventSeries.Select(series => series.Id).ToHashSet();
        if (household!.Id == Guid.Empty) errors["Household.Id"] = ["Household identifier is required."];
        if (household.Id != SeedHousehold.Id) errors["Household.Id"] = ["Calendar restore only supports the local seeded household."];
        if (sourceIds.Count != requiredEventSources.Count) errors["Calendar.EventSources"] = ["Event source identifiers must be unique."];
        if (seriesIds.Count != requiredEventSeries.Count) errors["Calendar.EventSeries"] = ["EventSeries identifiers must be unique."];
        if (requiredEventSources.Any(source => source.Id == Guid.Empty || string.IsNullOrWhiteSpace(source.Name) || string.IsNullOrWhiteSpace(source.SourceType))) errors["Calendar.EventSources.Required"] = ["Event sources require id, name, and source type."];
        if (requiredEventSeries.Any(series => series.Id == Guid.Empty || string.IsNullOrWhiteSpace(series.Title) || !sourceIds.Contains(series.EventSourceId))) errors["Calendar.EventSeries.Required"] = ["EventSeries records require id, title, and a valid event source reference owned by this export."];
        if (requiredEventSeries.Any(series => series.IsAllDay && (series.StartTime is not null || series.EndTime is not null))) errors["Calendar.EventSeries.AllDay"] = ["All-day EventSeries must not include start or end times."];
        if (requiredEventSeries.Any(series => !series.IsAllDay && (series.StartTime is null || series.EndTime is null))) errors["Calendar.EventSeries.Timed"] = ["Timed EventSeries require start and end times."];
        if (requiredEventSeries.Any(series => series.EndDate < series.StartDate)) errors["Calendar.EventSeries.Range"] = ["EventSeries end date must be on or after start date."];
        if (requiredEventSeries.Any(series => !series.IsAllDay && series.StartDate == series.EndDate && series.EndTime < series.StartTime)) errors["Calendar.EventSeries.TimeRange"] = ["Timed EventSeries end time must be on or after start time on the same date."];
        if (requiredRecurrence.Rules is null) errors["Calendar.Recurrence.Rules"] = ["Recurrence rules collection is required."];
        else if (requiredRecurrence.Rules.Any(rule => !IsSupportedRecurrence(rule))) errors["Calendar.Recurrence"] = ["Recurrence rules must use None, Daily, Weekly, Monthly, or Yearly."];
        if (requiredExceptions.Any(exception => exception.Id == Guid.Empty || exception.EventSeriesId == Guid.Empty || !seriesIds.Contains(exception.EventSeriesId) || exception.OccurrenceDate == default || !IsSupportedExceptionType(exception.ExceptionType))) errors["Calendar.Exceptions.Required"] = ["EventException records require id, supported type, occurrence date, and a valid EventSeries reference owned by this export."];
        if (requiredEventSeries.Any(series => series.Recurrence is not null && !IsSupportedRecurrence(series.Recurrence))) errors["Calendar.EventSeries.Recurrence"] = ["EventSeries recurrence must use None, Daily, Weekly, Monthly, or Yearly."];
        return errors;
    }

    private static RecurrenceType ParseRecurrenceType(CalendarExportRecurrence? recurrence) => Enum.TryParse<RecurrenceType>(recurrence?.RuleType, true, out var value) ? value : RecurrenceType.None;

    private static string NormalizeSourceType(string sourceType) => string.Equals(sourceType.Trim(), "manual", StringComparison.OrdinalIgnoreCase) ? EventSourceTypes.Manual : sourceType.Trim();

    private static bool IsSupportedRecurrence(CalendarExportRecurrence? recurrence) => recurrence is not null && Enum.TryParse<RecurrenceType>(recurrence.RuleType, true, out _);

    private static bool IsSupportedExceptionType(string? exceptionType) => string.Equals(exceptionType, "Skipped", StringComparison.OrdinalIgnoreCase) || string.Equals(exceptionType, "Modified", StringComparison.OrdinalIgnoreCase);

    private static bool IsValidTimeZone(string timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId)) return false;
        try { _ = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId); return true; }
        catch (TimeZoneNotFoundException) { return false; }
        catch (InvalidTimeZoneException) { return false; }
    }
}

public sealed record CalendarRestoreResult(bool Succeeded, IReadOnlyDictionary<string, string[]> ValidationErrors);
