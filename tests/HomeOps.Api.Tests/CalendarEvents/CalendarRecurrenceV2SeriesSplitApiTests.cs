using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarRecurrenceV2SeriesSplitApiTests
{
    [Fact]
    public async Task SplitDailyRecurrenceCreatesNewSeriesAndMovesFutureOccurrences()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var original = await CreateSeriesAsync(client, "Daily", new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 5));
        var splitKey = "2026-07-08T09:00:00";

        var response = await client.PutAsJsonAsync($"/api/events/{original.Id}/occurrences/split", new SplitEventSeriesRequest(splitKey, Title: "Daily future", Location: "Kitchen"));
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(created);
        Assert.NotEqual(original.Id, created.Id);
        Assert.Equal("Daily future", created.Title);
        Assert.NotNull(events);
        Assert.Contains(events, occurrence => occurrence.Title == "Daily" && occurrence.OccurrenceKey == "2026-07-06T09:00:00");
        Assert.Contains(events, occurrence => occurrence.Title == "Daily" && occurrence.OccurrenceKey == "2026-07-07T09:00:00");
        Assert.DoesNotContain(events, occurrence => occurrence.Title == "Daily" && string.CompareOrdinal(occurrence.OccurrenceKey, splitKey) >= 0);
        Assert.Contains(events, occurrence => occurrence.OccurrenceKey == splitKey && occurrence.Title == "Daily future");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var oldSeries = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == original.Id);
        var newSeries = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == created.Id);
        Assert.Equal(RecurrenceEndMode.OnDate, oldSeries.RecurrenceRule!.EndMode);
        Assert.Equal(new DateOnly(2026, 7, 7), oldSeries.RecurrenceRule.UntilDate);
        Assert.Equal(original.EventSourceId, newSeries.EventSourceId);
        Assert.Equal(RecurrenceFrequency.Daily, newSeries.RecurrenceRule!.Frequency);
        Assert.Equal(3, newSeries.RecurrenceRule.Count);
        Assert.Equal("Kitchen", newSeries.Location);
    }


    [Fact]
    public async Task SplitAtFirstOccurrenceMovesAllFutureOccurrencesToNewSeries()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var original = await CreateSeriesAsync(client, "First split", new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 3));

        var response = await client.PutAsJsonAsync($"/api/events/{original.Id}/occurrences/split", new SplitEventSeriesRequest("2026-07-06T09:00:00", Title: "First future"));
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(created);
        Assert.NotNull(events);
        Assert.DoesNotContain(events, occurrence => occurrence.Title == "First split");
        Assert.Contains(events, occurrence => occurrence.Title == "First future" && occurrence.OccurrenceKey == "2026-07-06T09:00:00");
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var oldSeries = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == original.Id);
        Assert.Equal(new DateOnly(2026, 7, 5), oldSeries.RecurrenceRule!.UntilDate);
    }

    [Theory]
    [MemberData(nameof(RecurrenceRules))]
    public async Task SplitRecurringSeriesCopiesRuleForWeeklyMonthlyAndYearly(RecurrenceRuleDto rule, string splitKey, RecurrenceFrequency expectedFrequency)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var original = await CreateSeriesAsync(client, $"{expectedFrequency} original", rule);

        var response = await client.PutAsJsonAsync($"/api/events/{original.Id}/occurrences/split", new SplitEventSeriesRequest(splitKey, Title: $"{expectedFrequency} future"));
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(created);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var oldSeries = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == original.Id);
        var newSeries = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == created.Id);
        Assert.Equal(RecurrenceEndMode.OnDate, oldSeries.RecurrenceRule!.EndMode);
        Assert.Equal(OccurrenceKey.Parse(splitKey).Date.AddDays(-1), oldSeries.RecurrenceRule.UntilDate);
        Assert.Equal(expectedFrequency, newSeries.RecurrenceRule!.Frequency);
        Assert.Equal(original.EventSourceId, newSeries.EventSourceId);
    }

    [Fact]
    public async Task SplitPreservesPastExceptionsAndDoesNotCopyFutureExceptions()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var original = await CreateSeriesAsync(client, "Exceptions", new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 6));
        await client.PutAsJsonAsync($"/api/events/{original.Id}/occurrences/modify", new ModifyOccurrenceRequest("2026-07-07T09:00:00", Title: "Past moved", StartUtc: new DateTimeOffset(2026, 7, 12, 9, 0, 0, TimeSpan.Zero)));
        await client.PostAsJsonAsync($"/api/events/{original.Id}/occurrences/skip", new OccurrenceTargetRequest("2026-07-10T09:00:00"));

        var response = await client.PutAsJsonAsync($"/api/events/{original.Id}/occurrences/split", new SplitEventSeriesRequest("2026-07-09T09:00:00", Title: "Clean future"));
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(created);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var oldSeries = await dbContext.EventSeries.Include(series => series.Exceptions).SingleAsync(series => series.Id == original.Id);
        var newSeries = await dbContext.EventSeries.Include(series => series.Exceptions).SingleAsync(series => series.Id == created.Id);
        var exception = Assert.Single(oldSeries.Exceptions);
        Assert.Equal("2026-07-07T09:00:00", exception.OccurrenceKey.Serialize());
        Assert.Empty(newSeries.Exceptions);
    }

    [Fact]
    public async Task DeleteThisAndFutureEndsRecurrenceWithoutNewSeriesOrSkippedExceptions()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var original = await CreateSeriesAsync(client, "Future delete", new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 5));

        var response = await client.DeleteAsync($"/api/events/{original.Id}/occurrences/future?occurrenceKey={WebUtility.UrlEncode("2026-07-08T09:00:00")}");
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.NotNull(events);
        Assert.Contains(events, occurrence => occurrence.Title == "Future delete" && occurrence.OccurrenceKey == "2026-07-07T09:00:00");
        Assert.DoesNotContain(events, occurrence => occurrence.Title == "Future delete" && string.CompareOrdinal(occurrence.OccurrenceKey, "2026-07-08T09:00:00") >= 0);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.Equal(1, await dbContext.EventSeries.CountAsync(series => series.Title == "Future delete"));
        Assert.False(await dbContext.EventExceptions.AnyAsync(exception => exception.EventSeriesId == original.Id));
    }

    [Fact]
    public async Task SplitRejectsInvalidTargetsAndDoesNotPartiallyCreateSeries()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var original = await CreateSeriesAsync(client, "Rollback", new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 3));

        var response = await client.PutAsJsonAsync($"/api/events/{original.Id}/occurrences/split", new SplitEventSeriesRequest("2026-07-08T09:00:00", RecurrenceRule: new RecurrenceRuleDto("Weekly", 1, "Never")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.Equal(1, await dbContext.EventSeries.CountAsync(series => series.Title == "Rollback"));
        var unchanged = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == original.Id);
        Assert.Equal(RecurrenceEndMode.AfterCount, unchanged.RecurrenceRule!.EndMode);
        Assert.Equal(3, unchanged.RecurrenceRule.Count);
    }

    public static IEnumerable<object[]> RecurrenceRules()
    {
        yield return [new RecurrenceRuleDto("Weekly", 1, "AfterCount", Count: 6, WeeklyDays: ["Monday", "Wednesday"]), "2026-07-08T09:00:00", RecurrenceFrequency.Weekly];
        yield return [new RecurrenceRuleDto("Monthly", 1, "AfterCount", Count: 4, MonthlyDayOfMonth: 6), "2026-09-06T09:00:00", RecurrenceFrequency.Monthly];
        yield return [new RecurrenceRuleDto("Yearly", 1, "AfterCount", Count: 4, YearlyMonth: 7, YearlyDayOfMonth: 6), "2028-07-06T09:00:00", RecurrenceFrequency.Yearly];
    }

    private static async Task<EventSeriesDto> CreateSeriesAsync(HttpClient client, string title, RecurrenceRuleDto recurrenceRule)
    {
        var start = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);
        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(title, "Template", null, start, start.AddHours(1), false, recurrenceRule));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);
        return created;
    }
}
