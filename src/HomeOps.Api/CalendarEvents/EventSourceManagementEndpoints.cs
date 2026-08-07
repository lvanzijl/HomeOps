using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using ContractHealthStatus = HomeOps.Contracts.Events.EventSourceHealthStatus;
using ContractPollInterval = HomeOps.Contracts.Events.EventSourcePollInterval;
using ContractSourceType = HomeOps.Contracts.Events.EventSourceType;
using DomainHealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus;
using DomainPollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval;

namespace HomeOps.Api.CalendarEvents;

public static class EventSourceManagementEndpoints
{
    private static readonly HashSet<ContractSourceType> CreatableSourceTypes = [ContractSourceType.ICalFeed];

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

        sources.MapPost("/ical-file", async ([FromForm] CreateICalFileSourceForm form, CalendarSourceUploadService uploadService, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var errors = ValidateUploadMetadata(form.Name, form.Icon, form.PollInterval, form.File);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            var result = await uploadService.CreateAsync(form.Name, form.Icon, ToDomainPollInterval(form.PollInterval), form.Enabled, form.File!, cancellationToken);
            if (!result.Succeeded) return result.Missing ? Results.NotFound() : Results.ValidationProblem(result.Errors);
            var created = await QuerySources(dbContext).SingleAsync(item => item.Id == result.SourceId, cancellationToken);
            return Results.Created($"/api/event-sources/{created.Id}", ToDto(created));
        }).DisableAntiforgery().WithName("CreateICalFileSource").Accepts<CreateICalFileSourceForm>("multipart/form-data").Produces<EventSourceDto>(StatusCodes.Status201Created).ProducesValidationProblem();

