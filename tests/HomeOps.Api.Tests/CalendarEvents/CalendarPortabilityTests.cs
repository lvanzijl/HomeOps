using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
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
        Assert.Contains(export.Calendar.Exceptions, candidate => candidate.ExceptionType == "Skipped");
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
    public async Task ExportIncludesManualEventsAndProviderConfigurationButExcludesImportedEvents()
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
        Assert.DoesNotContain(export.Calendar.EventSeries, candidate => candidate.Title == "Imported hidden from backup");
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
    public async Task RestorePreservesSourceConfigurationAndManualEventsButNotImportedEvents()
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
        Assert.DoesNotContain(await targetDbContext.EventSeries.ToListAsync(), candidate => candidate.Title == "Imported not restored" || candidate.ProviderEventId is not null);
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
