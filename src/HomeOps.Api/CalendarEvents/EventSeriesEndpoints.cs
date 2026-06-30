using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.CalendarEvents;

public static class EventSeriesEndpoints
{
    public static IEndpointRouteBuilder MapEventSeriesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/event-sources", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var sources = await dbContext.EventSources
                .AsNoTracking()
                .Where(source => source.HouseholdId == SeedHousehold.Id)
                .OrderBy(source => source.Name)
                .ToListAsync(cancellationToken);

            return Results.Ok(sources.Select(EventSeriesNormalizer.ToContract).ToList());
        }).WithName("GetEventSources").Produces<IReadOnlyCollection<HomeOps.Contracts.Events.EventSource>>();

        var calendar = app.MapGroup("/api/calendar").WithTags("Calendar");

        calendar.MapGet("/export", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var export = await CalendarPortabilityService.ExportAsync(dbContext, cancellationToken);
            return Results.Ok(export);
        }).WithName("ExportCalendar").Produces<CalendarExportDocument>();

        calendar.MapPost("/restore", async (CalendarExportDocument document, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var result = await CalendarPortabilityService.RestoreAsync(dbContext, document, cancellationToken);
            return result.Succeeded ? Results.NoContent() : Results.ValidationProblem(result.ValidationErrors);
        }).WithName("RestoreCalendar").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem();

        var events = app.MapGroup("/api/events").WithTags("Events");

        events.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var household = await dbContext.Households.AsNoTracking().SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
            var startsOn = DateOnly.FromDateTime(DateTimeOffset.UtcNow.UtcDateTime).AddYears(-1);
            var endsOn = startsOn.AddMonths(30);
            var eventSeries = await dbContext.EventSeries
                .AsNoTracking()
                .Include(eventSeries => eventSeries.Exceptions)
                .Where(eventSeries => eventSeries.EventSource!.HouseholdId == SeedHousehold.Id)
                .OrderBy(eventSeries => eventSeries.StartDate)
                .ThenBy(eventSeries => eventSeries.StartTime)
                .ThenBy(eventSeries => eventSeries.Title)
                .ToListAsync(cancellationToken);

            var occurrences = eventSeries
                .SelectMany(series => EventOccurrenceGenerator.Generate(series, household.TimeZoneId, startsOn, endsOn))
                .OrderBy(occurrence => occurrence.StartsAt)
                .ThenBy(occurrence => occurrence.Title)
                .Select(occurrence => occurrence.ToNormalizedEvent())
                .ToList();

            return Results.Ok(occurrences);
        }).WithName("GetEvents").Produces<IReadOnlyCollection<NormalizedEvent>>();

        events.MapGet("/{eventId:guid}", async (Guid eventId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var eventSeries = await dbContext.EventSeries
                .AsNoTracking()
                .Where(candidate => candidate.Id == eventId && candidate.EventSource!.HouseholdId == SeedHousehold.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return eventSeries is null ? Results.NotFound() : Results.Ok(EventSeriesNormalizer.ToDto(eventSeries));
        }).WithName("GetEventById").Produces<EventSeriesDto>().Produces(StatusCodes.Status404NotFound);

        events.MapPost("/", async (CreateEventSeriesRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validationErrors = ValidateEvent(request.Title, request.StartUtc, request.EndUtc);
            if (validationErrors.Count > 0)
            {
                return Results.ValidationProblem(validationErrors);
            }

            var writableSourceId = await dbContext.EventSources
                .Where(source => source.HouseholdId == SeedHousehold.Id && source.IsWritable && source.SourceType == "manual")
                .OrderBy(source => source.CreatedUtc)
                .Select(source => (Guid?)source.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (writableSourceId is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            var eventSeries = EventOccurrenceProjector.FromRequest(
                Guid.NewGuid(),
                writableSourceId.Value,
                request.Title.Trim(),
                NormalizeDescription(request.Description),
                request.StartUtc,
                request.EndUtc,
                request.IsAllDay,
                now,
                now);

            dbContext.EventSeries.Add(eventSeries);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/events/{eventSeries.Id}", EventSeriesNormalizer.ToDto(eventSeries));
        }).WithName("CreateEvent").Produces<EventSeriesDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        events.MapPut("/{eventId:guid}", async (Guid eventId, UpdateEventSeriesRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validationErrors = ValidateEvent(request.Title, request.StartUtc, request.EndUtc);
            if (validationErrors.Count > 0)
            {
                return Results.ValidationProblem(validationErrors);
            }

            var eventSeries = await dbContext.EventSeries
                .Include(candidate => candidate.EventSource)
                .FirstOrDefaultAsync(candidate => candidate.Id == eventId && candidate.EventSource!.HouseholdId == SeedHousehold.Id && candidate.EventSource.IsWritable, cancellationToken);

            if (eventSeries is null)
            {
                return Results.NotFound();
            }

            EventOccurrenceProjector.ApplyRequest(
                eventSeries,
                request.Title.Trim(),
                NormalizeDescription(request.Description),
                request.StartUtc,
                request.EndUtc,
                request.IsAllDay,
                DateTimeOffset.UtcNow);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(EventSeriesNormalizer.ToDto(eventSeries));
        }).WithName("UpdateEvent").Produces<EventSeriesDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        events.MapDelete("/{eventId:guid}", async (Guid eventId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var eventSeries = await dbContext.EventSeries
                .Include(candidate => candidate.EventSource)
                .FirstOrDefaultAsync(candidate => candidate.Id == eventId && candidate.EventSource!.HouseholdId == SeedHousehold.Id && candidate.EventSource.IsWritable, cancellationToken);

            if (eventSeries is null)
            {
                return Results.NotFound();
            }

            dbContext.EventSeries.Remove(eventSeries);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.NoContent();
        }).WithName("DeleteEvent").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static Dictionary<string, string[]> ValidateEvent(string title, DateTimeOffset startUtc, DateTimeOffset? endUtc)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(title))
        {
            errors[nameof(CreateEventSeriesRequest.Title)] = ["Event title is required."];
        }

        if (endUtc is not null && endUtc < startUtc)
        {
            errors[nameof(CreateEventSeriesRequest.EndUtc)] = ["Event end must be on or after event start."];
        }

        return errors;
    }

    private static string? NormalizeDescription(string? description)
    {
        return string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }
}
