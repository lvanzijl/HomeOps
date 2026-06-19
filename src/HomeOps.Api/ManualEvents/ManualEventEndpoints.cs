using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.ManualEvents;

public static class ManualEventEndpoints
{
    public static IEndpointRouteBuilder MapManualEventEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/event-sources", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var sources = await dbContext.EventSources
                .AsNoTracking()
                .Where(source => source.HouseholdId == SeedHousehold.Id)
                .OrderBy(source => source.Name)
                .ToListAsync(cancellationToken);

            return Results.Ok(sources.Select(ManualEventNormalizer.ToContract).ToList());
        }).WithName("GetEventSources").Produces<IReadOnlyCollection<HomeOps.Contracts.Events.EventSource>>();

        var events = app.MapGroup("/api/events").WithTags("Events");

        events.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var manualEvents = await dbContext.ManualEvents
                .AsNoTracking()
                .Where(manualEvent => manualEvent.EventSource!.HouseholdId == SeedHousehold.Id)
                .OrderBy(manualEvent => manualEvent.StartUtc)
                .ThenBy(manualEvent => manualEvent.Title)
                .ToListAsync(cancellationToken);

            return Results.Ok(manualEvents.Select(ManualEventNormalizer.ToNormalizedEvent).ToList());
        }).WithName("GetEvents").Produces<IReadOnlyCollection<NormalizedEvent>>();

        events.MapGet("/{eventId:guid}", async (Guid eventId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var manualEvent = await dbContext.ManualEvents
                .AsNoTracking()
                .Where(candidate => candidate.Id == eventId && candidate.EventSource!.HouseholdId == SeedHousehold.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return manualEvent is null ? Results.NotFound() : Results.Ok(ManualEventNormalizer.ToDto(manualEvent));
        }).WithName("GetEventById").Produces<ManualEventDto>().Produces(StatusCodes.Status404NotFound);

        events.MapPost("/", async (CreateManualEventRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validationErrors = ValidateEvent(request.Title, request.StartUtc, request.EndUtc);
            if (validationErrors.Count > 0)
            {
                return Results.ValidationProblem(validationErrors);
            }

            var sourceExists = await dbContext.EventSources.AnyAsync(source => source.Id == SeedManualEvents.ManualEventSourceId && source.HouseholdId == SeedHousehold.Id && source.IsWritable, cancellationToken);
            if (!sourceExists)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            var manualEvent = new ManualEvent
            {
                Id = Guid.NewGuid(),
                EventSourceId = SeedManualEvents.ManualEventSourceId,
                Title = request.Title.Trim(),
                Description = NormalizeDescription(request.Description),
                StartUtc = request.StartUtc,
                EndUtc = request.EndUtc,
                IsAllDay = request.IsAllDay,
                CreatedUtc = now,
                UpdatedUtc = now,
            };

            dbContext.ManualEvents.Add(manualEvent);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/events/{manualEvent.Id}", ManualEventNormalizer.ToDto(manualEvent));
        }).WithName("CreateEvent").Produces<ManualEventDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        events.MapPut("/{eventId:guid}", async (Guid eventId, UpdateManualEventRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validationErrors = ValidateEvent(request.Title, request.StartUtc, request.EndUtc);
            if (validationErrors.Count > 0)
            {
                return Results.ValidationProblem(validationErrors);
            }

            var manualEvent = await dbContext.ManualEvents
                .Include(candidate => candidate.EventSource)
                .FirstOrDefaultAsync(candidate => candidate.Id == eventId && candidate.EventSource!.HouseholdId == SeedHousehold.Id && candidate.EventSource.IsWritable, cancellationToken);

            if (manualEvent is null)
            {
                return Results.NotFound();
            }

            manualEvent.Title = request.Title.Trim();
            manualEvent.Description = NormalizeDescription(request.Description);
            manualEvent.StartUtc = request.StartUtc;
            manualEvent.EndUtc = request.EndUtc;
            manualEvent.IsAllDay = request.IsAllDay;
            manualEvent.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ManualEventNormalizer.ToDto(manualEvent));
        }).WithName("UpdateEvent").Produces<ManualEventDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        events.MapDelete("/{eventId:guid}", async (Guid eventId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var manualEvent = await dbContext.ManualEvents
                .Include(candidate => candidate.EventSource)
                .FirstOrDefaultAsync(candidate => candidate.Id == eventId && candidate.EventSource!.HouseholdId == SeedHousehold.Id && candidate.EventSource.IsWritable, cancellationToken);

            if (manualEvent is null)
            {
                return Results.NotFound();
            }

            dbContext.ManualEvents.Remove(manualEvent);
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
            errors[nameof(CreateManualEventRequest.Title)] = ["Event title is required."];
        }

        if (endUtc is not null && endUtc < startUtc)
        {
            errors[nameof(CreateManualEventRequest.EndUtc)] = ["Event end must be on or after event start."];
        }

        return errors;
    }

    private static string? NormalizeDescription(string? description)
    {
        return string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }
}
