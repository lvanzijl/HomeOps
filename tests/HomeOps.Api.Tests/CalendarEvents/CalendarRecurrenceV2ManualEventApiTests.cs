using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarRecurrenceV2ManualEventApiTests
{
    [Fact]
    public async Task CreateEventSupportsNonRecurringAndRecurringRules()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);

        var nonRecurringResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Dentist", null, start, start.AddHours(1), false));
        var dailyResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Daily", null, start, start.AddHours(1), false, new RecurrenceRuleDto("Daily", 2, "AfterCount", Count: 3)));
        var weeklyResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Weekly", null, start, start.AddHours(1), false, new RecurrenceRuleDto("Weekly", 1, "Never", WeeklyDays: ["Monday", "Wednesday"])));
        var monthlyResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Monthly", null, start, start.AddHours(1), false, new RecurrenceRuleDto("Monthly", 1, "OnDate", UntilDate: new DateOnly(2026, 12, 31), MonthlyDayOfMonth: 6)));
        var yearlyResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Yearly", null, start, start.AddHours(1), false, new RecurrenceRuleDto("Yearly", 1, "Never", YearlyMonth: 7, YearlyDayOfMonth: 6)));

        Assert.Equal(HttpStatusCode.Created, nonRecurringResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, dailyResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, weeklyResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, monthlyResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, yearlyResponse.StatusCode);
        var nonRecurring = await nonRecurringResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        var weekly = await weeklyResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(nonRecurring);
        Assert.NotNull(weekly);
        Assert.Null(nonRecurring.RecurrenceRule);
        Assert.Equal("Weekly", weekly.RecurrenceRule!.Frequency);
        Assert.Equal(["Monday", "Wednesday"], weekly.RecurrenceRule.WeeklyDays);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var recurring = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Title == "Weekly");
        Assert.Equal(RecurrenceType.None, recurring.RecurrenceType);
        Assert.NotNull(recurring.RecurrenceRule);
    }

    [Fact]
    public async Task UpdateEventReplacesWholeSeriesRecurrenceRule()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);
        var createResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Practice", null, start, start.AddHours(1), false, new RecurrenceRuleDto("Weekly", 1, "Never", WeeklyDays: ["Monday"])));
        var created = await createResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);

        var update = new UpdateEventSeriesRequest("Practice updated", "Bring notebook", start.AddHours(1), start.AddHours(2), false, new RecurrenceRuleDto("Monthly", 2, "OnDate", UntilDate: new DateOnly(2026, 12, 31), MonthlyDayOfMonth: 6));
        var updateResponse = await client.PutAsJsonAsync($"/api/events/{created.Id}", update);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(updated);
        Assert.Equal("Monthly", updated.RecurrenceRule!.Frequency);
        Assert.Equal(2, updated.RecurrenceRule.Interval);
        Assert.Equal("OnDate", updated.RecurrenceRule.EndMode);
        Assert.Equal(6, updated.RecurrenceRule.MonthlyDayOfMonth);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var stored = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == created.Id);
        Assert.Equal(RecurrenceType.None, stored.RecurrenceType);
        Assert.Equal(RecurrenceFrequency.Monthly, stored.RecurrenceRule!.Frequency);
    }

    [Theory]
    [MemberData(nameof(InvalidRecurrenceRequests))]
    public async Task CreateEventRejectsInvalidRecurrenceRules(RecurrenceRuleDto recurrenceRule)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);

        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Invalid", null, start, start.AddHours(1), false, recurrenceRule));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ReadApisReturnRecurrenceAndPreserveLegacyCompatibility()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);
        var createResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Board game", null, start, start.AddHours(1), false, new RecurrenceRuleDto("Weekly", 1, "Never", WeeklyDays: ["Monday"] )));
        var created = await createResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.EventSeries.Add(new EventSeries
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                EventSourceId = SeedCalendarEvents.EventSourceId,
                Title = "Legacy weekly",
                StartDate = new DateOnly(2026, 7, 6),
                StartTime = new TimeOnly(9, 0),
                EndDate = new DateOnly(2026, 7, 6),
                EndTime = new TimeOnly(10, 0),
                RecurrenceType = RecurrenceType.Weekly,
                CreatedUtc = DateTimeOffset.UtcNow,
                UpdatedUtc = DateTimeOffset.UtcNow,
            });
            await dbContext.SaveChangesAsync();
        }

        var recurring = await client.GetFromJsonAsync<EventSeriesDto>($"/api/events/{created.Id}");
        var legacy = await client.GetFromJsonAsync<EventSeriesDto>("/api/events/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.NotNull(recurring);
        Assert.Equal("Weekly", recurring.RecurrenceRule!.Frequency);
        Assert.NotNull(legacy);
        Assert.Equal("Weekly", legacy.RecurrenceRule!.Frequency);
        Assert.NotNull(events);
        Assert.Contains(events, candidate => candidate.Title == "Board game" && candidate.IsRecurring && candidate.OccurrenceKey is not null);
    }

    public static IEnumerable<object[]> InvalidRecurrenceRequests()
    {
        yield return [new RecurrenceRuleDto("Daily", 0, "Never")];
        yield return [new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 0)];
        yield return [new RecurrenceRuleDto("Daily", 1, "OnDate", UntilDate: new DateOnly(2026, 7, 5))];
        yield return [new RecurrenceRuleDto("Weekly", 1, "Never", WeeklyDays: ["Funday"] )];
        yield return [new RecurrenceRuleDto("Monthly", 1, "Never", MonthlyDayOfMonth: 32)];
        yield return [new RecurrenceRuleDto("Yearly", 1, "Never", YearlyMonth: 2, YearlyDayOfMonth: 30)];
        yield return [new RecurrenceRuleDto("Daily", 1, "AfterCount", UntilDate: new DateOnly(2026, 7, 31), Count: 2)];
    }
}
