using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.Data;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarSourceUploadLifecycleApiTests
{
    [Fact]
    public async Task Multipart_upload_imports_calendar_and_exposes_only_safe_file_metadata()
    {
        var store = new MemoryFileStore();
        await using var factory = new UploadFactory(store);
        var response = await Upload(factory.CreateClient(), "family.ics", Calendar("one", "Familiedag"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var source = (await response.Content.ReadFromJsonAsync<EventSourceDto>())!;
        Assert.Equal(EventSourceType.ICalFile, source.SourceType);
        Assert.Equal("family.ics", source.ProviderConfiguration?.ICalFile?.OriginalFilename);
        Assert.Equal(Encoding.UTF8.GetByteCount(Calendar("one", "Familiedag")), source.ProviderConfiguration?.ICalFile?.ContentLength);
        Assert.True(source.ProviderConfiguration?.ICalFile?.HasContent);
        Assert.DoesNotContain("fileReference", await response.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
        Assert.Single(store.Files);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.True(await db.EventSeries.AnyAsync(item => item.EventSourceId == source.Id && item.Title == "Familiedag"));
    }

    [Theory]
    [InlineData("calendar.txt", "not a calendar")]
    [InlineData("calendar.ics", "not a calendar")]
    public async Task Invalid_upload_does_not_create_source_or_managed_file(string filename, string content)
    {
        var store = new MemoryFileStore();
        await using var factory = new UploadFactory(store);
        var response = await Upload(factory.CreateClient(), filename, content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(store.Files);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.False(await db.EventSources.AnyAsync(item => item.SourceType == EventSourceTypes.ICalFile));
    }

    [Fact]
    public async Task Upload_over_five_mib_is_rejected_before_storage()
    {
        var store = new MemoryFileStore();
        await using var factory = new UploadFactory(store);
        var response = await Upload(factory.CreateClient(), "large.ics", new string('x', (5 * 1024 * 1024) + 1));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(store.Files);
    }

    [Fact]
    public async Task Duplicate_provider_uids_are_rejected_without_partial_import()
    {
        var store = new MemoryFileStore();
        await using var factory = new UploadFactory(store);
        var duplicate = Calendar("duplicate", "Eerste").Replace(
            "END:VCALENDAR",
            "BEGIN:VEVENT\nUID:duplicate\nDTSTAMP:20260807T100000Z\nDTSTART:20260809T100000\nDTEND:20260809T110000\nSUMMARY:Tweede\nEND:VEVENT\nEND:VCALENDAR",
            StringComparison.Ordinal);

        var response = await Upload(factory.CreateClient(), "duplicate.ics", duplicate);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(store.Files);
    }

    [Fact]
    public async Task Failed_and_successful_replacement_preserve_atomicity()
    {
        var store = new MemoryFileStore();
        await using var factory = new UploadFactory(store);
        var client = factory.CreateClient();
        var createdResponse = await Upload(client, "old.ics", Calendar("old", "Oud"));
        var source = (await createdResponse.Content.ReadFromJsonAsync<EventSourceDto>())!;
        var oldReference = Assert.Single(store.Files).Key;

        var malformed = await Replace(client, source.Id, "bad.ics", "broken");
        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
        Assert.True(store.Files.ContainsKey(oldReference));

        store.FailNextReplace = true;
        var failedStore = await Replace(client, source.Id, "new.ics", Calendar("new", "Nieuw"));
        Assert.Equal(HttpStatusCode.BadRequest, failedStore.StatusCode);
        Assert.True(store.Files.ContainsKey(oldReference));

        var replaced = await Replace(client, source.Id, "new.ics", Calendar("new", "Nieuw"));
        Assert.Equal(HttpStatusCode.OK, replaced.StatusCode);
        Assert.False(store.Files.ContainsKey(oldReference));
        Assert.Single(store.Files);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.True(await db.EventSeries.AnyAsync(item => item.EventSourceId == source.Id && item.Title == "Nieuw"));
        Assert.False(await db.EventSeries.AnyAsync(item => item.EventSourceId == source.Id && item.Title == "Oud"));
    }

    [Fact]
    public async Task Archive_restore_and_confirmed_removal_preserve_then_delete_managed_content()
    {
        var store = new MemoryFileStore();
        await using var factory = new UploadFactory(store);
        var client = factory.CreateClient();
        var upload = await Upload(client, "family.ics", Calendar("one", "Familiedag"));
        var source = (await upload.Content.ReadFromJsonAsync<EventSourceDto>())!;

        var unconfirmed = await client.DeleteAsync($"/api/event-sources/{source.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, unconfirmed.StatusCode);
        var archivedResponse = await client.PostAsJsonAsync($"/api/event-sources/{source.Id}/archive", new { confirmed = true });
        var archived = (await archivedResponse.Content.ReadFromJsonAsync<EventSourceDto>())!;
        Assert.True(archived.IsArchived);
        Assert.False(archived.Enabled);
        Assert.Single(store.Files);

        var restoredResponse = await client.PostAsync($"/api/event-sources/{source.Id}/restore", null);
        Assert.Equal(HttpStatusCode.OK, restoredResponse.StatusCode);
        var restored = (await restoredResponse.Content.ReadFromJsonAsync<CalendarSourceLifecycleResultDto>())!;
        Assert.False(restored.Source.IsArchived);
        Assert.True(restored.Source.Enabled);

        var removed = await client.DeleteAsync($"/api/event-sources/{source.Id}?confirmed=true");
        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        Assert.Empty(store.Files);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.False(await db.EventSources.AnyAsync(item => item.Id == source.Id));
        Assert.False(await db.EventSeries.AnyAsync(item => item.EventSourceId == source.Id));
    }

    [Fact]
    public async Task Feed_reconnect_preflights_new_https_content_before_changing_configuration()
    {
        var feedImporter = new ReconnectFeedImporter();
        await using var factory = new UploadFactory(new MemoryFileStore(), feedImporter);
        var client = factory.CreateClient();
        var createdResponse = await client.PostAsJsonAsync("/api/event-sources", new CreateEventSourceRequest(
            "Feed", "calendar", EventSourceType.ICalFeed, true, HomeOps.Contracts.Events.EventSourcePollInterval.Every8Hours,
            new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("https://example.test/old.ics"))));
        var source = (await createdResponse.Content.ReadFromJsonAsync<EventSourceDto>())!;

        var reconnect = await client.PutAsJsonAsync($"/api/event-sources/{source.Id}/reconnect-feed", new CalendarSourceFeedReconnectRequest(
            "Nieuwe feed", "school", true, HomeOps.Contracts.Events.EventSourcePollInterval.EveryDay, "https://example.test/new.ics"));
        Assert.Equal(HttpStatusCode.OK, reconnect.StatusCode);
        Assert.Equal("https://example.test/new.ics", feedImporter.LastUrl);

        feedImporter.Fail = true;
        var failed = await client.PutAsJsonAsync($"/api/event-sources/{source.Id}/reconnect-feed", new CalendarSourceFeedReconnectRequest(
            "Mislukt", "school", true, HomeOps.Contracts.Events.EventSourcePollInterval.EveryDay, "https://example.test/failing.ics"));
        Assert.Equal(HttpStatusCode.Conflict, failed.StatusCode);
        var retained = await client.GetFromJsonAsync<EventSourceDto>($"/api/event-sources/{source.Id}");
        Assert.Equal("Nieuwe feed", retained?.Name);
        Assert.Equal("https://example.test/new.ics", retained?.ProviderConfiguration?.ICalFeed?.FeedUrl);
    }

    private static async Task<HttpResponseMessage> Upload(HttpClient client, string filename, string content)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("Gezinsbestand"), "name");
        form.Add(new StringContent("calendar"), "icon");
        form.Add(new StringContent("true"), "enabled");
        form.Add(new StringContent("1"), "pollInterval");
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes(content)), "file", filename);
        return await client.PostAsync("/api/event-sources/ical-file", form);
    }

    private static async Task<HttpResponseMessage> Replace(HttpClient client, Guid sourceId, string filename, string content)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes(content)), "file", filename);
        return await client.PutAsync($"/api/event-sources/{sourceId}/file", form);
    }

    private static string Calendar(string id, string title) => $$"""
        BEGIN:VCALENDAR
        VERSION:2.0
        PRODID:-//HomeOps Tests//EN
        BEGIN:VEVENT
        UID:{{id}}
        DTSTAMP:20260807T100000Z
        DTSTART:20260808T100000
        DTEND:20260808T110000
        SUMMARY:{{title}}
        END:VEVENT
        END:VCALENDAR
        """;

    private sealed class UploadFactory(MemoryFileStore store, ReconnectFeedImporter? feedImporter = null) : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            connection.Open();
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<HomeOpsDbContext>>();
                services.AddDbContext<HomeOpsDbContext>(options => options.UseSqlite(connection));
                services.RemoveAll<ICalFileContentStore>();
                services.AddSingleton<ICalFileContentStore>(store);
                if (feedImporter is not null)
                {
                    services.RemoveAll<IICalFeedImporter>();
                    services.AddSingleton<IICalFeedImporter>(feedImporter);
                }
                using var provider = services.BuildServiceProvider();
                using var scope = provider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
                db.Database.EnsureDeleted();
                db.Database.EnsureCreated();
                HomeOps.Api.VisualReviewFixtures.LegacySeedTestFixture.ApplyAsync(db).GetAwaiter().GetResult();
            });
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) connection.Dispose();
        }
    }

    private sealed class ReconnectFeedImporter : IICalFeedImporter
    {
        public bool Fail { get; set; }
        public string? LastUrl { get; private set; }

        public Task<ICalFeedImportResult> ImportAsync(HomeOps.Api.CalendarEvents.EventSource source, CancellationToken cancellationToken = default) =>
            ImportUrlForZoneAsync(source, "https://example.test/current.ics", "Europe/Amsterdam", cancellationToken);

        public Task<ICalFeedImportResult> ImportUrlForZoneAsync(HomeOps.Api.CalendarEvents.EventSource source, string feedUrl, string householdTimeZoneId, CancellationToken cancellationToken = default)
        {
            LastUrl = feedUrl;
            var uri = new Uri(feedUrl);
            if (Fail)
            {
                return Task.FromResult(ICalFeedImportResult.Failed(
                    new ICalFeedImportFailure(ICalFeedImportFailureCategory.NetworkFailure, "offline"),
                    [new ICalendarParseDiagnostic(ICalendarParseDiagnosticSeverity.Error, "NetworkFailure", "offline")]));
            }
            var calendarEvent = new NormalizedICalendarEvent(
                "feed-one", "revision", "fingerprint", "Feed afspraak", null, null,
                new DateOnly(2026, 8, 8), new TimeOnly(9, 0), new DateOnly(2026, 8, 8), new TimeOnly(10, 0),
                false, null, null, 0, null, null, RecurrenceType.None, null);
            return Task.FromResult(ICalFeedImportResult.Success(
                [calendarEvent], [],
                new ICalFeedProviderMetadata(source.Id, source.SourceType, source.ProviderSourceId, uri),
                new ICalFeedRetrievalMetadata(HttpStatusCode.OK, uri, uri, null, null, "text/calendar", 100, false)));
        }
    }

    private sealed class MemoryFileStore : ICalFileContentStore
    {
        public Dictionary<string, byte[]> Files { get; } = [];
        public bool FailNextReplace { get; set; }

        public Task<ICalFileContentLoadResult> LoadAsync(string fileReference, CancellationToken cancellationToken = default) =>
            Task.FromResult(Files.TryGetValue(fileReference, out var bytes)
                ? ICalFileContentLoadResult.Success(Encoding.UTF8.GetString(bytes), bytes.Length, DateTimeOffset.UtcNow)
                : ICalFileContentLoadResult.Failed(ICalFileContentLoadFailureCategory.MissingFile, "missing"));

        public async Task<ICalFileContentSaveResult> SaveAsync(Stream content, CancellationToken cancellationToken = default)
        {
            using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer, cancellationToken);
            var bytes = buffer.ToArray();
            var reference = $"{Guid.NewGuid():N}.ics";
            Files[reference] = bytes;
            return ICalFileContentSaveResult.Success(reference, Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant(), bytes.Length, DateTimeOffset.UtcNow);
        }

        public Task<ICalFileContentSaveResult> ReplaceAsync(string existingFileReference, Stream content, CancellationToken cancellationToken = default)
        {
            if (FailNextReplace)
            {
                FailNextReplace = false;
                return Task.FromResult(ICalFileContentSaveResult.Failed("replacement failed"));
            }
            return SaveAsync(content, cancellationToken);
        }

        public Task<ICalFileContentDeleteResult> DeleteAsync(string fileReference, CancellationToken cancellationToken = default) =>
            Task.FromResult(ICalFileContentDeleteResult.Success(!Files.Remove(fileReference)));
    }
}
