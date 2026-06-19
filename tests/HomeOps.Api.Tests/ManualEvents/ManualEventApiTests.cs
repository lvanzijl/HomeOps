using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.ManualEvents;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.ManualEvents;

public sealed class ManualEventApiTests
{
    [Fact]
    public async Task GetEventSourcesReturnsWritableManualSource()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var sources = await client.GetFromJsonAsync<HomeOps.Contracts.Events.EventSource[]>("/api/event-sources");

        Assert.NotNull(sources);
        var manualSource = Assert.Single(sources);
        Assert.Equal(SeedManualEvents.ManualEventSourceId.ToString(), manualSource.Id);
        Assert.Equal(EventSourceCapability.Writable, manualSource.Capability);
    }

    [Fact]
    public async Task GetEventsReturnsSeededNormalizedManualEvents()
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
        var create = new CreateManualEventRequest("Lunch", "Cafe", start, start.AddHours(1), false);

        var createResponse = await client.PostAsJsonAsync("/api/events", create);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ManualEventDto>();
        Assert.NotNull(created);
        Assert.Equal("Lunch", created.Title);

        var update = new UpdateManualEventRequest("Updated Lunch", "Kitchen", start.AddHours(1), start.AddHours(2), false);
        var updateResponse = await client.PutAsJsonAsync($"/api/events/{created.Id}", update);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<ManualEventDto>();
        Assert.NotNull(updated);
        Assert.Equal("Updated Lunch", updated.Title);

        var deleteResponse = await client.DeleteAsync($"/api/events/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/events/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task CreateEventRejectsMissingTitle()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var start = new DateTimeOffset(2026, 6, 22, 12, 0, 0, TimeSpan.Zero);

        var response = await client.PostAsJsonAsync("/api/events", new CreateManualEventRequest(" ", null, start, start.AddHours(1), false));

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

        var response = await client.PostAsJsonAsync("/api/events", new CreateManualEventRequest("Invalid Range", null, start, start.AddMinutes(-1), false));

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
        var createResponse = await client.PostAsJsonAsync("/api/events", new CreateManualEventRequest("All Day", null, start, start.AddHours(1), true));
        var created = await createResponse.Content.ReadFromJsonAsync<ManualEventDto>();
        Assert.NotNull(created);

        var response = await client.PutAsJsonAsync($"/api/events/{created.Id}", new UpdateManualEventRequest("All Day", null, start, start, true));

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
        dbContext.EventSources.Add(new HomeOps.Api.ManualEvents.EventSource
        {
            Id = otherSourceId,
            HouseholdId = otherHouseholdId,
            Name = "Other Manual Events",
            SourceType = "manual",
            IsWritable = true,
            CreatedUtc = now,
            UpdatedUtc = now,
            Events =
            {
                new ManualEvent
                {
                    Id = Guid.NewGuid(),
                    Title = "Other Household Event",
                    StartUtc = now,
                    EndUtc = now.AddHours(1),
                    IsAllDay = false,
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
}