        sources.MapPut("/{sourceId:guid}/file", async (Guid sourceId, [FromForm] ReplaceICalFileSourceForm form, CalendarSourceUploadService uploadService, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (form.File is null) return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = ["Kies een iCal-bestand."] });
            var result = await uploadService.ReplaceAsync(sourceId, form.File, cancellationToken);
            if (!result.Succeeded) return result.Missing ? Results.NotFound() : Results.ValidationProblem(result.Errors);
            var updated = await QuerySources(dbContext).SingleAsync(item => item.Id == sourceId, cancellationToken);
            return Results.Ok(ToDto(updated));
        }).DisableAntiforgery().WithName("ReplaceICalFileSource").Accepts<ReplaceICalFileSourceForm>("multipart/form-data").Produces<EventSourceDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        sources.MapPut("/{sourceId:guid}", async (Guid sourceId, UpdateEventSourceRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var source = await QuerySources(dbContext).FirstOrDefaultAsync(candidate => candidate.Id == sourceId, cancellationToken);
            if (source is null) return Results.NotFound();

            var validationErrors = ValidateUpdateRequest(source, request);
            if (source.IsArchived && request.Enabled) validationErrors[nameof(UpdateEventSourceRequest.Enabled)] = ["Herstel de gearchiveerde bron om hem opnieuw zichtbaar te maken."];
            if (request.Enabled && !source.IsEnabled && CalendarSourceRefreshDispatcher.IsSupportedSourceType(source.SourceType) &&
                !string.Equals(source.NormalizationTimeZoneId, source.Household?.TimeZoneId, StringComparison.Ordinal))
            {
                validationErrors[nameof(UpdateEventSourceRequest.Enabled)] = ["Ververs deze bron eerst onder de huidige huishoudtijdzone voordat je hem inschakelt."];
            }
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


        sources.MapPost("/{sourceId:guid}/refresh", async (Guid sourceId, HomeOpsDbContext dbContext, ICalendarSourceRefreshDispatcher dispatcher, CancellationToken cancellationToken) =>
        {
            var source = await dbContext.EventSources
                .AsNoTracking()
                .FirstOrDefaultAsync(candidate => candidate.HouseholdId == SeedHousehold.Id && candidate.Id == sourceId, cancellationToken);
            if (source is null) return Results.NotFound();

            var result = await dispatcher.RefreshAsync(source, cancellationToken);
            var dto = ToSyncResultDto(source.Id, result.SynchronizationResult);
            return result.Supported ? Results.Ok(dto) : Results.BadRequest(dto);
        }).WithName("RefreshEventSource").Produces<SyncSourceResultDto>().Produces<SyncSourceResultDto>(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        sources.MapPost("/refresh-all", async (HomeOpsDbContext dbContext, ICalendarSourceRefreshDispatcher dispatcher, CancellationToken cancellationToken) =>
        {
            var refreshableSources = await dbContext.EventSources
                .AsNoTracking()
                .Where(source => source.HouseholdId == SeedHousehold.Id)
                .Where(source => source.IsEnabled)
                .Where(source => !source.IsArchived)
                .Where(source => source.SourceType == EventSourceTypes.ICalFeed || source.SourceType == EventSourceTypes.ICalFile)
                .OrderBy(source => source.Name)
                .ToListAsync(cancellationToken);

            var results = new List<SyncSourceResultDto>();
            foreach (var source in refreshableSources)
            {
                var result = await dispatcher.RefreshAsync(source, cancellationToken);
                results.Add(ToSyncResultDto(source.Id, result.SynchronizationResult));
            }

            return Results.Ok(new RefreshAllResultDto(results));
        }).WithName("RefreshAllEventSources").Produces<RefreshAllResultDto>();

        sources.MapPost("/{sourceId:guid}/archive", async (Guid sourceId, CalendarSourceArchiveRequest request, CalendarSourceLifecycleService lifecycle, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (!request.Confirmed) return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Confirmed)] = ["Bevestig dat de bron en geïmporteerde afspraken worden verborgen."] });
            var result = await lifecycle.ArchiveAsync(sourceId, cancellationToken);
            if (!result.Succeeded) return result.Missing ? Results.NotFound() : Results.ValidationProblem(new Dictionary<string, string[]> { ["source"] = [result.Error ?? "De bron kon niet worden gearchiveerd."] });
            return Results.Ok(ToDto(await QuerySources(dbContext).SingleAsync(item => item.Id == sourceId, cancellationToken)));
        }).WithName("ArchiveEventSource").Produces<EventSourceDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        sources.MapPost("/{sourceId:guid}/restore", async (Guid sourceId, CalendarSourceLifecycleService lifecycle, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var result = await lifecycle.RestoreAsync(sourceId, cancellationToken);
            if (!result.Succeeded) return result.Missing ? Results.NotFound() : Results.Conflict(new { error = result.Error });
            var source = ToDto(await QuerySources(dbContext).SingleAsync(item => item.Id == sourceId, cancellationToken));
            return Results.Ok(new CalendarSourceLifecycleResultDto(source, result.RefreshResult is null ? null : ToSyncResultDto(sourceId, result.RefreshResult)));
        }).WithName("RestoreEventSource").Produces<CalendarSourceLifecycleResultDto>().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        sources.MapPut("/{sourceId:guid}/reconnect-feed", async (Guid sourceId, CalendarSourceFeedReconnectRequest request, CalendarSourceLifecycleService lifecycle, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Icon)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["source"] = ["Naam en icoon zijn verplicht."] });
            var result = await lifecycle.ReconnectFeedAsync(sourceId, request, cancellationToken);
            if (!result.Succeeded) return result.Missing ? Results.NotFound() : Results.Conflict(new { error = result.Error });
            return Results.Ok(ToDto(await QuerySources(dbContext).SingleAsync(item => item.Id == sourceId, cancellationToken)));
        }).WithName("ReconnectICalFeedSource").Produces<EventSourceDto>().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        sources.MapPut("/{sourceId:guid}/metadata", async (Guid sourceId, UpdateCalendarSourceMetadataRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var source = await QuerySources(dbContext).SingleOrDefaultAsync(item => item.Id == sourceId, cancellationToken);
            if (source is null) return Results.NotFound();
            if (source.IsSystemManualSource) return Results.ValidationProblem(new Dictionary<string, string[]> { ["source"] = ["De handmatige gezinsagenda kan hier niet worden gewijzigd."] });
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Icon)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["source"] = ["Naam en icoon zijn verplicht."] });
            if (request.Enabled && source.IsArchived) return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Enabled)] = ["Herstel de gearchiveerde bron om hem opnieuw zichtbaar te maken."] });
            if (request.Enabled && CalendarSourceRefreshDispatcher.IsSupportedSourceType(source.SourceType) && !string.Equals(source.NormalizationTimeZoneId, source.Household?.TimeZoneId, StringComparison.Ordinal)) return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Enabled)] = ["Ververs deze bron eerst onder de huidige huishoudtijdzone."] });
            source.Name = request.Name.Trim(); source.Icon = request.Icon.Trim(); source.IsEnabled = request.Enabled; source.PollInterval = ToDomainPollInterval(request.PollInterval); source.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(source));
        }).WithName("UpdateEventSourceMetadata").Produces<EventSourceDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        sources.MapDelete("/{sourceId:guid}", async (Guid sourceId, bool confirmed, CalendarSourceLifecycleService lifecycle, CancellationToken cancellationToken) =>
        {
            if (!confirmed) return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(confirmed)] = ["Bevestig permanente verwijdering."] });
            var result = await lifecycle.RemoveAsync(sourceId, cancellationToken);
            if (!result.Succeeded) return result.Missing ? Results.NotFound() : Results.ValidationProblem(new Dictionary<string, string[]> { ["source"] = [result.Error ?? "De bron kon niet permanent worden verwijderd."] });
            return Results.NoContent();
        }).WithName("DeleteEventSource").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        return app;
    }

    private static IQueryable<EventSource> QuerySources(HomeOpsDbContext dbContext) => dbContext.EventSources
        .Include(source => source.Configuration)
        .Include(source => source.Household)
        .Where(source => source.HouseholdId == SeedHousehold.Id);


    private static SyncSourceResultDto ToSyncResultDto(Guid sourceId, CalendarSourceSynchronizationResult result) => new(
        sourceId,
        result.Succeeded,
        ToContractHealthStatus(result.SourceHealthStatus),
        result.LastSyncAttemptUtc,
        result.LastSuccessfulSyncUtc,
        result.LastFailedSyncUtc,
        result.CreatedCount,
        result.UpdatedCount,
        result.DeletedCount,
        result.UnchangedCount,
        result.WarningCount,
        result.Duration,
        ToLastError(result));

    private static EventSourceLastError? ToLastError(CalendarSourceSynchronizationResult result)
    {
        var error = result.Diagnostics.FirstOrDefault(diagnostic => diagnostic.Severity == ICalendar.ICalendarParseDiagnosticSeverity.Error);
        return error is null ? null : new EventSourceLastError(error.Code, error.Message);
    }

    private static EventSourceDto ToDto(EventSource source) => new(
        source.Id,
        source.Name,
        source.Icon,
        ToContractSourceType(source.SourceType),
        source.IsEnabled,
        source.IsWritable,
        source.IsSystem,
        source.IsArchived,
        source.ArchivedUtc,
        ToContractHealthStatus(source.HealthStatus),
        ToContractPollInterval(source.PollInterval),
        source.LastSyncAttemptUtc,
        source.LastSuccessfulSyncUtc,
        source.LastFailedSyncUtc,
        source.NextSyncAfterUtc,
        source.LastErrorCode is null && source.LastErrorMessage is null ? null : new EventSourceLastError(source.LastErrorCode, source.LastErrorMessage),
        source.ProviderSourceId,
        CalendarSourceRefreshDispatcher.IsSupportedSourceType(source.SourceType) && !string.Equals(source.NormalizationTimeZoneId, source.Household?.TimeZoneId, StringComparison.Ordinal),
        ToProviderConfigurationDto(source.Configuration));

    private static EventSourceProviderConfigurationDto? ToProviderConfigurationDto(EventSourceConfiguration? configuration) => configuration switch
    {
        ICalFeedSourceConfiguration feed => new EventSourceProviderConfigurationDto(
            EventSourceProviderConfigurationKind.ICalFeed,
            ICalFeed: new ICalFeedSourceConfigurationDto(feed.FeedUrl, feed.ETag, feed.LastModified, feed.LastContentHash)),
        ICalFileSourceConfiguration file => new EventSourceProviderConfigurationDto(
            EventSourceProviderConfigurationKind.ICalFile,
            ICalFile: new ICalFileSourceConfigurationDto(file.OriginalFilename, file.ContentHash, file.ContentLength, file.UploadedUtc, !string.IsNullOrWhiteSpace(file.FileReference))),
        _ => null
    };

    private static Dictionary<string, string[]> ValidateCreateRequest(CreateEventSourceRequest request)
    {
        var errors = ValidateCommon(request.Name, request.Icon, request.PollInterval, request.SourceType, request.ProviderConfiguration);
        if (!CreatableSourceTypes.Contains(request.SourceType))
        {
            errors[nameof(CreateEventSourceRequest.SourceType)] = ["Use this JSON endpoint for HTTPS iCal feeds and the multipart endpoint for iCal files."];
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

    private static Dictionary<string, string[]> ValidateUploadMetadata(string name, string icon, ContractPollInterval pollInterval, IFormFile? file)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(name)) errors[nameof(CreateICalFileSourceForm.Name)] = ["Source name is required."];
        else if (name.Trim().Length > 160) errors[nameof(CreateICalFileSourceForm.Name)] = ["Source name may contain at most 160 characters."];
        if (string.IsNullOrWhiteSpace(icon)) errors[nameof(CreateICalFileSourceForm.Icon)] = ["Source icon is required."];
        else if (icon.Trim().Length > 16) errors[nameof(CreateICalFileSourceForm.Icon)] = ["Source icon may contain at most 16 characters."];
        if (!EventSourceContractValidation.IsSupportedPollInterval(pollInterval)) errors[nameof(CreateICalFileSourceForm.PollInterval)] = ["Unsupported poll interval."];
        if (file is null) errors[nameof(CreateICalFileSourceForm.File)] = ["Choose an iCal file."];
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

public sealed class CreateICalFileSourceForm
{
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "📄";
    public bool Enabled { get; set; } = true;
    public ContractPollInterval PollInterval { get; set; } = ContractPollInterval.Every8Hours;
    public IFormFile? File { get; set; }
}

public sealed class ReplaceICalFileSourceForm
{
    public IFormFile? File { get; set; }
}
