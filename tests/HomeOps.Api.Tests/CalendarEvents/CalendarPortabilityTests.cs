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
    public async Task RestoreRejectsUnstableV1ContractShape()
    {
        await using var dbContext = CreateDbContext("contract-shape");
        var export = await CalendarPortabilityService.ExportAsync(dbContext);
        var invalid = export with { Calendar = export.Calendar with { Recurrence = new CalendarExportRecurrenceSection([new CalendarExportRecurrence("reserved", "future")]) } };

        var result = await CalendarPortabilityService.RestoreAsync(dbContext, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains("Calendar.Recurrence", result.ValidationErrors.Keys);
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
