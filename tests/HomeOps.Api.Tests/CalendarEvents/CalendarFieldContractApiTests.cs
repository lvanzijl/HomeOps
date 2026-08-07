using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarFieldContractApiTests
{
    [Theory]
    [InlineData(2026, 1, 15, 10, 30, 1)]
    [InlineData(2026, 7, 15, 10, 30, 2)]
    public async Task CalendarFieldCreatePreservesAmsterdamWallClock(int year, int month, int day, int hour, int minute, int expectedOffsetHours)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var date = new DateOnly(year, month, day);

        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            "Local appointment", null, null, null, null, false,
            StartDate: date, StartTime: new TimeOnly(hour, minute),
            EndDate: date, EndTime: new TimeOnly(hour + 1, minute)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);
        Assert.Equal(new DateTimeOffset(year, month, day, hour, minute, 0, TimeSpan.FromHours(expectedOffsetHours)), created.StartUtc);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var stored = await db.EventSeries.SingleAsync(series => series.Id == created.Id);
        Assert.Equal(date, stored.StartDate);
        Assert.Equal(new TimeOnly(hour, minute), stored.StartTime);
        Assert.Equal(EventSeries.CurrentCalendarWriteContractVersion, stored.CalendarWriteContractVersion);
    }

    [Fact]
    public async Task CalendarFieldCreateRejectsNonexistentSpringForwardTime()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var response = await factory.CreateClient().PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            "Impossible", null, null, null, null, false,
            StartDate: new DateOnly(2026, 3, 29), StartTime: new TimeOnly(2, 30),
            EndDate: new DateOnly(2026, 3, 29), EndTime: new TimeOnly(3, 30)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("02:30 does not occur in Europe/Amsterdam", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task CalendarFieldCreateUsesFirstFallBackOccurrence()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var response = await factory.CreateClient().PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            "Ambiguous", null, null, null, null, false,
            StartDate: new DateOnly(2026, 10, 25), StartTime: new TimeOnly(2, 30),
            EndDate: new DateOnly(2026, 10, 25), EndTime: new TimeOnly(3, 30)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);
        Assert.Equal(TimeSpan.FromHours(2), created.StartUtc.Offset);
        Assert.Equal(new DateTimeOffset(2026, 10, 25, 0, 30, 0, TimeSpan.Zero), created.StartUtc.ToUniversalTime());
    }

    [Fact]
    public async Task AllDayCalendarFieldsRequireNullTimesAndPreserveInclusiveDates()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            "Holiday", null, null, null, null, true,
            StartDate: new DateOnly(2026, 7, 12), EndDate: new DateOnly(2026, 7, 19)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var stored = await db.EventSeries.SingleAsync(series => series.Title == "Holiday");
        Assert.Equal(new DateOnly(2026, 7, 12), stored.StartDate);
        Assert.Equal(new DateOnly(2026, 7, 19), stored.EndDate);
        Assert.Null(stored.StartTime);
        Assert.Null(stored.EndTime);
    }

    [Theory]
    [InlineData(2026, 3, 28, 1, 2)]
    [InlineData(2026, 10, 24, 2, 1)]
    public async Task RecurrencePreservesWallClockAcrossDstBoundary(int year, int month, int day, int firstOffset, int lastOffset)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var startDate = new DateOnly(year, month, day);
        var title = $"DST recurrence {year}-{month}-{day}";
        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            title, null, null, null, null, false,
            new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 3),
            StartDate: startDate, StartTime: new TimeOnly(9, 0),
            EndDate: startDate, EndTime: new TimeOnly(10, 0)));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        var occurrences = events!.Where(candidate => candidate.Title == title).OrderBy(candidate => candidate.StartsAt).ToArray();
        Assert.Equal(3, occurrences.Length);
        Assert.All(occurrences, occurrence => Assert.Equal(9, occurrence.StartsAt.Hour));
        Assert.Equal(TimeSpan.FromHours(firstOffset), occurrences.First().StartsAt.Offset);
        Assert.Equal(TimeSpan.FromHours(lastOffset), occurrences.Last().StartsAt.Offset);
    }

    [Fact]
    public async Task OccurrenceModifyAndSplitUseAtomicCalendarTiming()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var startDate = new DateOnly(2026, 7, 6);
        var createdResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            "Practice", null, null, null, null, false,
            new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 4),
            StartDate: startDate, StartTime: new TimeOnly(9, 0),
            EndDate: startDate, EndTime: new TimeOnly(10, 0)));
        var created = await createdResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);

        var modifyTiming = new CalendarFieldSetRequest(new DateOnly(2026, 7, 7), new TimeOnly(11, 0), new DateOnly(2026, 7, 7), new TimeOnly(12, 0), false);
        var modify = await client.PutAsJsonAsync($"/api/events/{created.Id}/occurrences/modify", new ModifyOccurrenceRequest("2026-07-07T09:00:00", Timing: modifyTiming));
        Assert.Equal(HttpStatusCode.NoContent, modify.StatusCode);

        var splitTiming = new CalendarFieldSetRequest(new DateOnly(2026, 7, 8), new TimeOnly(14, 0), new DateOnly(2026, 7, 8), new TimeOnly(15, 0), false);
        var split = await client.PutAsJsonAsync($"/api/events/{created.Id}/occurrences/split", new SplitEventSeriesRequest("2026-07-08T09:00:00", Timing: splitTiming));
        Assert.Equal(HttpStatusCode.Created, split.StatusCode);
        var splitSeries = await split.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(splitSeries);
        Assert.Equal(new DateTimeOffset(2026, 7, 8, 14, 0, 0, TimeSpan.FromHours(2)), splitSeries.StartUtc);

        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.Contains(events!, occurrence => occurrence.EventSeriesId == created.Id.ToString() && occurrence.StartsAt.Hour == 11 && occurrence.IsException);
    }

    [Fact]
    public async Task CalendarFieldsCannotBeMixedWithLegacyUtcFields()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var legacy = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);
        var response = await factory.CreateClient().PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            "Mixed", null, null, legacy, legacy.AddHours(1), false,
            StartDate: new DateOnly(2026, 7, 6), StartTime: new TimeOnly(9, 0),
            EndDate: new DateOnly(2026, 7, 6), EndTime: new TimeOnly(10, 0)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("cannot be combined", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task RepairRequiresPreviewedVersionAndExplicitConfirmation()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        Guid eventId;
        DateTimeOffset expectedUpdatedUtc;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var legacy = db.EventSeries.First(series => series.EventSourceId == SeedCalendarEvents.EventSourceId);
            legacy.CalendarWriteContractVersion = 1;
            eventId = legacy.Id;
            expectedUpdatedUtc = legacy.UpdatedUtc;
            await db.SaveChangesAsync();
        }

        var candidates = await client.GetFromJsonAsync<CalendarFieldRepairCandidateDto[]>("/api/events/calendar-field-repair-candidates");
        Assert.Contains(candidates!, candidate => candidate.EventId == eventId);
        var timing = new CalendarFieldSetRequest(new DateOnly(2026, 1, 20), new TimeOnly(9, 0), new DateOnly(2026, 1, 20), new TimeOnly(10, 0), false);
        var previewResponse = await client.PostAsJsonAsync($"/api/events/{eventId}/calendar-field-repair/preview", new PreviewCalendarFieldRepairRequest(timing));
        Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);

        var unconfirmed = await client.PostAsJsonAsync($"/api/events/{eventId}/calendar-field-repair", new ApplyCalendarFieldRepairRequest(timing, expectedUpdatedUtc, false));
        Assert.Equal(HttpStatusCode.BadRequest, unconfirmed.StatusCode);
        var applied = await client.PostAsJsonAsync($"/api/events/{eventId}/calendar-field-repair", new ApplyCalendarFieldRepairRequest(timing, expectedUpdatedUtc, true));
        Assert.Equal(HttpStatusCode.OK, applied.StatusCode);

        using var verificationScope = factory.Services.CreateScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var repaired = await verificationDb.EventSeries.SingleAsync(series => series.Id == eventId);
        Assert.Equal(EventSeries.CurrentCalendarWriteContractVersion, repaired.CalendarWriteContractVersion);
        Assert.Equal(new DateOnly(2026, 1, 20), repaired.StartDate);
    }
}
