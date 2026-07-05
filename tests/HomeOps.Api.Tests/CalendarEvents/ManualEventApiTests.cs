using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class EventSeriesApiTests
{
    [Fact]
    public async Task GetEventSourcesReturnsWritableManualSource()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var sources = await client.GetFromJsonAsync<EventSourceDto[]>("/api/event-sources");

        Assert.NotNull(sources);
        var manualSource = Assert.Single(sources);
        Assert.Equal(SeedCalendarEvents.EventSourceId, manualSource.Id);
        Assert.True(manualSource.Writable);
        Assert.True(manualSource.IsSystem);
    }

    [Fact]
    public async Task GetEventsReturnsSeededNormalizedEventSeries()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.NotNull(events);
        Assert.Contains(events, candidate => candidate.Title == "Dentist Appointment" && candidate.Editable);
        Assert.Contains(events, candidate => candidate.Title == "Vacation" && candidate.AllDay);
    }

    [Fact]
    public async Task CreateUpdateAndDeleteEvent()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 6, 22, 12, 0, 0, TimeSpan.Zero);
        var create = new CreateEventSeriesRequest("Lunch", "Cafe", start, start.AddHours(1), false);

        var createResponse = await client.PostAsJsonAsync("/api/events", create);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);
        Assert.Equal("Lunch", created.Title);

        var update = new UpdateEventSeriesRequest("Updated Lunch", "Kitchen", start.AddHours(1), start.AddHours(2), false);
        var updateResponse = await client.PutAsJsonAsync($"/api/events/{created.Id}", update);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(updated);
        Assert.Equal("Updated Lunch", updated.Title);

        var deleteResponse = await client.DeleteAsync($"/api/events/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/events/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }


    [Fact]
    public async Task CreateEventUsesCurrentWritableManualSourceForHousehold()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var visualReviewSourceId = Guid.Parse("88000000-0000-0000-0000-000000000001");
        var now = DateTimeOffset.UtcNow;

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.EventSeries.RemoveRange(dbContext.EventSeries);
            dbContext.EventSources.RemoveRange(dbContext.EventSources.Where(source => source.HouseholdId == SeedHousehold.Id));
            dbContext.EventSources.Add(new HomeOps.Api.CalendarEvents.EventSource
            {
                Id = visualReviewSourceId,
                HouseholdId = SeedHousehold.Id,
                Name = "Van Zijl Family Calendar",
                SourceType = "manual",
                IsWritable = true,
                CreatedUtc = now,
                UpdatedUtc = now,
            });
            await dbContext.SaveChangesAsync();
        }

        var start = new DateTimeOffset(2026, 6, 16, 19, 0, 0, TimeSpan.Zero);
        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Filmavond", null, start, start.AddHours(2), false));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);
        Assert.Equal(visualReviewSourceId, created.EventSourceId);
        Assert.Equal("Filmavond", created.Title);
    }

    [Fact]
    public async Task CreateEventPreservesMultiDayAllDayExclusiveEndDate()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero);
        var exclusiveEnd = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero);

        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Vacation", "Family trip", start, exclusiveEnd, true));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);
        Assert.True(created.IsAllDay);
        Assert.Equal(new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.FromHours(2)), created.StartUtc);
        Assert.Equal(new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.FromHours(2)), created.EndUtc);
    }

    [Fact]
    public async Task CreateEventRejectsMissingTitle()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 6, 22, 12, 0, 0, TimeSpan.Zero);

        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(" ", null, start, start.AddHours(1), false));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Event title is required", body);
    }

    [Fact]
    public async Task CreateEventRejectsEndBeforeStart()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 6, 22, 12, 0, 0, TimeSpan.Zero);

        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("Invalid Range", null, start, start.AddMinutes(-1), false));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Event end must be on or after event start", body);
    }

    [Fact]
    public async Task UpdateEventAllowsEndEqualToStart()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 6, 22, 12, 0, 0, TimeSpan.Zero);
        var createResponse = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest("All Day", null, start, start.AddHours(1), true));
        var created = await createResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(created);

        var response = await client.PutAsJsonAsync($"/api/events/{created.Id}", new UpdateEventSeriesRequest("All Day", null, start, start, true));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task EventsAreScopedToSeededHousehold()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var otherHouseholdId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        var otherSourceId = Guid.Parse("abababab-abab-abab-abab-abababababab");
        var now = DateTimeOffset.UtcNow;
        dbContext.Households.Add(new Household { Id = otherHouseholdId, Name = "Other", CreatedUtc = now, UpdatedUtc = now });
        dbContext.EventSources.Add(new HomeOps.Api.CalendarEvents.EventSource
        {
            Id = otherSourceId,
            HouseholdId = otherHouseholdId,
            Name = "Other HomeOps Calendar",
            SourceType = "manual",
            IsWritable = true,
            CreatedUtc = now,
            UpdatedUtc = now,
            EventSeries =
            {
                new EventSeries
                {
                    Id = Guid.NewGuid(),
                    Title = "Other Household Event",
                    IsAllDay = false,
                    StartDate = DateOnly.FromDateTime(now.UtcDateTime),
                    StartTime = TimeOnly.FromDateTime(now.UtcDateTime),
                    EndDate = DateOnly.FromDateTime(now.AddHours(1).UtcDateTime),
                    EndTime = TimeOnly.FromDateTime(now.AddHours(1).UtcDateTime),
                    CreatedUtc = now,
                    UpdatedUtc = now,
                },
            },
        });
        await dbContext.SaveChangesAsync();

        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.NotNull(events);
        Assert.DoesNotContain(events, candidate => candidate.Title == "Other Household Event");
    }
    [Fact]
    public async Task GetEventsRespectsSourceLifecycleAndEditability()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var now = DateTimeOffset.UtcNow;

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.EventSeries.RemoveRange(dbContext.EventSeries);
            dbContext.EventSources.RemoveRange(dbContext.EventSources.Where(source => source.HouseholdId == SeedHousehold.Id));

            var manualSource = CreateSource("Manual visible", EventSourceTypes.Manual, enabled: true, writable: true, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy, now);
            var healthySource = CreateSource("Healthy imported", EventSourceTypes.ICalFeed, enabled: true, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy, now);
            var failedSource = CreateSource("Failed imported", EventSourceTypes.ICalFeed, enabled: true, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Failed, now);
            var disabledSource = CreateSource("Disabled imported", EventSourceTypes.ICalFeed, enabled: false, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy, now);
            var neverSyncedSource = CreateSource("Never synced imported", EventSourceTypes.ICalFeed, enabled: true, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.NeverSynced, now);

            dbContext.EventSources.AddRange(manualSource, healthySource, failedSource, disabledSource, neverSyncedSource);
            dbContext.EventSeries.AddRange(
                CreateSeries(manualSource.Id, "Manual visible", now),
                CreateSeries(healthySource.Id, "Healthy visible", now, "healthy-provider"),
                CreateSeries(failedSource.Id, "Failed hidden", now, "failed-provider"),
                CreateSeries(disabledSource.Id, "Disabled hidden", now, "disabled-provider"),
                CreateSeries(neverSyncedSource.Id, "Never synced hidden", now, "never-provider"));
            await dbContext.SaveChangesAsync();
        }

        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.NotNull(events);
        Assert.Contains(events, candidate => candidate.Title == "Manual visible" && candidate.Editable);
        Assert.Contains(events, candidate => candidate.Title == "Healthy visible" && !candidate.Editable && candidate.ProviderEventId == "healthy-provider");
        Assert.DoesNotContain(events, candidate => candidate.Title == "Failed hidden");
        Assert.DoesNotContain(events, candidate => candidate.Title == "Disabled hidden");
        Assert.DoesNotContain(events, candidate => candidate.Title == "Never synced hidden");

        using var verificationScope = factory.Services.CreateScope();
        var verificationContext = verificationScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.True(await verificationContext.EventSeries.AnyAsync(series => series.Title == "Failed hidden"));
        Assert.True(await verificationContext.EventSeries.AnyAsync(series => series.Title == "Disabled hidden"));
        Assert.True(await verificationContext.EventSeries.AnyAsync(series => series.Title == "Never synced hidden"));
    }

    [Fact]
    public async Task GetEventsReturnsMultipleHealthySourcesAndHidesMultipleHiddenSources()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var now = DateTimeOffset.UtcNow;

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.EventSeries.RemoveRange(dbContext.EventSeries);
            dbContext.EventSources.RemoveRange(dbContext.EventSources.Where(source => source.HouseholdId == SeedHousehold.Id));

            var healthyFeed = CreateSource("Healthy feed", EventSourceTypes.ICalFeed, enabled: true, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy, now);
            var healthyFile = CreateSource("Healthy file", EventSourceTypes.ICalFile, enabled: true, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy, now);
            var failedFeed = CreateSource("Failed feed", EventSourceTypes.ICalFeed, enabled: true, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Failed, now);
            var disabledFile = CreateSource("Disabled file", EventSourceTypes.ICalFile, enabled: false, writable: false, HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy, now);

            dbContext.EventSources.AddRange(healthyFeed, healthyFile, failedFeed, disabledFile);
            dbContext.EventSeries.AddRange(
                CreateSeries(healthyFeed.Id, "Healthy feed event", now, "healthy-feed"),
                CreateSeries(healthyFile.Id, "Healthy file event", now, "healthy-file"),
                CreateSeries(failedFeed.Id, "Failed feed event", now, "failed-feed"),
                CreateSeries(disabledFile.Id, "Disabled file event", now, "disabled-file"));
            await dbContext.SaveChangesAsync();
        }

        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");

        Assert.NotNull(events);
        Assert.Contains(events, candidate => candidate.Title == "Healthy feed event");
        Assert.Contains(events, candidate => candidate.Title == "Healthy file event");
        Assert.DoesNotContain(events, candidate => candidate.Title == "Failed feed event");
        Assert.DoesNotContain(events, candidate => candidate.Title == "Disabled file event");
    }

    private static HomeOps.Api.CalendarEvents.EventSource CreateSource(string name, string sourceType, bool enabled, bool writable, HomeOps.Api.CalendarEvents.EventSourceHealthStatus healthStatus, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        HouseholdId = SeedHousehold.Id,
        Name = name,
        SourceType = sourceType,
        Icon = "📅",
        IsEnabled = enabled,
        IsWritable = writable,
        HealthStatus = healthStatus,
        PollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval.Every8Hours,
        CreatedUtc = now,
        UpdatedUtc = now,
    };

    private static EventSeries CreateSeries(Guid sourceId, string title, DateTimeOffset now, string? providerEventId = null) => new()
    {
        Id = Guid.NewGuid(),
        EventSourceId = sourceId,
        Title = title,
        Description = title,
        IsAllDay = false,
        StartDate = new DateOnly(2026, 7, 6),
        StartTime = new TimeOnly(9, 0),
        EndDate = new DateOnly(2026, 7, 6),
        EndTime = new TimeOnly(10, 0),
        RecurrenceType = RecurrenceType.None,
        ProviderEventId = providerEventId,
        ProviderRevision = providerEventId is null ? null : $"revision-{providerEventId}",
        ContentFingerprint = providerEventId is null ? null : $"fingerprint-{providerEventId}",
        ImportedAtUtc = providerEventId is null ? null : now,
        LastImportedUtc = providerEventId is null ? null : now,
        LastSeenSyncAttemptUtc = providerEventId is null ? null : now,
        CreatedUtc = now,
        UpdatedUtc = now,
    };

}
