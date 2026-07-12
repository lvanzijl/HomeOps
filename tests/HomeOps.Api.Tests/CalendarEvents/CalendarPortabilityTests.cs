using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.FloorPlans;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using HomeOps.Api.Tests.Lists;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarPortabilityTests
{
    [Fact]
    public async Task ExportContainsEventSeriesWithoutCanonicalOccurrencesAndMetadata()
    {
        await using var dbContext = CreateDbContext();

        var export = await CalendarPortabilityService.ExportAsync(dbContext);

        Assert.Equal(CalendarExportDocument.CurrentFormat, export.Format);
        Assert.Equal(CalendarExportDocument.CurrentSchemaVersion, export.SchemaVersion);
        Assert.Equal(CalendarExportPayload.CurrentVersion, export.Calendar.Version);
        Assert.Equal(HouseholdTimeZone.DefaultTimeZoneId, export.Household.TimeZoneId);
        Assert.Contains(export.Calendar.EventSeries, candidate => candidate.Id == SeedCalendarEvents.DentistAppointmentId);
        Assert.Contains(export.Calendar.EventSources, candidate => candidate.Id == SeedCalendarEvents.EventSourceId);
        Assert.Empty(export.Calendar.Recurrence.Rules);
        Assert.Empty(export.Calendar.Exceptions);
        Assert.Empty(export.Calendar.Metadata);
        Assert.Empty(export.Metadata);
        Assert.DoesNotContain(export.GetType().GetProperties(), property => property.Name.Contains("Occurrence", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(export.Calendar.GetType().GetProperties(), property => property.Name.Contains("Occurrence", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task RestoreRejectsInvalidSchemaVersion()
    {
        await using var dbContext = CreateDbContext();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var invalid = export with { SchemaVersion = 999 };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains(nameof(CalendarExportDocument.SchemaVersion), result.ValidationErrors.Keys);
    }

    [Fact]
    public async Task RestoreReplacesExistingCalendarDataAndPreservesEventSeries()
    {
        await using var sourceDbContext = CreateDbContext("restore-source");
        var export = await CalendarPortabilityService.ExportAsync(sourceDbContext);
        var restoredSeriesId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var replacement = export with
        {
            Calendar = export.Calendar with
            {
                EventSeries =
                [
                    new CalendarExportEventSeries(restoredSeriesId, SeedCalendarEvents.EventSourceId, "Restored Dinner", "Family", false, new DateOnly(2026, 8, 1), new TimeOnly(18, 0), new DateOnly(2026, 8, 1), new TimeOnly(19, 0), null, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc)
                ]
            }
        };

        await using var targetDbContext = CreateDbContext("restore-target");
        targetDbContext.EventSeries.Add(new EventSeries
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = "Existing Event",
            StartDate = new DateOnly(2026, 9, 1),
            StartTime = new TimeOnly(8, 0),
            EndDate = new DateOnly(2026, 9, 1),
            EndTime = new TimeOnly(9, 0),
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        });
        await targetDbContext.SaveChangesAsync();

        var result = await CalendarPortabilityService.RestoreAsync(targetDbContext, replacement);

        Assert.True(result.Succeeded);
        var series = await targetDbContext.EventSeries.SingleAsync();
        Assert.Equal(restoredSeriesId, series.Id);
        Assert.Equal("Restored Dinner", series.Title);
        Assert.DoesNotContain(await targetDbContext.EventSeries.ToListAsync(), candidate => candidate.Title == "Existing Event");
    }

    [Fact]
    public async Task RestoreKeepsAgendaOutputEquivalentAfterRestore()
    {
        await using var dbContext = CreateDbContext("agenda-equivalence");
        var before = await dbContext.EventSeries.OrderBy(series => series.Id).Select(series => EventSeriesNormalizer.ToNormalizedEvent(series)).ToListAsync();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, export);

        Assert.True(result.Succeeded);
        var after = await dbContext.EventSeries.OrderBy(series => series.Id).Select(series => EventSeriesNormalizer.ToNormalizedEvent(series)).ToListAsync();
        Assert.Equal(before.Select(EventProjection), after.Select(EventProjection));
    }


    [Fact]
    public async Task RestoreCreatesPreRestoreSnapshotBeforeReplacingCalendarData()
    {
        await using var dbContext = CreateDbContext("pre-restore-snapshot");
        using var snapshotDirectory = UseSnapshotDirectory();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var replacement = export with
        {
            Calendar = export.Calendar with
            {
                EventSeries =
                [
                    export.Calendar.EventSeries.First() with { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), Title = "Snapshot Restore" }
                ]
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, replacement);

        Assert.True(result.Succeeded);
        var snapshotPath = Assert.Single(Directory.GetFiles(CalendarPortabilityService.PreRestoreSnapshotDirectory, "calendar-pre-restore-*.json"));
        var snapshotJson = await File.ReadAllTextAsync(snapshotPath);
        Assert.Contains(CalendarExportDocument.CurrentFormat, snapshotJson);
        Assert.Contains("Dentist Appointment", snapshotJson);
        Assert.Equal("Snapshot Restore", (await dbContext.EventSeries.SingleAsync()).Title);
    }

    [Fact]
    public async Task RestoreAbortsWhenPreRestoreSnapshotCannotBeCreated()
    {
        await using var dbContext = CreateDbContext("pre-restore-failure");
        var before = await dbContext.EventSeries.OrderBy(series => series.Id).Select(series => series.Title).ToListAsync();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var previousDirectory = CalendarPortabilityService.PreRestoreSnapshotDirectory;
        CalendarPortabilityService.PreRestoreSnapshotDirectory = string.Empty;

        try
        {
            var result = await CalendarPortabilityService.RestoreAsync(dbContext, export);

            Assert.False(result.Succeeded);
            Assert.Contains("PreRestoreExport", result.ValidationErrors.Keys);
            var after = await dbContext.EventSeries.OrderBy(series => series.Id).Select(series => series.Title).ToListAsync();
            Assert.Equal(before, after);
        }
        finally
        {
            CalendarPortabilityService.PreRestoreSnapshotDirectory = previousDirectory;
        }
    }

    [Fact]
    public void SnapshotDirectoryConfigurationUsesSafeDefaultWhenUnset()
    {
        var previousDirectory = CalendarPortabilityService.PreRestoreSnapshotDirectory;

        try
        {
            CalendarPortabilityService.ConfigurePreRestoreSnapshotDirectory("  " );
            Assert.EndsWith(Path.Combine("calendar-restore-snapshots"), CalendarPortabilityService.PreRestoreSnapshotDirectory);

            var configured = Path.Combine(Path.GetTempPath(), "homeops-configured-snapshots");
            CalendarPortabilityService.ConfigurePreRestoreSnapshotDirectory(configured);
            Assert.Equal(configured, CalendarPortabilityService.PreRestoreSnapshotDirectory);
        }
        finally
        {
            CalendarPortabilityService.PreRestoreSnapshotDirectory = previousDirectory;
        }
    }

    [Fact]
    public async Task RestoreRejectsInvalidExportBeforeModifyingExistingCalendarData()
    {
        await using var dbContext = CreateDbContext("invalid-rollback");
        var before = await dbContext.EventSeries.OrderBy(series => series.Id).Select(series => series.Title).ToListAsync();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var invalid = export with
        {
            Calendar = export.Calendar with
            {
                EventSeries =
                [
                    export.Calendar.EventSeries.First() with { EventSourceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc") }
                ]
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains("Calendar.EventSeries.Required", result.ValidationErrors.Keys);
        var after = await dbContext.EventSeries.OrderBy(series => series.Id).Select(series => series.Title).ToListAsync();
        Assert.Equal(before, after);
    }

    [Fact]
    public async Task ExportRestoreSupportsRecurrenceAndExceptionCompatibility()
    {
        await using var dbContext = CreateDbContext("recurrence-export");
        var series = await dbContext.EventSeries.FirstAsync();
        series.RecurrenceType = RecurrenceType.Weekly;
        dbContext.EventExceptions.Add(new EventException
        {
            Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            EventSeriesId = series.Id,
            OccurrenceDate = series.StartDate.AddDays(7),
            IsSkipped = true,
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        });
        await dbContext.SaveChangesAsync();

        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var result = await CalendarPortabilityService.RestoreAsync(dbContext, export);

        Assert.True(result.Succeeded);
        Assert.Contains(export.Calendar.EventSeries, candidate => candidate.Recurrence?.RuleType == nameof(RecurrenceType.Weekly));
        Assert.Contains(export.Calendar.Exceptions, candidate => candidate.ExceptionType == "Skipped" && candidate.OccurrenceKey == $"{series.StartDate.AddDays(7):yyyy-MM-dd}T{series.StartTime:HH:mm:ss}");
    }


    [Fact]
    public async Task ExportRestoreRoundTripsRecurrenceV2RulesExceptionsAndUnsupportedMetadata()
    {
        await using var sourceDbContext = CreateDbContext("recurrence-v2-export-source");
        var manualSeries = await sourceDbContext.EventSeries.FirstAsync();
        manualSeries.RecurrenceType = RecurrenceType.None;
        manualSeries.RecurrenceRule = new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 2, EndMode = RecurrenceEndMode.AfterCount, Count = 4, WeeklyDays = WeeklyDays.Serialize([DayOfWeek.Monday, DayOfWeek.Wednesday]) };
        var importedSource = AddFeedSource(sourceDbContext, "Unsupported Feed", enabled: true, DateTimeOffset.UtcNow);
        var importedSeries = new EventSeries
        {
            Id = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            EventSourceId = importedSource.Id,
            ProviderEventId = "unsupported-provider",
            Title = "Unsupported imported",
            StartDate = new DateOnly(2026, 7, 6),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 7, 6),
            EndTime = new TimeOnly(10, 0),
            RecurrenceRule = new EventRecurrenceRule { RawProviderRecurrenceRule = "FREQ=MONTHLY;BYDAY=1MO", UnsupportedRecurrenceStatus = UnsupportedRecurrenceStatus.Unsupported, UnsupportedRecurrenceReason = "unsupported BYDAY" },
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        };
        sourceDbContext.EventSeries.Add(importedSeries);
        sourceDbContext.EventExceptions.Add(new EventException
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            EventSeriesId = manualSeries.Id,
            OccurrenceDate = manualSeries.StartDate.AddDays(2),
            OccurrenceKey = OccurrenceKey.FromOriginalStart(manualSeries.StartDate.AddDays(2), manualSeries.StartTime),
            ExceptionType = EventExceptionType.Modified,
            IsSkipped = false,
            Title = "Moved manual",
            Location = "Library",
            StartDate = manualSeries.StartDate.AddDays(3),
            StartTime = new TimeOnly(11, 0),
            EndDate = manualSeries.StartDate.AddDays(3),
            EndTime = new TimeOnly(12, 0),
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        });
        await sourceDbContext.SaveChangesAsync();

        var export = await CalendarPortabilityService.ExportAsync(sourceDbContext);
        await using var targetDbContext = CreateDbContext("recurrence-v2-export-target");
        var result = await CalendarPortabilityService.RestoreAsync(targetDbContext, export);

        Assert.True(result.Succeeded);
        var exportedManual = Assert.Single(export.Calendar.EventSeries, candidate => candidate.Id == manualSeries.Id);
        Assert.Equal("Weekly", exportedManual.Recurrence?.Frequency);
        Assert.Equal("Monday,Wednesday", exportedManual.Recurrence?.WeeklyDays);
        var exportedImported = Assert.Single(export.Calendar.EventSeries, candidate => candidate.Id == importedSeries.Id);
        Assert.Null(exportedImported.Recurrence?.Frequency);
        Assert.Equal(nameof(UnsupportedRecurrenceStatus.Unsupported), exportedImported.Recurrence?.UnsupportedRecurrenceStatus);
        Assert.Equal("FREQ=MONTHLY;BYDAY=1MO", exportedImported.Recurrence?.RawProviderRecurrenceRule);
        Assert.Contains(export.Calendar.Exceptions, exception => exception.EventSeriesId == manualSeries.Id && exception.OccurrenceKey == OccurrenceKey.FromOriginalStart(manualSeries.StartDate.AddDays(2), manualSeries.StartTime).Serialize() && exception.Location == "Library");
        var restoredManual = await targetDbContext.EventSeries.Include(series => series.Exceptions).SingleAsync(series => series.Id == manualSeries.Id);
        Assert.Equal(RecurrenceFrequency.Weekly, restoredManual.RecurrenceRule!.Frequency);
        Assert.Equal(2, restoredManual.RecurrenceRule.Interval);
        var restoredException = Assert.Single(restoredManual.Exceptions);
        Assert.Equal(EventExceptionType.Modified, restoredException.ExceptionType);
        Assert.Equal("Library", restoredException.Location);
        var restoredImported = await targetDbContext.EventSeries.SingleAsync(series => series.Id == importedSeries.Id);
        Assert.Equal(UnsupportedRecurrenceStatus.Unsupported, restoredImported.RecurrenceRule!.UnsupportedRecurrenceStatus);
        Assert.Equal("FREQ=MONTHLY;BYDAY=1MO", restoredImported.RecurrenceRule.RawProviderRecurrenceRule);
    }


    [Fact]
    public async Task RestoreRejectsInvalidRecurrenceAndDuplicateOccurrenceKeys()
    {
        await using var dbContext = CreateDbContext("recurrence-v2-invalid-restore");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var series = export.Calendar.EventSeries.First();
        var invalidSeries = series with
        {
            Recurrence = new CalendarExportRecurrence(
                "Weekly",
                string.Empty,
                Frequency: "Weekly",
                Interval: 1,
                EndMode: "Never")
        };
        var key = $"{series.StartDate:yyyy-MM-dd}T{series.StartTime:HH:mm:ss}";
        var duplicateA = new CalendarExportEventException(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), series.Id, series.StartDate, "Skipped", OccurrenceKey: key);
        var duplicateB = new CalendarExportEventException(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), series.Id, series.StartDate, "Skipped", OccurrenceKey: key);
        var invalid = export with
        {
            Calendar = export.Calendar with
            {
                EventSeries = export.Calendar.EventSeries.Select(candidate => candidate.Id == series.Id ? invalidSeries : candidate).ToArray(),
                Exceptions = [duplicateA, duplicateB]
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains(result.ValidationErrors.Keys, key => key.Contains("Recurrence", StringComparison.Ordinal));
        Assert.Contains("Calendar.Exceptions.OccurrenceKey", result.ValidationErrors.Keys);
    }


    [Fact]
    public async Task RestoreUsesSeriesStartTimeForLegacyExceptionOccurrenceKeyFallback()
    {
        await using var dbContext = CreateDbContext("legacy-exception-key-restore");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var series = export.Calendar.EventSeries.First();
        var legacyException = new CalendarExportEventException(
            Guid.Parse("44444444-4444-4444-4444-444444444444"),
            series.Id,
            series.StartDate.AddDays(7),
            "Modified",
            Title: "Moved legacy occurrence",
            StartDate: series.StartDate.AddDays(8),
            StartTime: new TimeOnly(14, 30),
            EndDate: series.StartDate.AddDays(8),
            EndTime: new TimeOnly(15, 30),
            OccurrenceKey: null);
        var legacyBackup = export with { Calendar = export.Calendar with { Exceptions = [legacyException] } };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, legacyBackup);

        Assert.True(result.Succeeded);
        var restoredException = await dbContext.EventExceptions.SingleAsync(exception => exception.Id == legacyException.Id);
        Assert.Equal(OccurrenceKey.FromOriginalStart(legacyException.OccurrenceDate, series.StartTime), restoredException.OccurrenceKey);
    }

    [Fact]
    public async Task RestoreAllowsRecurrenceEndedBeforeFirstOccurrenceForSplitHistory()
    {
        await using var dbContext = CreateDbContext("ended-before-first-restore");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var series = export.Calendar.EventSeries.First();
        var endedHistory = series with
        {
            Recurrence = new CalendarExportRecurrence(
                "Daily",
                string.Empty,
                Frequency: "Daily",
                Interval: 1,
                EndMode: "OnDate",
                UntilDate: series.StartDate.AddDays(-1))
        };
        var backup = export with { Calendar = export.Calendar with { EventSeries = export.Calendar.EventSeries.Select(candidate => candidate.Id == series.Id ? endedHistory : candidate).ToArray() } };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, backup);

        Assert.True(result.Succeeded);
        var restored = await dbContext.EventSeries.SingleAsync(candidate => candidate.Id == series.Id);
        Assert.Equal(RecurrenceEndMode.OnDate, restored.RecurrenceRule?.EndMode);
        Assert.Equal(series.StartDate.AddDays(-1), restored.RecurrenceRule?.UntilDate);
    }

    [Fact]
    public async Task CalendarRestoreApiRejectsInvalidInputAndAgendaStillWorks()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var export = await client.GetFromJsonAsync<CalendarExportDocument>("/api/calendar/export");
        Assert.NotNull(export);

        var invalid = export! with { Format = "invalid" };
        var invalidResponse = await client.PostAsJsonAsync("/api/calendar/restore", invalid);
        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);

        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.NotNull(events);
        Assert.Contains(events!, candidate => candidate.Title == "Parent Evening");
    }

    [Fact]
    public async Task ExportIncludesManualAndImportedEventsWithProviderConfiguration()
    {
        await using var dbContext = CreateDbContext("source-config-export");
        var now = DateTimeOffset.UtcNow;
        var feedSource = AddFeedSource(dbContext, "Family Feed", enabled: true, now);
        var fileSource = AddFileSource(dbContext, "School File", enabled: false, now);
        dbContext.EventSeries.Add(new EventSeries
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            EventSourceId = feedSource.Id,
            ProviderEventId = "provider-event",
            Title = "Imported hidden from backup",
            StartDate = new DateOnly(2026, 7, 6),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 7, 6),
            EndTime = new TimeOnly(10, 0),
            CreatedUtc = now,
            UpdatedUtc = now,
        });
        await dbContext.SaveChangesAsync();

        var export = await CalendarPortabilityService.ExportAsync(dbContext);

        Assert.Contains(export.Calendar.EventSeries, candidate => candidate.Title == "Dentist Appointment");
        Assert.Contains(export.Calendar.EventSeries, candidate => candidate.Title == "Imported hidden from backup" && candidate.ProviderEventId == "provider-event");
        var feedExport = Assert.Single(export.Calendar.EventSources, source => source.Id == feedSource.Id);
        Assert.Equal(EventSourceTypes.ICalFeed, feedExport.ProviderConfiguration?.ProviderType);
        Assert.Equal("https://example.test/family.ics", feedExport.ProviderConfiguration?.ICalFeed?.FeedUrl);
        Assert.Null(feedExport.ProviderConfiguration?.ICalFile);
        Assert.DoesNotContain("secret", System.Text.Json.JsonSerializer.Serialize(export), StringComparison.OrdinalIgnoreCase);
        var fileExport = Assert.Single(export.Calendar.EventSources, source => source.Id == fileSource.Id);
        Assert.False(fileExport.IsEnabled);
        Assert.Equal("school.ics", fileExport.ProviderConfiguration?.ICalFile?.OriginalFilename);
    }

    [Fact]
    public async Task RestorePreservesSourceConfigurationManualEventsAndImportedEvents()
    {
        await using var sourceDbContext = CreateDbContext("source-config-restore-source");
        var now = DateTimeOffset.UtcNow;
        var feedSource = AddFeedSource(sourceDbContext, "Family Feed", enabled: true, now);
        var fileSource = AddFileSource(sourceDbContext, "Disabled File", enabled: false, now);
        sourceDbContext.EventSeries.Add(new EventSeries
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            EventSourceId = feedSource.Id,
            ProviderEventId = "provider-event",
            Title = "Imported not restored",
            StartDate = new DateOnly(2026, 7, 6),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 7, 6),
            EndTime = new TimeOnly(10, 0),
            CreatedUtc = now,
            UpdatedUtc = now,
        });
        await sourceDbContext.SaveChangesAsync();
        var export = await CalendarPortabilityService.ExportAsync(sourceDbContext);

        await using var targetDbContext = CreateDbContext("source-config-restore-target");
        var result = await CalendarPortabilityService.RestoreAsync(targetDbContext, export);

        Assert.True(result.Succeeded);
        Assert.Contains(await targetDbContext.EventSeries.ToListAsync(), candidate => candidate.Title == "Dentist Appointment" && candidate.ProviderEventId is null);
        Assert.Contains(await targetDbContext.EventSeries.ToListAsync(), candidate => candidate.Title == "Imported not restored" && candidate.ProviderEventId == "provider-event");
        var restoredFeed = await targetDbContext.EventSources.Include(source => source.Configuration).SingleAsync(source => source.Id == feedSource.Id);
        Assert.True(restoredFeed.IsEnabled);
        Assert.Equal(HomeOps.Api.CalendarEvents.EventSourceHealthStatus.NeverSynced, restoredFeed.HealthStatus);
        Assert.Null(restoredFeed.LastSyncAttemptUtc);
        Assert.IsType<ICalFeedSourceConfiguration>(restoredFeed.Configuration);
        var restoredFile = await targetDbContext.EventSources.Include(source => source.Configuration).SingleAsync(source => source.Id == fileSource.Id);
        Assert.False(restoredFile.IsEnabled);
        Assert.Equal(HomeOps.Api.CalendarEvents.EventSourceHealthStatus.NeverSynced, restoredFile.HealthStatus);
        Assert.IsType<ICalFileSourceConfiguration>(restoredFile.Configuration);
        var manualSource = await targetDbContext.EventSources.SingleAsync(source => source.Id == SeedCalendarEvents.EventSourceId);
        Assert.True(manualSource.IsSystemManualSource);
        Assert.Equal(HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy, manualSource.HealthStatus);
    }

    [Fact]
    public async Task RestoreUpdatesExistingExternalSourceWithSameIdentifier()
    {
        await using var sourceDbContext = CreateDbContext("restore-existing-external-source");
        var now = DateTimeOffset.UtcNow;
        var feedSource = AddFeedSource(sourceDbContext, "Restored Feed", enabled: true, now);
        await sourceDbContext.SaveChangesAsync();
        var export = await CalendarPortabilityService.ExportAsync(sourceDbContext);

        await using var targetDbContext = CreateDbContext("restore-existing-external-target");
        targetDbContext.EventSources.Add(new HomeOps.Api.CalendarEvents.EventSource
        {
            Id = feedSource.Id,
            HouseholdId = SeedHousehold.Id,
            Name = "Existing Feed",
            SourceType = EventSourceTypes.ICalFeed,
            Icon = "🌐",
            IsEnabled = true,
            IsWritable = false,
            HealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy,
            PollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval.EveryDay,
            CreatedUtc = now.AddDays(-2),
            UpdatedUtc = now.AddDays(-2),
        });
        targetDbContext.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration { EventSourceId = feedSource.Id, FeedUrl = "https://old.example.test/calendar.ics", CreatedUtc = now.AddDays(-2), UpdatedUtc = now.AddDays(-2) });
        await targetDbContext.SaveChangesAsync();

        var result = await CalendarPortabilityService.RestoreAsync(targetDbContext, export);

        Assert.True(result.Succeeded);
        var restored = await targetDbContext.EventSources.Include(source => source.Configuration).SingleAsync(source => source.Id == feedSource.Id);
        Assert.Equal("Restored Feed", restored.Name);
        Assert.Equal(HomeOps.Api.CalendarEvents.EventSourceHealthStatus.NeverSynced, restored.HealthStatus);
        var configuration = Assert.IsType<ICalFeedSourceConfiguration>(restored.Configuration);
        Assert.Equal("https://example.test/family.ics", configuration.FeedUrl);
    }

    [Fact]
    public async Task RestoreRejectsInvalidProviderConfigurationAndProtectedManualSourceChanges()
    {
        await using var dbContext = CreateDbContext("invalid-source-config");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var invalidConfiguration = export with
        {
            Calendar = export.Calendar with
            {
                EventSources =
                [
                    export.Calendar.EventSources.Single(source => source.Id == SeedCalendarEvents.EventSourceId),
                    new CalendarExportEventSource(Guid.Parse("30000000-0000-0000-0000-000000000001"), "Bad Feed", EventSourceTypes.ICalFeed, false, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc, ProviderConfiguration: new CalendarExportProviderConfiguration(EventSourceTypes.ICalFeed))
                ]
            }
        };
        var changedManualSource = export with
        {
            Calendar = export.Calendar with
            {
                EventSources =
                [
                    export.Calendar.EventSources.Single(source => source.Id == SeedCalendarEvents.EventSourceId) with { Id = Guid.Parse("30000000-0000-0000-0000-000000000002"), IsSystem = true }
                ],
                EventSeries = []
            }
        };

        var invalidConfigResult = await CalendarPortabilityService.RestoreAsync(dbContext, invalidConfiguration);
        var manualResult = await CalendarPortabilityService.RestoreAsync(dbContext, changedManualSource);

        Assert.False(invalidConfigResult.Succeeded);
        Assert.Contains("Calendar.EventSources.ProviderConfiguration", invalidConfigResult.ValidationErrors.Keys);
        Assert.False(manualResult.Succeeded);
        Assert.Contains("Calendar.EventSources.SystemManual", manualResult.ValidationErrors.Keys);
    }

    [Fact]
    public async Task RestoreRejectsDuplicateSourceIdsDuplicateManualEventIdsUnsupportedVersionAndMalformedBackup()
    {
        await using var dbContext = CreateDbContext("invalid-backups");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var source = export.Calendar.EventSources.Single(source => source.Id == SeedCalendarEvents.EventSourceId);
        var series = export.Calendar.EventSeries.First();
        var duplicateSources = export with { Calendar = export.Calendar with { EventSources = [source, source with { Name = "Duplicate" }] } };
        var duplicateEvents = export with { Calendar = export.Calendar with { EventSeries = [series, series with { Title = "Duplicate" }] } };
        var unsupportedVersion = export with { Calendar = export.Calendar with { Version = 999 } };

        var duplicateSourceResult = await CalendarPortabilityService.RestoreAsync(dbContext, duplicateSources);
        var duplicateEventResult = await CalendarPortabilityService.RestoreAsync(dbContext, duplicateEvents);
        var unsupportedVersionResult = await CalendarPortabilityService.RestoreAsync(dbContext, unsupportedVersion);
        var malformedResult = await CalendarPortabilityService.RestoreAsync(dbContext, null);

        Assert.False(duplicateSourceResult.Succeeded);
        Assert.Contains("Calendar.EventSources", duplicateSourceResult.ValidationErrors.Keys);
        Assert.False(duplicateEventResult.Succeeded);
        Assert.Contains("Calendar.EventSeries", duplicateEventResult.ValidationErrors.Keys);
        Assert.False(unsupportedVersionResult.Succeeded);
        Assert.Contains("Calendar.Version", unsupportedVersionResult.ValidationErrors.Keys);
        Assert.False(malformedResult.Succeeded);
        Assert.Contains("document", malformedResult.ValidationErrors.Keys);
    }

    [Fact]
    public async Task RestoreMaintainsExistingManualBackupCompatibility()
    {
        await using var dbContext = CreateDbContext("manual-compatibility");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var legacyShape = export with
        {
            Calendar = export.Calendar with
            {
                EventSources = export.Calendar.EventSources.Select(source => new CalendarExportEventSource(source.Id, source.Name, "manual", source.IsWritable, source.CreatedUtc, source.UpdatedUtc)).ToList()
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, legacyShape);

        Assert.True(result.Succeeded);
        Assert.Contains(await dbContext.EventSeries.ToListAsync(), candidate => candidate.Title == "Dentist Appointment");
        var manualSource = await dbContext.EventSources.SingleAsync(source => source.Id == SeedCalendarEvents.EventSourceId);
        Assert.True(manualSource.IsSystemManualSource);
        Assert.True(manualSource.IsEnabled);
    }


    [Fact]
    public async Task RestoreRejectsMalformedFloorRoomGraphWithoutChangingExistingRooms()
    {
        await using var dbContext = CreateDbContext("floor-room-malformed");
        var existingFloor = AddFloor(dbContext, "Existing", 0);
        AddRoom(dbContext, existingFloor.Id, "Existing room", RoomType.Office, 0);
        await dbContext.SaveChangesAsync();
        var before = await FloorRoomSnapshot(dbContext);
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var floorId = Guid.Parse("aaaaaaaa-1111-1111-1111-111111111111");
        var missingFloorId = Guid.Parse("bbbbbbbb-2222-2222-2222-222222222222");
        var invalid = export with
        {
            Calendar = export.Calendar with
            {
                Floors = [FloorExport(floorId, "Restored", 0)],
                Rooms = [RoomExport(Guid.Parse("cccccccc-3333-3333-3333-333333333333"), missingFloorId, "Missing floor", RoomType.Bedroom, 0)]
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains("Calendar.Rooms.FloorId", result.ValidationErrors.Keys);
        Assert.Equal(before, await FloorRoomSnapshot(dbContext));
    }

    [Fact]
    public async Task RestoreRejectsDuplicateFloorAndRoomIdentitiesAndNames()
    {
        await using var dbContext = CreateDbContext("floor-room-duplicates");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var floorId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var roomId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var invalid = export with
        {
            Calendar = export.Calendar with
            {
                Floors = [FloorExport(floorId, "Duplicate", 0), FloorExport(floorId, "Duplicate", 1)],
                Rooms = [RoomExport(roomId, floorId, "Bedroom", RoomType.Bedroom, 0), RoomExport(roomId, floorId, "Bedroom", RoomType.Bathroom, 1)]
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains("Calendar.Floors.Id", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Rooms.Id", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Floors.Name", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Rooms.Name", result.ValidationErrors.Keys);
    }

    [Fact]
    public async Task RestoreRejectsInvalidNamesRoomTypeFamilyMemberLifecycleAndOrdering()
    {
        await using var dbContext = CreateDbContext("floor-room-validation");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var floorId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
        var invalid = export with
        {
            Calendar = export.Calendar with
            {
                Floors = [FloorExport(floorId, " ", 2, isArchived: true, isEnabled: true, archivedUtc: SeedCalendarEvents.SeededUtc)],
                Rooms =
                [
                    new CalendarExportRoom(Guid.Parse("bbbbbbbb-0000-0000-0000-000000000001"), floorId, " ", "NotAType", -1, "missing-member", true, false, null, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc),
                    RoomExport(Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002"), floorId, "Other", RoomType.Other, -1)
                ]
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains("Calendar.Floors.Name", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Floors.SortOrder", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Floors.ArchiveState", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Rooms.Name", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Rooms.RoomType", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Rooms.FamilyMemberId", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Rooms.SortOrder", result.ValidationErrors.Keys);
        Assert.Contains("Calendar.Rooms.FloorState", result.ValidationErrors.Keys);
    }

    [Fact]
    public async Task RestoreAcceptsSameRoomNameOnDifferentFloorsAndPreservesOrderArchiveStateAndFamilyMember()
    {
        await using var dbContext = CreateDbContext("floor-room-success");
        using var snapshotDirectory = UseSnapshotDirectory();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var activeFloor = Guid.Parse("aaaaaaaa-1000-0000-0000-000000000001");
        var secondFloor = Guid.Parse("aaaaaaaa-1000-0000-0000-000000000002");
        var archivedFloor = Guid.Parse("aaaaaaaa-1000-0000-0000-000000000003");
        var restored = export with
        {
            Calendar = export.Calendar with
            {
                Floors = [FloorExport(activeFloor, "Active", 0), FloorExport(secondFloor, "Second", 1), FloorExport(archivedFloor, "Archived", 2, isArchived: true, isEnabled: false, archivedUtc: SeedCalendarEvents.SeededUtc)],
                Rooms =
                [
                    RoomExport(Guid.Parse("bbbbbbbb-1000-0000-0000-000000000001"), activeFloor, "Bedroom", RoomType.Bedroom, 0, "alex"),
                    RoomExport(Guid.Parse("bbbbbbbb-1000-0000-0000-000000000002"), secondFloor, "Bedroom", RoomType.Bedroom, 0),
                    RoomExport(Guid.Parse("bbbbbbbb-1000-0000-0000-000000000003"), archivedFloor, "Archived room", RoomType.Storage, 0, null, isArchived: true, isEnabled: false, archivedUtc: SeedCalendarEvents.SeededUtc)
                ]
            }
        };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, restored);

        Assert.True(result.Succeeded);
        Assert.Equal(["Active", "Second", "Archived"], await dbContext.Floors.OrderBy(floor => floor.SortOrder).Select(floor => floor.Name).ToArrayAsync());
        Assert.Equal("alex", await dbContext.Rooms.Where(room => room.Name == "Bedroom" && room.FloorId == activeFloor).Select(room => room.FamilyMemberId).SingleAsync());
        Assert.True(await dbContext.Floors.Where(floor => floor.Id == archivedFloor).Select(floor => floor.IsArchived).SingleAsync());
        Assert.True(await dbContext.Rooms.Where(room => room.Name == "Archived room").Select(room => room.IsArchived).SingleAsync());
        Assert.Single(Directory.GetFiles(CalendarPortabilityService.PreRestoreSnapshotDirectory, "calendar-pre-restore-*.json"));
    }

    [Fact]
    public async Task RestoreWithAbsentFloorRoomCollectionsPreservesExistingStateButEmptyCollectionsReplace()
    {
        await using var dbContext = CreateDbContext("floor-room-legacy");
        var existingFloor = AddFloor(dbContext, "Keep", 0);
        AddRoom(dbContext, existingFloor.Id, "Keep room", RoomType.Office, 0);
        await dbContext.SaveChangesAsync();
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var legacy = export with { Calendar = export.Calendar with { Floors = null, Rooms = null } };

        var legacyResult = await CalendarPortabilityService.RestoreAsync(dbContext, legacy);

        Assert.True(legacyResult.Succeeded);
        Assert.Equal(["Keep"], await dbContext.Floors.Select(floor => floor.Name).ToArrayAsync());

        var emptyReplacement = export with { Calendar = export.Calendar with { Floors = [], Rooms = [] } };
        var emptyResult = await CalendarPortabilityService.RestoreAsync(dbContext, emptyReplacement);

        Assert.True(emptyResult.Succeeded);
        Assert.Empty(await dbContext.Floors.ToListAsync());
        Assert.Empty(await dbContext.Rooms.ToListAsync());
    }

    private static HomeOps.Api.CalendarEvents.EventSource AddFeedSource(HomeOpsDbContext dbContext, string name, bool enabled, DateTimeOffset now)
    {
        var source = new HomeOps.Api.CalendarEvents.EventSource
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            Name = name,
            SourceType = EventSourceTypes.ICalFeed,
            Icon = "🌐",
            IsEnabled = enabled,
            IsWritable = false,
            HealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy,
            PollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval.EveryHour,
            LastSyncAttemptUtc = now,
            LastSuccessfulSyncUtc = now,
            ProviderSourceId = "provider-secret-should-not-export",
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        dbContext.EventSources.Add(source);
        dbContext.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration { EventSourceId = source.Id, FeedUrl = "https://example.test/family.ics", ETag = "secret-etag", LastModified = "secret-last-modified", LastContentHash = "secret-hash", CreatedUtc = now, UpdatedUtc = now });
        return source;
    }

    private static HomeOps.Api.CalendarEvents.EventSource AddFileSource(HomeOpsDbContext dbContext, string name, bool enabled, DateTimeOffset now)
    {
        var source = new HomeOps.Api.CalendarEvents.EventSource
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            Name = name,
            SourceType = EventSourceTypes.ICalFile,
            Icon = "📄",
            IsEnabled = enabled,
            IsWritable = false,
            HealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Failed,
            PollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval.EveryDay,
            LastFailedSyncUtc = now,
            LastErrorCode = "secret-error-code",
            LastErrorMessage = "secret-error-message",
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        dbContext.EventSources.Add(source);
        dbContext.ICalFileSourceConfigurations.Add(new ICalFileSourceConfiguration { EventSourceId = source.Id, FileReference = "store://calendar/school", OriginalFilename = "school.ics", ContentHash = "file-hash", UploadedUtc = now, CreatedUtc = now, UpdatedUtc = now });
        return source;
    }

    private static IDisposable UseSnapshotDirectory()
    {
        var previousDirectory = CalendarPortabilityService.PreRestoreSnapshotDirectory;
        var snapshotDirectory = Path.Combine(Path.GetTempPath(), "homeops-calendar-snapshots", Guid.NewGuid().ToString());
        CalendarPortabilityService.PreRestoreSnapshotDirectory = snapshotDirectory;
        return new SnapshotDirectoryScope(previousDirectory, snapshotDirectory);
    }

    private sealed class SnapshotDirectoryScope(string previousDirectory, string snapshotDirectory) : IDisposable
    {
        public void Dispose()
        {
            CalendarPortabilityService.PreRestoreSnapshotDirectory = previousDirectory;
            if (Directory.Exists(snapshotDirectory))
            {
                Directory.Delete(snapshotDirectory, recursive: true);
            }
        }
    }

    private static object EventProjection(NormalizedEvent normalizedEvent) => new
    {
        normalizedEvent.Id,
        normalizedEvent.SourceId,
        normalizedEvent.Title,
        normalizedEvent.Description,
        normalizedEvent.StartsAt,
        normalizedEvent.EndsAt,
        normalizedEvent.AllDay,
        normalizedEvent.Editable,
    };


    private static Floor AddFloor(HomeOpsDbContext dbContext, string name, int sortOrder, bool isArchived = false)
    {
        var floor = new Floor
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            Name = name,
            SortOrder = sortOrder,
            IsEnabled = !isArchived,
            IsArchived = isArchived,
            ArchivedUtc = isArchived ? SeedCalendarEvents.SeededUtc : null,
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        };
        dbContext.Floors.Add(floor);
        return floor;
    }

    private static Room AddRoom(HomeOpsDbContext dbContext, Guid floorId, string name, RoomType roomType, int sortOrder)
    {
        var room = new Room
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            FloorId = floorId,
            Name = name,
            RoomType = roomType,
            SortOrder = sortOrder,
            IsEnabled = true,
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        };
        dbContext.Rooms.Add(room);
        return room;
    }

    private static CalendarExportFloor FloorExport(Guid id, string name, int sortOrder, bool isArchived = false, bool? isEnabled = null, DateTimeOffset? archivedUtc = null) =>
        new(id, name, sortOrder, isEnabled ?? !isArchived, isArchived, archivedUtc, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc);

    private static CalendarExportRoom RoomExport(Guid id, Guid floorId, string name, RoomType roomType, int sortOrder, string? familyMemberId = null, bool isArchived = false, bool? isEnabled = null, DateTimeOffset? archivedUtc = null) =>
        new(id, floorId, name, roomType.ToString(), sortOrder, familyMemberId, isEnabled ?? !isArchived, isArchived, archivedUtc, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc);

    private static async Task<string[]> FloorRoomSnapshot(HomeOpsDbContext dbContext) =>
        await dbContext.Floors.OrderBy(floor => floor.Name).Select(floor => $"F:{floor.Name}:{floor.SortOrder}:{floor.IsArchived}")
            .Concat(dbContext.Rooms.OrderBy(room => room.Name).Select(room => $"R:{room.Name}:{room.SortOrder}:{room.IsArchived}:{room.FamilyMemberId}"))
            .ToArrayAsync();

    private static HomeOpsDbContext CreateDbContext(string? name = null)
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .Options;
        var dbContext = new HomeOpsDbContext(options);
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
        return dbContext;
    }
}
