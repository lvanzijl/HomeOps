using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ContractHealthStatus = HomeOps.Contracts.Events.EventSourceHealthStatus;
using ContractPollInterval = HomeOps.Contracts.Events.EventSourcePollInterval;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarSourceManagementApiTests
{
    [Fact]
    public async Task ListSourcesReturnsManualSourceWithSourceManagementMetadata()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var sources = await client.GetFromJsonAsync<EventSourceDto[]>("/api/event-sources");

        Assert.NotNull(sources);
        var manualSource = Assert.Single(sources);
        Assert.Equal(SeedCalendarEvents.EventSourceId, manualSource.Id);
        Assert.Equal(EventSourceType.Manual, manualSource.SourceType);
        Assert.True(manualSource.Enabled);
        Assert.True(manualSource.Writable);
        Assert.True(manualSource.IsSystem);
        Assert.Equal(ContractHealthStatus.Healthy, manualSource.HealthStatus);
        Assert.Equal(ContractPollInterval.Every8Hours, manualSource.PollInterval);
        Assert.Null(manualSource.ProviderConfiguration);
    }

    [Fact]
    public async Task GetSourceReturnsProviderSafeConfiguration()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateICalFeedAsync(client);

        var response = await client.GetAsync($"/api/event-sources/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var source = await response.Content.ReadFromJsonAsync<EventSourceDto>();
        Assert.NotNull(source);
        Assert.Equal(created.Id, source.Id);
        Assert.Equal(EventSourceProviderConfigurationKind.ICalFeed, source.ProviderConfiguration?.Kind);
        Assert.Equal("https://example.test/school.ics", source.ProviderConfiguration?.ICalFeed?.FeedUrl);
    }

    [Fact]
    public async Task CreateICalFeedPersistsSourceAndConfigurationWithoutSyncMetadata()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var created = await CreateICalFeedAsync(client);

        Assert.Equal("School Feed", created.Name);
        Assert.Equal("🏫", created.Icon);
        Assert.Equal(EventSourceType.ICalFeed, created.SourceType);
        Assert.True(created.Enabled);
        Assert.False(created.Writable);
        Assert.False(created.IsSystem);
        Assert.Equal(ContractHealthStatus.NeverSynced, created.HealthStatus);
        Assert.Equal(ContractPollInterval.EveryHour, created.PollInterval);
        Assert.Null(created.LastSyncAttemptUtc);
        Assert.Null(created.LastSuccessfulSyncUtc);
        Assert.Null(created.LastFailedSyncUtc);
        Assert.Null(created.NextSyncAfterUtc);
        Assert.Equal("https://example.test/school.ics", created.ProviderConfiguration?.ICalFeed?.FeedUrl);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.True(await dbContext.ICalFeedSourceConfigurations.AnyAsync(config => config.EventSourceId == created.Id && config.FeedUrl == "https://example.test/school.ics"));
    }

    [Fact]
    public async Task CreateICalFilePersistsSourceAndConfiguration()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var request = new CreateEventSourceRequest(
            "Uploaded Calendar",
            "📄",
            EventSourceType.ICalFile,
            true,
            ContractPollInterval.EveryDay,
            new EventSourceProviderConfigurationRequest(
                EventSourceProviderConfigurationKind.ICalFile,
                ICalFile: new ICalFileSourceConfigurationRequest("calendar-files/upload.ics", "upload.ics", "sha256:file")));

        var response = await client.PostAsJsonAsync("/api/event-sources", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSourceDto>();
        Assert.NotNull(created);
        Assert.Equal(EventSourceType.ICalFile, created.SourceType);
        Assert.Equal(EventSourceProviderConfigurationKind.ICalFile, created.ProviderConfiguration?.Kind);
        Assert.Equal("calendar-files/upload.ics", created.ProviderConfiguration?.ICalFile?.FileReference);
        Assert.Equal("upload.ics", created.ProviderConfiguration?.ICalFile?.OriginalFilename);
        Assert.Equal("sha256:file", created.ProviderConfiguration?.ICalFile?.ContentHash);
    }

    [Theory]
    [InlineData(EventSourceType.Manual)]
    [InlineData(EventSourceType.Birthdays)]
    [InlineData(EventSourceType.GoogleCalendar)]
    [InlineData(EventSourceType.CalDav)]
    [InlineData(EventSourceType.Exchange)]
    [InlineData(EventSourceType.SchoolHolidays)]
    [InlineData(EventSourceType.TvSeries)]
    [InlineData(EventSourceType.Provider)]
    public async Task CreateRejectsUnsupportedUserCreatableSourceTypes(EventSourceType sourceType)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var request = new CreateEventSourceRequest(
            "Unsupported",
            "📅",
            sourceType,
            true,
            ContractPollInterval.Every8Hours,
            sourceType == EventSourceType.Manual ? null : new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("https://example.test/source.ics")));

        var response = await client.PostAsJsonAsync("/api/event-sources", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSourceUpdatesDisplayEnabledPollAndProviderConfiguration()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateICalFeedAsync(client);
        var update = new UpdateEventSourceRequest(
            "Updated Feed",
            "📚",
            false,
            ContractPollInterval.EveryDay,
            new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("https://example.test/updated.ics")));

        var response = await client.PutAsJsonAsync($"/api/event-sources/{created.Id}", update);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<EventSourceDto>();
        Assert.NotNull(updated);
        Assert.Equal("Updated Feed", updated.Name);
        Assert.Equal("📚", updated.Icon);
        Assert.False(updated.Enabled);
        Assert.Equal(ContractPollInterval.EveryDay, updated.PollInterval);
        Assert.Equal("https://example.test/updated.ics", updated.ProviderConfiguration?.ICalFeed?.FeedUrl);
        Assert.Equal(ContractHealthStatus.NeverSynced, updated.HealthStatus);
    }

    [Fact]
    public async Task DeleteICalSourceRemovesConfigurationAndOwnedEvents()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateICalFeedAsync(client);
        var eventSeriesId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.EventSeries.Add(new EventSeries
            {
                Id = eventSeriesId,
                EventSourceId = created.Id,
                Title = "Imported",
                IsAllDay = false,
                StartDate = new DateOnly(2026, 7, 5),
                StartTime = new TimeOnly(10, 0),
                EndDate = new DateOnly(2026, 7, 5),
                EndTime = new TimeOnly(11, 0),
                ProviderEventId = "provider-event-1",
                ImportedAtUtc = DateTimeOffset.UtcNow,
                LastImportedUtc = DateTimeOffset.UtcNow,
                CreatedUtc = DateTimeOffset.UtcNow,
                UpdatedUtc = DateTimeOffset.UtcNow,
            });
            await dbContext.SaveChangesAsync();
        }

        var response = await client.DeleteAsync($"/api/event-sources/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            Assert.False(await dbContext.EventSources.AnyAsync(source => source.Id == created.Id));
            Assert.False(await dbContext.ICalFeedSourceConfigurations.AnyAsync(configuration => configuration.EventSourceId == created.Id));
            Assert.False(await dbContext.EventSeries.AnyAsync(series => series.Id == eventSeriesId));
        }
    }

    [Fact]
    public async Task DeleteSystemManualSourceIsRejected()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.DeleteAsync($"/api/event-sources/{SeedCalendarEvents.EventSourceId}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSystemManualSourceIsRejected()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var update = new UpdateEventSourceRequest("Manual", "📅", true, ContractPollInterval.Every8Hours, null);

        var response = await client.PutAsJsonAsync($"/api/event-sources/{SeedCalendarEvents.EventSourceId}", update);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ValidationRejectsMalformedProviderConfigurations()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var missingFeedUrl = new CreateEventSourceRequest(
            "Bad Feed",
            "📅",
            EventSourceType.ICalFeed,
            true,
            ContractPollInterval.Every8Hours,
            new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("not-a-url")));
        var missingFileFields = new CreateEventSourceRequest(
            "Bad File",
            "📄",
            EventSourceType.ICalFile,
            true,
            ContractPollInterval.Every8Hours,
            new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFile, ICalFile: new ICalFileSourceConfigurationRequest("", "", "")));

        var feedResponse = await client.PostAsJsonAsync("/api/event-sources", missingFeedUrl);
        var fileResponse = await client.PostAsJsonAsync("/api/event-sources", missingFileFields);

        Assert.Equal(HttpStatusCode.BadRequest, feedResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, fileResponse.StatusCode);
    }


    [Fact]
    public void OpenApiIncludesSourceManagementCrudOperationsWithoutRefreshEndpoints()
    {
        var openApi = File.ReadAllText(FindRepositoryFile("src/HomeOps.Contracts/openapi.json"));

        Assert.Contains("\"operationId\": \"ListEventSources\"", openApi);
        Assert.Contains("\"operationId\": \"GetEventSource\"", openApi);
        Assert.Contains("\"operationId\": \"CreateEventSource\"", openApi);
        Assert.Contains("\"operationId\": \"UpdateEventSource\"", openApi);
        Assert.Contains("\"operationId\": \"DeleteEventSource\"", openApi);
        Assert.DoesNotContain("RefreshEventSource", openApi);
        Assert.DoesNotContain("RefreshAllEventSources", openApi);
    }

    private static async Task<EventSourceDto> CreateICalFeedAsync(HttpClient client)
    {
        var request = new CreateEventSourceRequest(
            "School Feed",
            "🏫",
            EventSourceType.ICalFeed,
            true,
            ContractPollInterval.EveryHour,
            new EventSourceProviderConfigurationRequest(
                EventSourceProviderConfigurationKind.ICalFeed,
                ICalFeed: new ICalFeedSourceConfigurationRequest("https://example.test/school.ics")));

        var response = await client.PostAsJsonAsync("/api/event-sources", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<EventSourceDto>();
        Assert.NotNull(created);
        return created;
    }
    private static string FindRepositoryFile(string relativePath)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, relativePath);
            if (File.Exists(candidate)) return candidate;
            directory = directory.Parent;
        }

        throw new FileNotFoundException($"Could not find repository file '{relativePath}'.");
    }
}
