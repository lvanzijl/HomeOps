using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;
using HomeOps.Api.KnownPeople;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ApiDecorativeAvatarReferenceDto = HomeOps.Api.Lists.DecorativeAvatarReferenceDto;
using ApiDecorativeAvatarReferenceType = HomeOps.Api.Lists.DecorativeAvatarReferenceType;
using ContractDecorativeAvatarReferenceType = HomeOps.Contracts.Events.DecorativeAvatarReferenceType;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class AgendaDecorativeAvatarApiTests
{
    [Fact]
    public async Task CreateAcceptsNullAndPopulatedDecorativeAvatarPairs()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var knownPerson = await AddKnownPerson(factory, "Agenda friend");

        var nullPairResponse = await client.PostAsJsonAsync("/api/events", CreateRequest("Null pair", new ApiDecorativeAvatarReferenceDto(null, null)));
        var familyResponse = await client.PostAsJsonAsync("/api/events", CreateRequest("Family pair", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.FamilyMember, "riley")));
        var knownResponse = await client.PostAsJsonAsync("/api/events", CreateRequest("Known pair", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.KnownPerson, knownPerson.ToString())));

        Assert.Equal(HttpStatusCode.Created, nullPairResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, familyResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, knownResponse.StatusCode);
        Assert.Null((await nullPairResponse.Content.ReadFromJsonAsync<EventSeriesDto>())!.DecorativeAvatar);
        Assert.Equal("riley", (await familyResponse.Content.ReadFromJsonAsync<EventSeriesDto>())!.DecorativeAvatar!.ReferenceId);
        Assert.Equal(knownPerson.ToString(), (await knownResponse.Content.ReadFromJsonAsync<EventSeriesDto>())!.DecorativeAvatar!.ReferenceId);
    }

    [Theory]
    [MemberData(nameof(InvalidDecorativeAvatarRequests))]
    public async Task CreateRejectsInvalidDecorativeAvatarReferences(object decorativeAvatar)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        await SeedInvalidReferenceData(factory);
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/events", new
        {
            title = $"Invalid avatar {Guid.NewGuid()}",
            startUtc = new DateTimeOffset(2026, 8, 1, 9, 0, 0, TimeSpan.Zero),
            endUtc = new DateTimeOffset(2026, 8, 1, 10, 0, 0, TimeSpan.Zero),
            isAllDay = false,
            decorativeAvatar,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateClearingDecorativeAvatarClearsBothPersistedFields()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateEvent(client, "Clear me", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.FamilyMember, "riley"));

        var updateResponse = await client.PutAsJsonAsync($"/api/events/{created.Id}", UpdateRequest("Clear me", null));

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<EventSeriesDto>();
        Assert.NotNull(updated);
        Assert.Null(updated.DecorativeAvatar);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var persisted = await dbContext.EventSeries.AsNoTracking().SingleAsync(series => series.Id == created.Id);
        Assert.Null(persisted.DecorativeAvatarReferenceType);
        Assert.Null(persisted.DecorativeAvatarReferenceId);
    }

    [Fact]
    public async Task DeletingKnownPersonClearsOnlyEventSeriesDecorativeReferenceAndPreservesAgendaSemantics()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var knownPersonId = await AddKnownPerson(factory, "Provider friend");
        var seriesId = await AddDecoratedImportedRecurringSeriesWithException(factory, new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.KnownPerson, knownPersonId.ToString()));
        var client = factory.CreateClient();

        var response = await client.DeleteAsync($"/api/known-people/{knownPersonId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var series = await dbContext.EventSeries.Include(candidate => candidate.Exceptions).AsNoTracking().SingleAsync(candidate => candidate.Id == seriesId);
        Assert.Null(series.DecorativeAvatarReferenceType);
        Assert.Null(series.DecorativeAvatarReferenceId);
        Assert.Equal("Imported decorated", series.Title);
        Assert.Equal("Imported description", series.Description);
        Assert.Equal("Imported location", series.Location);
        Assert.Equal(new DateOnly(2026, 9, 1), series.StartDate);
        Assert.Equal(new TimeOnly(9, 0), series.StartTime);
        Assert.Equal(RecurrenceFrequency.Weekly, series.RecurrenceRule!.Frequency);
        Assert.Equal("provider-event", series.ProviderEventId);
        Assert.Equal("provider-instance", series.ProviderInstanceId);
        Assert.Equal("provider-revision", series.ProviderRevision);
        Assert.Equal("provider-fingerprint", series.ContentFingerprint);
        Assert.NotNull(series.ImportedAtUtc);
        Assert.NotNull(series.LastImportedUtc);
        Assert.NotNull(series.LastSeenSyncAttemptUtc);
        var exception = Assert.Single(series.Exceptions);
        Assert.Equal(EventExceptionType.Modified, exception.ExceptionType);
        Assert.Equal("Moved imported", exception.Title);
    }

    [Fact]
    public async Task DeletingFamilyMemberClearsOnlyEventSeriesDecorativeReference()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var seriesId = await AddDecoratedImportedRecurringSeriesWithException(factory, new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.FamilyMember, "riley"));
        var client = factory.CreateClient();

        var response = await client.DeleteAsync("/api/family-members/riley");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var series = await dbContext.EventSeries.Include(candidate => candidate.Exceptions).AsNoTracking().SingleAsync(candidate => candidate.Id == seriesId);
        Assert.Null(series.DecorativeAvatarReferenceType);
        Assert.Null(series.DecorativeAvatarReferenceId);
        Assert.Equal("Imported decorated", series.Title);
        Assert.Equal("provider-event", series.ProviderEventId);
        Assert.Equal(RecurrenceFrequency.Weekly, series.RecurrenceRule!.Frequency);
        Assert.Single(series.Exceptions);
    }

    [Fact]
    public async Task RecurringSeriesUpdatesAndClearsDecorativeAvatarForGeneratedOccurrences()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var knownPerson = await AddKnownPerson(factory, "Recurring friend");
        var created = await CreateRecurringEvent(client, "Recurring decoration", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.FamilyMember, "riley"));

        var initial = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.Contains(initial!, occurrence => occurrence.EventSeriesId == created.Id.ToString() && occurrence.DecorativeAvatar?.ReferenceId == "riley");

        var updateResponse = await client.PutAsJsonAsync($"/api/events/{created.Id}", UpdateRecurringRequest("Recurring decoration", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.KnownPerson, knownPerson.ToString())));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var afterUpdate = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.Contains(afterUpdate!, occurrence => occurrence.EventSeriesId == created.Id.ToString() && occurrence.DecorativeAvatar?.ReferenceType == ContractDecorativeAvatarReferenceType.KnownPerson && occurrence.DecorativeAvatar.ReferenceId == knownPerson.ToString());

        var clearResponse = await client.PutAsJsonAsync($"/api/events/{created.Id}", UpdateRecurringRequest("Recurring decoration", null));
        Assert.Equal(HttpStatusCode.OK, clearResponse.StatusCode);
        var afterClear = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.All(afterClear!.Where(occurrence => occurrence.EventSeriesId == created.Id.ToString()), occurrence => Assert.Null(occurrence.DecorativeAvatar));
    }

    [Fact]
    public async Task SplitSeriesCopiesDecorativeAvatarAndDoesNotIntroduceExceptionDecoration()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateRecurringEvent(client, "Split decoration", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.FamilyMember, "riley"));

        var response = await client.PutAsJsonAsync($"/api/events/{created.Id}/occurrences/split", new SplitEventSeriesRequest("2026-07-08T09:00:00", Title: "Split future"));
        var split = await response.Content.ReadFromJsonAsync<EventSeriesDto>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(split);
        Assert.Equal(ApiDecorativeAvatarReferenceType.FamilyMember, split.DecorativeAvatar?.ReferenceType);
        Assert.Equal("riley", split.DecorativeAvatar?.ReferenceId);
        var events = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.Contains(events!, occurrence => occurrence.EventSeriesId == split.Id.ToString() && occurrence.DecorativeAvatar?.ReferenceId == "riley");
        Assert.DoesNotContain(typeof(EventException).GetProperties(), property => property.Name.Contains("DecorativeAvatar", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task SkippedModifiedAndRestoredOccurrenceBehaviourPreservesSeriesDecorativeSemantics()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var created = await CreateRecurringEvent(client, "Occurrence decoration", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.FamilyMember, "riley"));
        var key = "2026-07-07T09:00:00";

        var skip = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/skip", new OccurrenceTargetRequest(key));
        Assert.Equal(HttpStatusCode.NoContent, skip.StatusCode);
        var afterSkip = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.DoesNotContain(afterSkip!, occurrence => occurrence.EventSeriesId == created.Id.ToString() && occurrence.OccurrenceKey == key);

        var restoreSkipped = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/restore", new OccurrenceTargetRequest(key));
        Assert.Equal(HttpStatusCode.NoContent, restoreSkipped.StatusCode);
        var afterRestoreSkipped = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.Contains(afterRestoreSkipped!, occurrence => occurrence.EventSeriesId == created.Id.ToString() && occurrence.OccurrenceKey == key && occurrence.DecorativeAvatar?.ReferenceId == "riley");

        var modify = await client.PutAsJsonAsync($"/api/events/{created.Id}/occurrences/modify", new ModifyOccurrenceRequest(key, Title: "Moved occurrence", Location: "Library"));
        Assert.Equal(HttpStatusCode.NoContent, modify.StatusCode);
        var afterModify = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.Contains(afterModify!, occurrence => occurrence.Title == "Moved occurrence" && occurrence.IsException && occurrence.DecorativeAvatar?.ReferenceId == "riley");

        var restoreModified = await client.PostAsJsonAsync($"/api/events/{created.Id}/occurrences/restore", new OccurrenceTargetRequest(key));
        Assert.Equal(HttpStatusCode.NoContent, restoreModified.StatusCode);
        var afterRestoreModified = await client.GetFromJsonAsync<NormalizedEvent[]>("/api/events");
        Assert.Contains(afterRestoreModified!, occurrence => occurrence.EventSeriesId == created.Id.ToString() && occurrence.OccurrenceKey == key && occurrence.Title == "Occurrence decoration" && occurrence.DecorativeAvatar?.ReferenceId == "riley");
    }

    [Fact]
    public async Task ImportedEventsAreNotDecoratableThroughAgendaApiAndProviderMetadataRemainsUnchanged()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var importedSeriesId = await AddImportedSeries(factory);
        var client = factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/events/{importedSeriesId}", UpdateRequest("Try decorate imported", new ApiDecorativeAvatarReferenceDto(ApiDecorativeAvatarReferenceType.FamilyMember, "riley")));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var series = await dbContext.EventSeries.AsNoTracking().SingleAsync(candidate => candidate.Id == importedSeriesId);
        Assert.Null(series.DecorativeAvatarReferenceType);
        Assert.Null(series.DecorativeAvatarReferenceId);
        Assert.Equal("Imported readonly", series.Title);
        Assert.Equal("provider-event", series.ProviderEventId);
        Assert.Equal("provider-instance", series.ProviderInstanceId);
        Assert.Equal("provider-revision", series.ProviderRevision);
        Assert.Equal("provider-fingerprint", series.ContentFingerprint);
        Assert.NotNull(series.LastImportedUtc);
        Assert.NotNull(series.LastSeenSyncAttemptUtc);
    }

    public static IEnumerable<object[]> InvalidDecorativeAvatarRequests()
    {
        yield return [new { referenceType = "FamilyMember" }];
        yield return [new { referenceId = "riley" }];
        yield return [new { referenceType = 999, referenceId = "riley" }];
        yield return [new { referenceType = "FamilyMember", referenceId = "missing-member" }];
        yield return [new { referenceType = "KnownPerson", referenceId = Guid.NewGuid().ToString() }];
        yield return [new { referenceType = "FamilyMember", referenceId = "deleted-member" }];
        yield return [new { referenceType = "KnownPerson", referenceId = SeedIds.DeletedKnownPerson.ToString() }];
        yield return [new { referenceType = "FamilyMember", referenceId = "other-member" }];
        yield return [new { referenceType = "KnownPerson", referenceId = SeedIds.OtherKnownPerson.ToString() }];
        yield return [new { referenceType = "KnownPerson", referenceId = "riley" }];
        yield return [new { referenceType = "FamilyMember", referenceId = SeedIds.ActiveKnownPerson.ToString() }];
    }

    private static CreateEventSeriesRequest CreateRequest(string title, ApiDecorativeAvatarReferenceDto? decorativeAvatar) => new(
        title,
        null,
        null,
        new DateTimeOffset(2026, 8, 1, 9, 0, 0, TimeSpan.Zero),
        new DateTimeOffset(2026, 8, 1, 10, 0, 0, TimeSpan.Zero),
        false,
        DecorativeAvatar: decorativeAvatar);

    private static UpdateEventSeriesRequest UpdateRequest(string title, ApiDecorativeAvatarReferenceDto? decorativeAvatar) => new(
        title,
        null,
        null,
        new DateTimeOffset(2026, 8, 1, 9, 0, 0, TimeSpan.Zero),
        new DateTimeOffset(2026, 8, 1, 10, 0, 0, TimeSpan.Zero),
        false,
        DecorativeAvatar: decorativeAvatar);

    private static UpdateEventSeriesRequest UpdateRecurringRequest(string title, ApiDecorativeAvatarReferenceDto? decorativeAvatar) => new(
        title,
        null,
        null,
        new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero),
        new DateTimeOffset(2026, 7, 6, 10, 0, 0, TimeSpan.Zero),
        false,
        new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 5),
        decorativeAvatar);

    private static async Task<EventSeriesDto> CreateEvent(HttpClient client, string title, ApiDecorativeAvatarReferenceDto? decorativeAvatar)
    {
        var response = await client.PostAsJsonAsync("/api/events", CreateRequest(title, decorativeAvatar));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<EventSeriesDto>())!;
    }

    private static async Task<EventSeriesDto> CreateRecurringEvent(HttpClient client, string title, ApiDecorativeAvatarReferenceDto? decorativeAvatar)
    {
        var response = await client.PostAsJsonAsync("/api/events", new CreateEventSeriesRequest(
            title,
            null,
            null,
            new DateTimeOffset(2026, 7, 6, 9, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 7, 6, 10, 0, 0, TimeSpan.Zero),
            false,
            new RecurrenceRuleDto("Daily", 1, "AfterCount", Count: 5),
            decorativeAvatar));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<EventSeriesDto>())!;
    }

    private static async Task SeedInvalidReferenceData(HomeOpsWebApplicationFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var now = DateTimeOffset.UtcNow;
        var otherHouseholdId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        if (!await dbContext.Households.AnyAsync(household => household.Id == otherHouseholdId))
        {
            dbContext.Households.Add(new Household { Id = otherHouseholdId, Name = "Other", CreatedUtc = now, UpdatedUtc = now });
        }

        dbContext.FamilyMembers.AddRange(
            new FamilyMember { Id = "deleted-member", HouseholdId = SeedHousehold.Id, Name = "Deleted", DisplayColor = "#fff", Initials = "D", MemberKind = FamilyMemberKind.Adult, IsDeleted = true, DeletedUtc = now, CreatedUtc = now, UpdatedUtc = now },
            new FamilyMember { Id = "other-member", HouseholdId = otherHouseholdId, Name = "Other", DisplayColor = "#fff", Initials = "O", MemberKind = FamilyMemberKind.Adult, CreatedUtc = now, UpdatedUtc = now });
        dbContext.KnownPeople.AddRange(
            NewKnownPerson(SeedIds.ActiveKnownPerson, SeedHousehold.Id, "Active known", now),
            NewKnownPerson(SeedIds.DeletedKnownPerson, SeedHousehold.Id, "Deleted known", now, isDeleted: true),
            NewKnownPerson(SeedIds.OtherKnownPerson, otherHouseholdId, "Other known", now));
        await dbContext.SaveChangesAsync();
    }

    private static async Task<Guid> AddKnownPerson(HomeOpsWebApplicationFactory factory, string displayName)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var id = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        dbContext.KnownPeople.Add(NewKnownPerson(id, SeedHousehold.Id, displayName, now));
        await dbContext.SaveChangesAsync();
        return id;
    }

    private static KnownPerson NewKnownPerson(Guid id, Guid householdId, string displayName, DateTimeOffset now, bool isDeleted = false) => new()
    {
        Id = id,
        HouseholdId = householdId,
        DisplayName = displayName,
        RelationshipType = KnownPersonRelationshipType.Friend,
        Scope = KnownPersonScope.Shared,
        Initials = "KP",
        AvatarSelection = new AvatarSelection(),
        IsDeleted = isDeleted,
        DeletedUtc = isDeleted ? now : null,
        CreatedUtc = now,
        UpdatedUtc = now,
    };

    private static async Task<Guid> AddDecoratedImportedRecurringSeriesWithException(HomeOpsWebApplicationFactory factory, ApiDecorativeAvatarReferenceDto decorativeAvatar)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var now = DateTimeOffset.UtcNow;
        var source = await EnsureImportedSource(dbContext, now);
        var series = NewImportedSeries(source.Id, now);
        series.DecorativeAvatarReferenceType = decorativeAvatar.ReferenceType;
        series.DecorativeAvatarReferenceId = decorativeAvatar.ReferenceId;
        series.RecurrenceRule = new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 4, WeeklyDays = WeeklyDays.Serialize([DayOfWeek.Tuesday]) };
        series.Exceptions.Add(new EventException
        {
            Id = Guid.NewGuid(),
            EventSeriesId = series.Id,
            OccurrenceDate = new DateOnly(2026, 9, 8),
            OccurrenceKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 9, 8), new TimeOnly(9, 0)),
            ExceptionType = EventExceptionType.Modified,
            IsSkipped = false,
            Title = "Moved imported",
            CreatedUtc = now,
            UpdatedUtc = now,
        });
        dbContext.EventSeries.Add(series);
        await dbContext.SaveChangesAsync();
        return series.Id;
    }

    private static async Task<Guid> AddImportedSeries(HomeOpsWebApplicationFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var now = DateTimeOffset.UtcNow;
        var source = await EnsureImportedSource(dbContext, now);
        var series = NewImportedSeries(source.Id, now);
        series.Title = "Imported readonly";
        dbContext.EventSeries.Add(series);
        await dbContext.SaveChangesAsync();
        return series.Id;
    }

    private static async Task<HomeOps.Api.CalendarEvents.EventSource> EnsureImportedSource(HomeOpsDbContext dbContext, DateTimeOffset now)
    {
        var source = await dbContext.EventSources.FirstOrDefaultAsync(candidate => candidate.Id == SeedIds.ImportedSource);
        if (source is not null)
        {
            return source;
        }

        source = new HomeOps.Api.CalendarEvents.EventSource
        {
            Id = SeedIds.ImportedSource,
            HouseholdId = SeedHousehold.Id,
            Name = "Imported source",
            SourceType = EventSourceTypes.ICalFeed,
            IsEnabled = true,
            IsWritable = false,
            HealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy,
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        dbContext.EventSources.Add(source);
        return source;
    }

    private static EventSeries NewImportedSeries(Guid sourceId, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        EventSourceId = sourceId,
        Title = "Imported decorated",
        Description = "Imported description",
        Location = "Imported location",
        IsAllDay = false,
        StartDate = new DateOnly(2026, 9, 1),
        StartTime = new TimeOnly(9, 0),
        EndDate = new DateOnly(2026, 9, 1),
        EndTime = new TimeOnly(10, 0),
        RecurrenceType = RecurrenceType.None,
        ProviderEventId = "provider-event",
        ProviderInstanceId = "provider-instance",
        ProviderRevision = "provider-revision",
        ContentFingerprint = "provider-fingerprint",
        ImportedAtUtc = now.AddDays(-2),
        LastImportedUtc = now.AddDays(-1),
        LastSeenSyncAttemptUtc = now,
        CreatedUtc = now,
        UpdatedUtc = now,
    };

    private static class SeedIds
    {
        public static readonly Guid ActiveKnownPerson = Guid.Parse("10000000-0000-0000-0000-000000000001");
        public static readonly Guid DeletedKnownPerson = Guid.Parse("10000000-0000-0000-0000-000000000002");
        public static readonly Guid OtherKnownPerson = Guid.Parse("10000000-0000-0000-0000-000000000003");
        public static readonly Guid ImportedSource = Guid.Parse("10000000-0000-0000-0000-000000000004");
    }
}
