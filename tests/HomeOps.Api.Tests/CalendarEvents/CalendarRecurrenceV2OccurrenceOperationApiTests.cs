using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarRecurrenceV2OccurrenceOperationApiTests
{
    [Fact]
    public async Task SkipOccurrenceSuppressesReadOccurrenceAndDoesNotDuplicateException()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateDailySeriesAsync(client, "Skip me");
        var key = "2026-07-07T09:00:00";

        var firstSkip = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/skip", new OccurrenceTargetRequest(key));
        var secondSkip = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/skip", new OccurrenceTargetRequest(key));
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.Equal(HttpStatusCode.NoContent, firstSkip.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, secondSkip.StatusCode);
        Assert.NotNull(events);
        Assert.DoesNotContain(events, occurrence => occurrence.Title == "Skip me" && occurrence.OccurrenceKey == key);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var series = await dbContext.EventSeries.Include(series => series.Exceptions).SingleAsync(series => series.Id == created.Id);
        Assert.Equal(RecurrenceType.None, series.RecurrenceType);
        Assert.Single(series.Exceptions);
        Assert.Equal(EventExceptionType.Skipped, series.Exceptions.Single().ExceptionType);
    }

    [Fact]
    public async Task RestoreOccurrenceRemovesSkippedOrModifiedException()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateDailySeriesAsync(client, "Restore me");
        var key = "2026-07-07T09:00:00";
        await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/skip", new OccurrenceTargetRequest(key));

        var restoreSkipped = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/restore", new OccurrenceTargetRequest(key));
        var restoreMissing = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/restore", new OccurrenceTargetRequest(key));
        await client.PutAsJsonAsync($"/api/events/{created.Id}/occurrences/modify", new ModifyOccurrenceRequest(key, Title: "Modified once"));
        var restoreModified = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/restore", new OccurrenceTargetRequest(key));

        Assert.Equal(HttpStatusCode.NoContent, restoreSkipped.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, restoreMissing.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, restoreModified.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var exceptionCount = await dbContext.EventExceptions.CountAsync(exception => exception.EventSeriesId == created.Id);
        Assert.Equal(0, exceptionCount);
    }

    [Fact]
    public async Task ModifyOccurrenceOverlaysReplacementFieldsAndPreservesOriginalIdentity()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateDailySeriesAsync(client, "Move me");
        var key = "2026-07-07T09:00:00";
        var request = new ModifyOccurrenceRequest(
            key,
            Title: "Moved title",
            Description: "Moved description",
            Location: "Library",
            IsAllDay: false,
            StartUtc: new DateTimeOffset(2026, 7, 10, 11, 0, 0, TimeSpan.Zero),
            EndUtc: new DateTimeOffset(2026, 7, 10, 12, 0, 0, TimeSpan.Zero));

        var response = await client.PutAsJsonAsync($"/api/events/{created.Id}/occurrences/modify", request);
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.NotNull(events);
        Assert.DoesNotContain(events, occurrence => occurrence.Title == "Move me" && occurrence.OccurrenceKey == key);
        var moved = Assert.Single(events, occurrence => occurrence.Title == "Moved title" && occurrence.OccurrenceKey == key);
        Assert.Equal("Moved description", moved.Description);
        Assert.Equal("Library", moved.Location);
        Assert.True(moved.IsException);
        Assert.True(moved.IsRecurring);
        Assert.NotNull(moved.Recurrence);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var series = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == created.Id);
        Assert.Equal("Move me", series.Title);
        Assert.Equal(RecurrenceFrequency.Daily, series.RecurrenceRule!.Frequency);
    }

    [Fact]
    public async Task DeleteOccurrenceCreatesSkippedExceptionWithoutDeletingSeriesOrOtherOccurrences()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateDailySeriesAsync(client, "Delete one");
        var key = "2026-07-07T09:00:00";

        var response = await client.DeleteAsync($"/api/events/{created.Id}/occurrences?occurrenceKey={WebUtility.UrlEncode(key)}");
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.NotNull(events);
        Assert.DoesNotContain(events, occurrence => occurrence.Title == "Delete one" && occurrence.OccurrenceKey == key);
        Assert.Contains(events, occurrence => occurrence.Title == "Delete one" && occurrence.OccurrenceKey == "2026-07-06T09:00:00");
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.True(await dbContext.EventSeries.AnyAsync(series => series.Id == created.Id));
        Assert.True(await dbContext.EventExceptions.AnyAsync(exception => exception.EventSeriesId == created.Id && exception.ExceptionType == EventExceptionType.Skipped));
    }

    [Theory]
    [InlineData("not-a-key", HttpStatusCode.BadRequest)]
    [InlineData("2026-08-01T09:00:00", HttpStatusCode.BadRequest)]
    public async Task OccurrenceOperationsRejectInvalidOrNonGeneratedKeys(string key, HttpStatusCode expectedStatus)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateDailySeriesAsync(client, "Validate key");

        var response = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/skip", new OccurrenceTargetRequest(key));

        Assert.Equal(expectedStatus, response.StatusCode);
    }

    [Fact]
    public async Task OccurrenceOperationsRejectNonRecurringAndReadOnlySeries()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);
        var nonRecurringResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("One off", null, null, start, start.AddHours(1), false));
        var nonRecurring = await nonRecurringResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(nonRecurring);
        var readOnlySeriesId = await AddReadOnlyRecurringSeriesAsync(factory);

        var nonRecurringSkip = await client.PostAsJsonAsync($"/api/events/{nonRecurring.Id}/occurrences/skip", new OccurrenceTargetRequest("2026-07-06T09:00:00"));
        var readOnlySkip = await client.PostAsJsonAsync($"/api/events/{readOnlySeriesId}/occurrences/skip", new OccurrenceTargetRequest("2026-07-06T09:00:00"));

        Assert.Equal(HttpStatusCode.BadRequest, nonRecurringSkip.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, readOnlySkip.StatusCode);
    }

    [Theory]
    [MemberData(nameof(InvalidModifyRequests))]
    public async Task ModifyOccurrenceRejectsInvalidReplacementPayloads(ModifyOccurrenceRequest request)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateDailySeriesAsync(client, "Invalid modify");

        var response = await client.PutAsJsonAsync($"/api/events/{created.Id}/occurrences/modify", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    public static IEnumerable<object[]> InvalidModifyRequests()
    {
        yield return [new ModifyOccurrenceRequest("2026-07-07T09:00:00", Title: "   ")];
        yield return [new ModifyOccurrenceRequest("2026-07-07T09:00:00", StartUtc: new DateTimeOffset(2026, 7, 7, 12, 0, 0, TimeSpan.Zero), EndUtc: new DateTimeOffset(2026, 7, 7, 11, 0, 0, TimeSpan.Zero))];
        yield return [new ModifyOccurrenceRequest("2026-07-07T09:00:00")];
    }

    private static async Task<EventSeriesDto> CreateDailySeriesAsync(HttpClient client, string title)
    {
        var start = new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero);
        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(title, "Template", null, start, start.AddHours(1), false, new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 5)));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);
        return created;
    }

    private static async Task<Guid> AddReadOnlyRecurringSeriesAsync(HomeOpsWebApplicationFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var now = DateTimeOffset.UtcNow;
        var source = new HomeOps.Api.CalendarEvents.EventSource
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            HouseholdId = SeedHousehold.Id,
            Name = "Read only",
            SourceType = EventSourceTypes.ICalFeed,
            IsEnabled = true,
            IsWritable = false,
            HealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy,
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        var series = new EventSeries
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            EventSourceId = source.Id,
            Title = "Read only recurring",
            StartDate = new DateOnly(2026, 7, 6),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 7, 6),
            EndTime = new TimeOnly(10, 0),
            RecurrenceRule = new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 5 },
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        dbContext.EventSources.Add(source);
        dbContext.EventSeries.Add(series);
        await dbContext.SaveChangesAsync();
        return series.Id;
    }
}
