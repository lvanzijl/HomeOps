using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using ContractHealthStatus = HomeOps.Contracts.Events.EventSourceHealthStatus;
using ContractPollInterval = HomeOps.Contracts.Events.EventSourcePollInterval;
using ContractSourceType = HomeOps.Contracts.Events.EventSourceType;
using DomainHealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus;
using DomainPollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval;

namespace HomeOps.Api.CalendarEvents;

public static class EventSourceManagementEndpoints
{
    private static readonly HashSet<ContractSourceType> CreatableSourceTypes = [ContractSourceType.ICalFeed, ContractSourceType.ICalFile];

    public static IEndpointRouteBuilder MapEventSourceManagementEndpoints(this IEndpointRouteBuilder app)
    {
        var sources = app.MapGroup("/api/event-sources").WithTags("Event Sources");

        sources.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var eventSources = await QuerySources(dbContext)
                .OrderBy(source => source.Name)
                .ToListAsync(cancellationToken);

            return Results.Ok(eventSources.Select(ToDto).ToList());
        }).WithName("ListEventSources").Produces<IReadOnlyCollection<EventSourceDto>>();

        sources.MapGet("/{sourceId:guid}", async (Guid sourceId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var source = await QuerySources(dbContext).FirstOrDefaultAsync(candidate => candidate.Id == sourceId, cancellationToken);
            return source is null ? Results.NotFound() : Results.Ok(ToDto(source));
        }).WithName("GetEventSource").Produces<EventSourceDto>().Produces(StatusCodes.Status404NotFound);

        sources.MapPost("/", async (CreateEventSourceRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validationErrors = ValidateCreateRequest(request);
            if (validationErrors.Count > 0) return Results.ValidationProblem(validationErrors);

            var now = DateTimeOffset.UtcNow;
            var source = new EventSource
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                Name = request.Name.Trim(),
                Icon = request.Icon.Trim(),
                SourceType = ToDomainSourceType(request.SourceType),
                IsEnabled = request.Enabled,
                IsWritable = false,
                IsSystem = false,
                HealthStatus = DomainHealthStatus.NeverSynced,
                PollInterval = ToDomainPollInterval(request.PollInterval),
                CreatedUtc = now,
                UpdatedUtc = now,
            };

            dbContext.EventSources.Add(source);
            AddOrUpdateProviderConfiguration(dbContext, source.Id, source.SourceType, request.ProviderConfiguration!, now);
            await dbContext.SaveChangesAsync(cancellationToken);

            var created = await QuerySources(dbContext).SingleAsync(candidate => candidate.Id == source.Id, cancellationToken);
            return Results.Created($"/api/event-sources/{source.Id}", ToDto(created));
        }).WithName("CreateEventSource").Produces<EventSourceDto>(StatusCodes.Status201Created).ProducesValidationProblem();

        sources.MapPut("/{sourceId:guid}", async (Guid sourceId, UpdateEventSourceRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var source = await QuerySources(dbContext).FirstOrDefaultAsync(candidate => candidate.Id == sourceId, cancellationToken);
            if (source is null) return Results.NotFound();

            var validationErrors = ValidateUpdateRequest(source, request);
            if (validationErrors.Count > 0) return Results.ValidationProblem(validationErrors);

            var now = DateTimeOffset.UtcNow;
            source.Name = request.Name.Trim();
            source.Icon = request.Icon.Trim();
            source.IsEnabled = request.Enabled;
            source.PollInterval = ToDomainPollInterval(request.PollInterval);
            source.UpdatedUtc = now;
            AddOrUpdateProviderConfiguration(dbContext, source.Id, source.SourceType, request.ProviderConfiguration!, now);

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(source));
        }).WithName("UpdateEventSource").Produces<EventSourceDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        sources.MapDelete("/{sourceId:guid}", async (Guid sourceId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var source = await dbContext.EventSources
                .Include(candidate => candidate.Configuration)
                .Include(candidate => candidate.EventSeries)
                .FirstOrDefaultAsync(candidate => candidate.HouseholdId == SeedHousehold.Id && candidate.Id == sourceId, cancellationToken);
            if (source is null) return Results.NotFound();

            if (source.IsSystemManualSource)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(EventSource.IsSystem)] = ["The system manual source cannot be deleted."]
                });
            }

            dbContext.EventSources.Remove(source);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteEventSource").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        return app;
    }

    private static IQueryable<EventSource> QuerySources(HomeOpsDbContext dbContext) => dbContext.EventSources
        .Include(source => source.Configuration)
        .Where(source => source.HouseholdId == SeedHousehold.Id);

    private static EventSourceDto ToDto(EventSource source) => new(
        source.Id,
        source.Name,
        source.Icon,
        ToContractSourceType(source.SourceType),
        source.IsEnabled,
        source.IsWritable,
        source.IsSystem,
        ToContractHealthStatus(source.HealthStatus),
        ToContractPollInterval(source.PollInterval),
        source.LastSyncAttemptUtc,
        source.LastSuccessfulSyncUtc,
        source.LastFailedSyncUtc,
        source.NextSyncAfterUtc,
        source.LastErrorCode is null && source.LastErrorMessage is null ? null : new EventSourceLastError(source.LastErrorCode, source.LastErrorMessage),
        source.ProviderSourceId,
        ToProviderConfigurationDto(source.Configuration));

    private static EventSourceProviderConfigurationDto? ToProviderConfigurationDto(EventSourceConfiguration? configuration) => configuration switch
    {
        ICalFeedSourceConfiguration feed => new EventSourceProviderConfigurationDto(
            EventSourceProviderConfigurationKind.ICalFeed,
            ICalFeed: new ICalFeedSourceConfigurationDto(feed.FeedUrl, feed.ETag, feed.LastModified, feed.LastContentHash)),
        ICalFileSourceConfiguration file => new EventSourceProviderConfigurationDto(
            EventSourceProviderConfigurationKind.ICalFile,
            ICalFile: new ICalFileSourceConfigurationDto(file.FileReference, file.OriginalFilename, file.ContentHash, file.UploadedUtc)),
        _ => null
    };

    private static Dictionary<string, string[]> ValidateCreateRequest(CreateEventSourceRequest request)
    {
        var errors = ValidateCommon(request.Name, request.Icon, request.PollInterval, request.SourceType, request.ProviderConfiguration);
        if (!CreatableSourceTypes.Contains(request.SourceType))
        {
            errors[nameof(CreateEventSourceRequest.SourceType)] = ["Only ICalFeed and ICalFile sources can be created by users."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateUpdateRequest(EventSource source, UpdateEventSourceRequest request)
    {
        var sourceType = ToContractSourceType(source.SourceType);
        var errors = ValidateCommon(request.Name, request.Icon, request.PollInterval, sourceType, request.ProviderConfiguration);

        if (source.IsSystemManualSource)
        {
            errors[nameof(EventSource.IsSystem)] = ["The system manual source cannot be modified through source management."];
        }

        if (!CreatableSourceTypes.Contains(sourceType))
        {
            errors[nameof(EventSource.SourceType)] = ["Only ICalFeed and ICalFile sources can be updated through this endpoint."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateCommon(string name, string icon, ContractPollInterval pollInterval, ContractSourceType sourceType, EventSourceProviderConfigurationRequest? providerConfiguration)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(name)) errors[nameof(CreateEventSourceRequest.Name)] = ["Source name is required."];
        if (string.IsNullOrWhiteSpace(icon)) errors[nameof(CreateEventSourceRequest.Icon)] = ["Source icon is required."];
        if (!EventSourceContractValidation.IsSupportedPollInterval(pollInterval)) errors[nameof(CreateEventSourceRequest.PollInterval)] = ["Unsupported poll interval."];
        if (!EventSourceContractValidation.IsSupportedSourceType(sourceType)) errors[nameof(CreateEventSourceRequest.SourceType)] = ["Unsupported source type."];

        foreach (var (key, value) in EventSourceContractValidation.ValidateProviderConfiguration(sourceType, providerConfiguration))
        {
            errors[key] = value;
        }

        return errors;
    }

    private static void AddOrUpdateProviderConfiguration(HomeOpsDbContext dbContext, Guid sourceId, string sourceType, EventSourceProviderConfigurationRequest providerConfiguration, DateTimeOffset now)
    {
        switch (sourceType)
        {
            case EventSourceTypes.ICalFeed:
                var feedRequest = providerConfiguration.ICalFeed!;
                var feed = dbContext.ICalFeedSourceConfigurations.Local.FirstOrDefault(configuration => configuration.EventSourceId == sourceId)
                    ?? dbContext.ICalFeedSourceConfigurations.FirstOrDefault(configuration => configuration.EventSourceId == sourceId);
                if (feed is null)
                {
                    dbContext.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration
                    {
                        EventSourceId = sourceId,
                        FeedUrl = feedRequest.FeedUrl.Trim(),
                        CreatedUtc = now,
                        UpdatedUtc = now,
                    });
                }
                else
                {
                    feed.FeedUrl = feedRequest.FeedUrl.Trim();
                    feed.UpdatedUtc = now;
                }
                break;

            case EventSourceTypes.ICalFile:
                var fileRequest = providerConfiguration.ICalFile!;
                var file = dbContext.ICalFileSourceConfigurations.Local.FirstOrDefault(configuration => configuration.EventSourceId == sourceId)
                    ?? dbContext.ICalFileSourceConfigurations.FirstOrDefault(configuration => configuration.EventSourceId == sourceId);
                if (file is null)
                {
                    dbContext.ICalFileSourceConfigurations.Add(new ICalFileSourceConfiguration
                    {
                        EventSourceId = sourceId,
                        FileReference = fileRequest.FileReference.Trim(),
                        OriginalFilename = fileRequest.OriginalFilename.Trim(),
                        ContentHash = fileRequest.ContentHash.Trim(),
                        UploadedUtc = now,
                        CreatedUtc = now,
                        UpdatedUtc = now,
                    });
                }
                else
                {
                    file.FileReference = fileRequest.FileReference.Trim();
                    file.OriginalFilename = fileRequest.OriginalFilename.Trim();
                    file.ContentHash = fileRequest.ContentHash.Trim();
                    file.UpdatedUtc = now;
                }
                break;
        }
    }

    private static string ToDomainSourceType(ContractSourceType sourceType) => sourceType switch
    {
        ContractSourceType.Manual => EventSourceTypes.Manual,
        ContractSourceType.ICalFeed => EventSourceTypes.ICalFeed,
        ContractSourceType.ICalFile => EventSourceTypes.ICalFile,
        ContractSourceType.GoogleCalendar => EventSourceTypes.GoogleCalendar,
        ContractSourceType.CalDav => EventSourceTypes.CalDav,
        ContractSourceType.Exchange => EventSourceTypes.Exchange,
        ContractSourceType.SchoolHolidays => EventSourceTypes.SchoolHolidays,
        ContractSourceType.TvSeries => EventSourceTypes.TvSeries,
        _ => EventSourceTypes.Provider
    };

    private static ContractSourceType ToContractSourceType(string sourceType) => sourceType switch
    {
        EventSourceTypes.Manual or "manual" => ContractSourceType.Manual,
        EventSourceTypes.ICalFeed => ContractSourceType.ICalFeed,
        EventSourceTypes.ICalFile => ContractSourceType.ICalFile,
        EventSourceTypes.GoogleCalendar => ContractSourceType.GoogleCalendar,
        EventSourceTypes.CalDav => ContractSourceType.CalDav,
        EventSourceTypes.Exchange => ContractSourceType.Exchange,
        EventSourceTypes.SchoolHolidays => ContractSourceType.SchoolHolidays,
        EventSourceTypes.TvSeries => ContractSourceType.TvSeries,
        _ => ContractSourceType.Provider
    };

    private static DomainPollInterval ToDomainPollInterval(ContractPollInterval pollInterval) => pollInterval switch
    {
        ContractPollInterval.EveryHour => DomainPollInterval.EveryHour,
        ContractPollInterval.EveryDay => DomainPollInterval.EveryDay,
        _ => DomainPollInterval.Every8Hours
    };

    private static ContractPollInterval ToContractPollInterval(DomainPollInterval pollInterval) => pollInterval switch
    {
        DomainPollInterval.EveryHour => ContractPollInterval.EveryHour,
        DomainPollInterval.EveryDay => ContractPollInterval.EveryDay,
        _ => ContractPollInterval.Every8Hours
    };

    private static ContractHealthStatus ToContractHealthStatus(DomainHealthStatus healthStatus) => healthStatus switch
    {
        DomainHealthStatus.NeverSynced => ContractHealthStatus.NeverSynced,
        DomainHealthStatus.Failed => ContractHealthStatus.Failed,
        _ => ContractHealthStatus.Healthy
    };
}
