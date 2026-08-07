using HomeOps.Api.Data;
using HomeOps.Api.DecorativeAvatars;
using HomeOps.Api.Households;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.CalendarEvents;

public static class EventSeriesEndpoints
{
    public static IEndpointRouteBuilder MapEventSeriesEndpoints(this IEndpointRouteBuilder app)
    {
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
            var startsOn = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById(household.TimeZoneId)).DateTime).AddYears(-1);
            var endsOn = startsOn.AddMonths(30);
            var eventSeries = await dbContext.EventSeries
                .AsNoTracking()
                .Include(eventSeries => eventSeries.EventSource)
                .Include(eventSeries => eventSeries.Exceptions)
                .Where(eventSeries => eventSeries.EventSource!.HouseholdId == SeedHousehold.Id)
                .Where(eventSeries => eventSeries.EventSource!.IsEnabled)
                .Where(eventSeries => eventSeries.EventSource!.IsWritable || eventSeries.EventSource.HealthStatus == EventSourceHealthStatus.Healthy)
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
            var timeZoneId = await GetHouseholdTimeZoneIdAsync(dbContext, cancellationToken);
            var eventSeries = await dbContext.EventSeries
                .AsNoTracking()
                .Where(candidate => candidate.Id == eventId && candidate.EventSource!.HouseholdId == SeedHousehold.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return eventSeries is null ? Results.NotFound() : Results.Ok(EventSeriesNormalizer.ToDto(eventSeries, timeZoneId));
        }).WithName("GetEventById").Produces<EventSeriesDto>().Produces(StatusCodes.Status404NotFound);

        events.MapGet("/calendar-field-repair-candidates", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var candidates = await dbContext.EventSeries
                .AsNoTracking()
                .Where(series => series.EventSource!.HouseholdId == SeedHousehold.Id)
                .Where(series => series.EventSource!.IsWritable)
                .Where(series => series.CalendarWriteContractVersion == 1)
                .OrderBy(series => series.StartDate)
                .ThenBy(series => series.StartTime)
                .Select(series => new CalendarFieldRepairCandidateDto(
                    series.Id,
                    series.Title,
                    series.StartDate,
                    series.StartTime,
                    series.EndDate,
                    series.EndTime,
                    series.IsAllDay,
                    series.UpdatedUtc))
                .ToListAsync(cancellationToken);

            return Results.Ok(candidates);
        }).WithName("ListCalendarFieldRepairCandidates").Produces<IReadOnlyCollection<CalendarFieldRepairCandidateDto>>();

        events.MapPost("/{eventId:guid}/calendar-field-repair/preview", async (Guid eventId, PreviewCalendarFieldRepairRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var timeZoneId = await GetHouseholdTimeZoneIdAsync(dbContext, cancellationToken);
            var eventSeries = await LoadRepairCandidateAsync(eventId, dbContext, cancellationToken);
            if (eventSeries is null) return Results.NotFound();

            var errors = new Dictionary<string, string[]>();
            var proposed = request.Timing.ToDomain();
            CalendarFieldResolver.TryValidate(proposed, timeZoneId, errors, "timing");
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var current = ToCalendarFieldSetRequest(eventSeries);
            var preview = new CalendarFieldRepairPreviewDto(
                eventSeries.Id,
                current,
                request.Timing,
                ResolveStart(proposed, timeZoneId),
                ResolveEnd(proposed, timeZoneId));
            return Results.Ok(preview);
        }).WithName("PreviewCalendarFieldRepair").Produces<CalendarFieldRepairPreviewDto>().ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);

        events.MapPost("/{eventId:guid}/calendar-field-repair", async (Guid eventId, ApplyCalendarFieldRepairRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (!request.Confirmed)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(ApplyCalendarFieldRepairRequest.Confirmed)] = ["Explicit confirmation is required."] });
            }

            var timeZoneId = await GetHouseholdTimeZoneIdAsync(dbContext, cancellationToken);
            var eventSeries = await LoadRepairCandidateAsync(eventId, dbContext, cancellationToken);
            if (eventSeries is null) return Results.NotFound();
            if (eventSeries.UpdatedUtc != request.ExpectedUpdatedUtc)
            {
                return Results.Conflict(new { error = "The event changed after the repair preview. Reload it before applying a correction." });
            }

            var errors = new Dictionary<string, string[]>();
            var proposed = request.Timing.ToDomain();
            CalendarFieldResolver.TryValidate(proposed, timeZoneId, errors, "timing");
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            EventOccurrenceProjector.ApplyCalendarFields(
                eventSeries,
                eventSeries.Title,
                eventSeries.Description,
                eventSeries.Location,
                proposed,
                DateTimeOffset.UtcNow);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(EventSeriesNormalizer.ToDto(eventSeries, timeZoneId));
        }).WithName("ApplyCalendarFieldRepair").Produces<EventSeriesDto>().ProducesValidationProblem().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        events.MapPost("/", async (CreateEventSeriesRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var timeZoneId = await GetHouseholdTimeZoneIdAsync(dbContext, cancellationToken);
            var validationErrors = new Dictionary<string, string[]>();
            var fields = ResolveRequestFields(request.StartDate, request.StartTime, request.EndDate, request.EndTime, request.IsAllDay, request.StartUtc, request.EndUtc, validationErrors);
            ValidateEvent(request.Title, fields, timeZoneId, validationErrors);
            var recurrenceRule = fields is null ? null : MapRecurrenceRule(request.RecurrenceRule, fields.StartDate, validationErrors);
            var avatarValidation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!avatarValidation.IsValid)
            {
                validationErrors[nameof(CreateEventSeriesRequest.DecorativeAvatar)] = [avatarValidation.Error!];
            }
            if (validationErrors.Count > 0)
            {
                return Results.ValidationProblem(validationErrors);
            }

            var writableSourceId = await dbContext.EventSources
                .Where(source => source.HouseholdId == SeedHousehold.Id && source.IsWritable && (source.SourceType == EventSourceTypes.Manual || source.SourceType == "manual"))
                .OrderBy(source => source.CreatedUtc)
                .Select(source => (Guid?)source.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (writableSourceId is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            var eventSeries = EventOccurrenceProjector.FromCalendarFields(
                Guid.NewGuid(),
                writableSourceId.Value,
                request.Title.Trim(),
                NormalizeDescription(request.Description),
                NormalizeDescription(request.Location),
                fields!,
                now,
                now);
            eventSeries.RecurrenceType = RecurrenceType.None;
            eventSeries.RecurrenceRule = recurrenceRule;
            eventSeries.DecorativeAvatarReferenceType = avatarValidation.ReferenceType;
            eventSeries.DecorativeAvatarReferenceId = avatarValidation.ReferenceId;

            dbContext.EventSeries.Add(eventSeries);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/events/{eventSeries.Id}", EventSeriesNormalizer.ToDto(eventSeries, timeZoneId));
        }).WithName("CreateEvent").Produces<EventSeriesDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        events.MapPut("/{eventId:guid}", async (Guid eventId, UpdateEventSeriesRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var timeZoneId = await GetHouseholdTimeZoneIdAsync(dbContext, cancellationToken);
            var validationErrors = new Dictionary<string, string[]>();
            var fields = ResolveRequestFields(request.StartDate, request.StartTime, request.EndDate, request.EndTime, request.IsAllDay, request.StartUtc, request.EndUtc, validationErrors);
            ValidateEvent(request.Title, fields, timeZoneId, validationErrors);
            var recurrenceRule = fields is null ? null : MapRecurrenceRule(request.RecurrenceRule, fields.StartDate, validationErrors);
            var avatarValidation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!avatarValidation.IsValid)
            {
                validationErrors[nameof(UpdateEventSeriesRequest.DecorativeAvatar)] = [avatarValidation.Error!];
            }
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

            EventOccurrenceProjector.ApplyCalendarFields(
                eventSeries,
                request.Title.Trim(),
                NormalizeDescription(request.Description),
                NormalizeDescription(request.Location),
                fields!,
                DateTimeOffset.UtcNow);
            eventSeries.RecurrenceType = RecurrenceType.None;
            eventSeries.RecurrenceRule = recurrenceRule;
            eventSeries.DecorativeAvatarReferenceType = avatarValidation.ReferenceType;
            eventSeries.DecorativeAvatarReferenceId = avatarValidation.ReferenceId;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(EventSeriesNormalizer.ToDto(eventSeries, timeZoneId));
        }).WithName("UpdateEvent").Produces<EventSeriesDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);


        events.MapPost("/{eventId:guid}/occurrences/skip", async (Guid eventId, OccurrenceTargetRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var (eventSeries, validationResult) = await LoadOccurrenceTargetAsync(eventId, request.OccurrenceKey, dbContext, cancellationToken);
            if (validationResult is not null)
            {
                return validationResult;
            }

            UpsertSkippedException(eventSeries!, OccurrenceKey.Parse(request.OccurrenceKey), dbContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("SkipEventOccurrence").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);

        events.MapPost("/{eventId:guid}/occurrences/restore", async (Guid eventId, OccurrenceTargetRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var (eventSeries, validationResult) = await LoadOccurrenceTargetAsync(eventId, request.OccurrenceKey, dbContext, cancellationToken);
            if (validationResult is not null)
            {
                return validationResult;
            }

            var key = OccurrenceKey.Parse(request.OccurrenceKey);
            var existing = FindException(eventSeries!, key);
            if (existing is not null)
            {
                dbContext.EventExceptions.Remove(existing);
                eventSeries!.UpdatedUtc = DateTimeOffset.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("RestoreEventOccurrence").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);

        events.MapPut("/{eventId:guid}/occurrences/modify", async (Guid eventId, ModifyOccurrenceRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var (eventSeries, validationResult) = await LoadOccurrenceTargetAsync(eventId, request.OccurrenceKey, dbContext, cancellationToken);
            if (validationResult is not null)
            {
                return validationResult;
            }

            var timeZoneId = await GetHouseholdTimeZoneIdAsync(dbContext, cancellationToken);
            var validationErrors = ValidateModifiedOccurrence(request, timeZoneId);
            if (validationErrors.Count > 0)
            {
                return Results.ValidationProblem(validationErrors);
            }

            UpsertModifiedException(eventSeries!, request, dbContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("ModifyEventOccurrence").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);

        events.MapDelete("/{eventId:guid}/occurrences", async (Guid eventId, string occurrenceKey, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var (eventSeries, validationResult) = await LoadOccurrenceTargetAsync(eventId, occurrenceKey, dbContext, cancellationToken);
            if (validationResult is not null)
            {
                return validationResult;
            }

            UpsertSkippedException(eventSeries!, OccurrenceKey.Parse(occurrenceKey), dbContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteEventOccurrence").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);


        events.MapPut("/{eventId:guid}/occurrences/split", async (Guid eventId, SplitEventSeriesRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var (eventSeries, validationResult) = await LoadOccurrenceTargetAsync(eventId, request.OccurrenceKey, dbContext, cancellationToken);
            if (validationResult is not null)
            {
                return validationResult;
            }

            var timeZoneId = await GetHouseholdTimeZoneIdAsync(dbContext, cancellationToken);
            var validationErrors = ValidateSplitRequest(eventSeries!, request, timeZoneId);
            var splitKey = OccurrenceKey.Parse(request.OccurrenceKey);
            var splitFields = ResolveSplitFields(eventSeries!, splitKey, request);
            var newRule = request.RecurrenceRule is null
                ? CopyRuleForSplit(eventSeries!, splitKey)
                : MapRecurrenceRule(request.RecurrenceRule, splitFields.StartDate, validationErrors);

            if (validationErrors.Count > 0)
            {
                return Results.ValidationProblem(validationErrors);
            }

            await using var transaction = dbContext.Database.IsRelational() ? await dbContext.Database.BeginTransactionAsync(cancellationToken) : null;
            var newSeries = SplitSeries(eventSeries!, splitKey, request, splitFields, newRule, dbContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return Results.Created($"/api/events/{newSeries.Id}", EventSeriesNormalizer.ToDto(newSeries, timeZoneId));
        }).WithName("SplitEventSeriesFromOccurrence").Produces<EventSeriesDto>(StatusCodes.Status201Created).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);

        events.MapDelete("/{eventId:guid}/occurrences/future", async (Guid eventId, string occurrenceKey, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var (eventSeries, validationResult) = await LoadOccurrenceTargetAsync(eventId, occurrenceKey, dbContext, cancellationToken);
            if (validationResult is not null)
            {
                return validationResult;
            }

            await using var transaction = dbContext.Database.IsRelational() ? await dbContext.Database.BeginTransactionAsync(cancellationToken) : null;
            EndSeriesBefore(eventSeries!, OccurrenceKey.Parse(occurrenceKey));
            RemoveExceptionsOnOrAfter(eventSeries!, OccurrenceKey.Parse(occurrenceKey), dbContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return Results.NoContent();
        }).WithName("DeleteEventOccurrencesFromOccurrence").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);

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



    private static async Task<(EventSeries? EventSeries, IResult? ValidationResult)> LoadOccurrenceTargetAsync(Guid eventId, string occurrenceKey, HomeOpsDbContext dbContext, CancellationToken cancellationToken)
    {
        if (!OccurrenceKey.TryParse(occurrenceKey, out var key))
        {
            return (null, Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(OccurrenceTargetRequest.OccurrenceKey)] = ["OccurrenceKey must be formatted as yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss."] }));
        }

        var eventSeries = await dbContext.EventSeries
            .Include(series => series.EventSource)
            .Include(series => series.Exceptions)
            .FirstOrDefaultAsync(series => series.Id == eventId && series.EventSource!.HouseholdId == SeedHousehold.Id && series.EventSource.IsWritable, cancellationToken);

        if (eventSeries is null)
        {
            return (null, Results.NotFound());
        }

        if (eventSeries.RecurrenceRule is null && eventSeries.RecurrenceType == RecurrenceType.None)
        {
            return (null, Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(OccurrenceTargetRequest.OccurrenceKey)] = ["Occurrence operations require a recurring event series."] }));
        }

        if (!EventOccurrenceGenerator.CanGenerateOccurrence(eventSeries, key))
        {
            return (null, Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(OccurrenceTargetRequest.OccurrenceKey)] = ["OccurrenceKey does not identify a generated occurrence for this series."] }));
        }

        return (eventSeries, null);
    }

    private static Dictionary<string, string[]> ValidateModifiedOccurrence(ModifyOccurrenceRequest request, string timeZoneId)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.Title is not null && string.IsNullOrWhiteSpace(request.Title))
        {
            errors[nameof(ModifyOccurrenceRequest.Title)] = ["Replacement title must not be blank when provided."];
        }

        if (request.Timing is not null && (request.StartUtc is not null || request.EndUtc is not null || request.IsAllDay is not null))
        {
            errors[nameof(ModifyOccurrenceRequest.Timing)] = ["Timing cannot be combined with legacy UTC timing fields."];
        }
        else if (request.Timing is not null)
        {
            CalendarFieldResolver.TryValidate(request.Timing.ToDomain(), timeZoneId, errors, "timing");
        }
        else if (request.EndUtc is not null && request.StartUtc is not null && request.EndUtc < request.StartUtc)
        {
            errors[nameof(ModifyOccurrenceRequest.EndUtc)] = ["Replacement end must be on or after replacement start."];
        }

        if (request.EndUtc is not null && request.StartUtc is null)
        {
            errors[nameof(ModifyOccurrenceRequest.StartUtc)] = ["Replacement start is required when replacement end is supplied."];
        }

        if (request.Title is null && request.Description is null && request.Location is null && request.IsAllDay is null && request.StartUtc is null && request.EndUtc is null && request.Timing is null)
        {
            errors[nameof(ModifyOccurrenceRequest)] = ["At least one replacement field is required."];
        }

        return errors;
    }

    private static void UpsertSkippedException(EventSeries eventSeries, OccurrenceKey key, HomeOpsDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var exception = FindException(eventSeries, key);
        if (exception is null)
        {
            exception = new EventException
            {
                Id = Guid.NewGuid(),
                EventSeriesId = eventSeries.Id,
                OccurrenceDate = key.Date,
                OccurrenceKey = key,
                CreatedUtc = now,
            };
            eventSeries.Exceptions.Add(exception);
            dbContext.EventExceptions.Add(exception);
        }

        exception.ExceptionType = EventExceptionType.Skipped;
        exception.IsSkipped = true;
        exception.Title = null;
        exception.Description = null;
        exception.Location = null;
        exception.IsAllDay = null;
        exception.StartDate = null;
        exception.StartTime = null;
        exception.EndDate = null;
        exception.EndTime = null;
        exception.UpdatedUtc = now;
        eventSeries.UpdatedUtc = now;
    }

    private static void UpsertModifiedException(EventSeries eventSeries, ModifyOccurrenceRequest request, HomeOpsDbContext dbContext)
    {
        var key = OccurrenceKey.Parse(request.OccurrenceKey);
        var now = DateTimeOffset.UtcNow;
        var exception = FindException(eventSeries, key);
        if (exception is null)
        {
            exception = new EventException
            {
                Id = Guid.NewGuid(),
                EventSeriesId = eventSeries.Id,
                OccurrenceDate = key.Date,
                OccurrenceKey = key,
                CreatedUtc = now,
            };
            eventSeries.Exceptions.Add(exception);
            dbContext.EventExceptions.Add(exception);
        }

        exception.ExceptionType = EventExceptionType.Modified;
        exception.IsSkipped = false;
        exception.Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim();
        exception.Description = NormalizeDescription(request.Description);
        exception.Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim();
        var timing = request.Timing?.ToDomain() ?? (request.StartUtc is null
            ? null
            : CalendarFieldResolver.FromLegacy(request.StartUtc.Value, request.EndUtc, request.IsAllDay ?? false));
        exception.IsAllDay = timing?.IsAllDay ?? request.IsAllDay;
        exception.StartDate = timing?.StartDate;
        exception.StartTime = timing?.StartTime;
        exception.EndDate = timing?.EndDate;
        exception.EndTime = timing?.EndTime;
        exception.UpdatedUtc = now;
        eventSeries.UpdatedUtc = now;
    }

    private static EventException? FindException(EventSeries eventSeries, OccurrenceKey key) => eventSeries.Exceptions.FirstOrDefault(exception => exception.OccurrenceKey == key);


    private static Dictionary<string, string[]> ValidateSplitRequest(EventSeries eventSeries, SplitEventSeriesRequest request, string timeZoneId)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.Title is not null && string.IsNullOrWhiteSpace(request.Title))
        {
            errors[nameof(SplitEventSeriesRequest.Title)] = ["Replacement title must not be blank when provided."];
        }

        if (request.Timing is not null && (request.StartUtc is not null || request.EndUtc is not null || request.IsAllDay is not null))
        {
            errors[nameof(SplitEventSeriesRequest.Timing)] = ["Timing cannot be combined with legacy UTC timing fields."];
        }
        else if (request.Timing is not null)
        {
            CalendarFieldResolver.TryValidate(request.Timing.ToDomain(), timeZoneId, errors, "timing");
        }
        else if (request.EndUtc is not null && request.StartUtc is not null && request.EndUtc < request.StartUtc)
        {
            errors[nameof(SplitEventSeriesRequest.EndUtc)] = ["Replacement end must be on or after replacement start."];
        }

        if (request.EndUtc is not null && request.StartUtc is null)
        {
            errors[nameof(SplitEventSeriesRequest.StartUtc)] = ["Replacement start is required when replacement end is supplied."];
        }

        var splitKey = OccurrenceKey.Parse(request.OccurrenceKey);
        var newStart = ResolveSplitFields(eventSeries, splitKey, request).StartDate;
        if (request.RecurrenceRule is null)
        {
            var copiedRule = CopyRuleForSplit(eventSeries, splitKey);
            var validation = EventRecurrenceRuleValidation.Validate(copiedRule, newStart);
            if (!validation.IsValid)
            {
                errors[nameof(SplitEventSeriesRequest.RecurrenceRule)] = validation.Errors.ToArray();
            }
        }

        return errors;
    }

    private static EventSeries SplitSeries(EventSeries original, OccurrenceKey splitKey, SplitEventSeriesRequest request, CalendarFieldSet fields, EventRecurrenceRule? newRule, HomeOpsDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var newSeries = EventOccurrenceProjector.FromCalendarFields(
            Guid.NewGuid(),
            original.EventSourceId,
            request.Title?.Trim() ?? original.Title,
            request.Description is null ? original.Description : NormalizeDescription(request.Description),
            request.Location is null ? original.Location : NormalizeDescription(request.Location),
            fields,
            now,
            now);
        newSeries.RecurrenceType = RecurrenceType.None;
        newSeries.RecurrenceRule = newRule;
        newSeries.ProviderEventId = original.ProviderEventId;
        newSeries.ProviderInstanceId = original.ProviderInstanceId;
        newSeries.ProviderRevision = original.ProviderRevision;
        newSeries.ContentFingerprint = original.ContentFingerprint;
        newSeries.ImportedAtUtc = original.ImportedAtUtc;
        newSeries.LastImportedUtc = original.LastImportedUtc;
        newSeries.LastSeenSyncAttemptUtc = original.LastSeenSyncAttemptUtc;
        newSeries.DecorativeAvatarReferenceType = original.DecorativeAvatarReferenceType;
        newSeries.DecorativeAvatarReferenceId = original.DecorativeAvatarReferenceId;

        EndSeriesBefore(original, splitKey);
        RemoveExceptionsOnOrAfter(original, splitKey, dbContext);
        dbContext.EventSeries.Add(newSeries);
        return newSeries;
    }

    private static void EndSeriesBefore(EventSeries eventSeries, OccurrenceKey splitKey)
    {
        var rule = CopyRule(eventSeries.RecurrenceRule ?? CreateLegacyCompatibilityRule(eventSeries));
        rule.EndMode = RecurrenceEndMode.OnDate;
        rule.UntilDate = splitKey.Date.AddDays(-1);
        rule.Count = null;
        eventSeries.RecurrenceRule = rule;
        eventSeries.RecurrenceType = RecurrenceType.None;
        eventSeries.UpdatedUtc = DateTimeOffset.UtcNow;
    }

    private static void RemoveExceptionsOnOrAfter(EventSeries eventSeries, OccurrenceKey splitKey, HomeOpsDbContext dbContext)
    {
        foreach (var exception in eventSeries.Exceptions.Where(exception => exception.OccurrenceKey.CompareTo(splitKey) >= 0).ToArray())
        {
            dbContext.EventExceptions.Remove(exception);
        }
    }

    private static EventRecurrenceRule CopyRuleForSplit(EventSeries eventSeries, OccurrenceKey splitKey)
    {
        var rule = CopyRule(eventSeries.RecurrenceRule ?? CreateLegacyCompatibilityRule(eventSeries));
        if (rule.EndMode == RecurrenceEndMode.AfterCount && rule.Count is not null && EventOccurrenceGenerator.TryGetGeneratedOccurrenceOrdinal(eventSeries, splitKey, out var ordinal))
        {
            rule.Count = Math.Max(1, rule.Count.Value - ordinal + 1);
        }

        return rule;
    }

    private static EventRecurrenceRule CreateLegacyCompatibilityRule(EventSeries series) => series.RecurrenceType switch
    {
        RecurrenceType.Daily => new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.Never },
        RecurrenceType.Weekly => new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = WeeklyDays.Serialize([series.StartDate.DayOfWeek]) },
        RecurrenceType.Monthly => new EventRecurrenceRule { Frequency = RecurrenceFrequency.Monthly, Interval = 1, EndMode = RecurrenceEndMode.Never, MonthlyDayOfMonth = series.StartDate.Day },
        RecurrenceType.Yearly => new EventRecurrenceRule { Frequency = RecurrenceFrequency.Yearly, Interval = 1, EndMode = RecurrenceEndMode.Never, YearlyMonth = series.StartDate.Month, YearlyDayOfMonth = series.StartDate.Day },
        _ => throw new InvalidOperationException("Series split requires a recurring event series."),
    };

    private static EventRecurrenceRule CopyRule(EventRecurrenceRule rule) => new()
    {
        Frequency = rule.Frequency,
        Interval = rule.Interval,
        EndMode = rule.EndMode,
        UntilDate = rule.UntilDate,
        Count = rule.Count,
        WeeklyDays = rule.WeeklyDays,
        MonthlyDayOfMonth = rule.MonthlyDayOfMonth,
        YearlyMonth = rule.YearlyMonth,
        YearlyDayOfMonth = rule.YearlyDayOfMonth,
        RawProviderRecurrenceRule = rule.RawProviderRecurrenceRule,
        UnsupportedRecurrenceStatus = rule.UnsupportedRecurrenceStatus,
        UnsupportedRecurrenceReason = rule.UnsupportedRecurrenceReason,
    };

    private static EventRecurrenceRule? MapRecurrenceRule(RecurrenceRuleDto? recurrenceRule, DateOnly firstOccurrenceDate, Dictionary<string, string[]> errors)
    {
        if (recurrenceRule is null)
        {
            return null;
        }

        var prefix = nameof(CreateEventSeriesRequest.RecurrenceRule);
        if (!Enum.TryParse<RecurrenceFrequency>(recurrenceRule.Frequency, ignoreCase: true, out var frequency))
        {
            errors[$"{prefix}.{nameof(RecurrenceRuleDto.Frequency)}"] = ["Recurrence frequency must be Daily, Weekly, Monthly, or Yearly."];
        }

        if (!Enum.TryParse<RecurrenceEndMode>(recurrenceRule.EndMode, ignoreCase: true, out var endMode))
        {
            errors[$"{prefix}.{nameof(RecurrenceRuleDto.EndMode)}"] = ["Recurrence end mode must be Never, OnDate, or AfterCount."];
        }

        string? weeklyDays = null;
        if (recurrenceRule.WeeklyDays is not null)
        {
            try
            {
                weeklyDays = WeeklyDays.Serialize(recurrenceRule.WeeklyDays.Select(day =>
                {
                    if (!Enum.TryParse<DayOfWeek>(day, ignoreCase: true, out var parsed))
                    {
                        throw new ArgumentException($"Unsupported weekday '{day}'.");
                    }

                    return parsed;
                }));
            }
            catch (ArgumentException exception)
            {
                errors[$"{prefix}.{nameof(RecurrenceRuleDto.WeeklyDays)}"] = [exception.Message];
            }
        }

        if (errors.Count > 0)
        {
            return null;
        }

        var rule = new EventRecurrenceRule
        {
            Frequency = frequency,
            Interval = recurrenceRule.Interval,
            EndMode = endMode,
            UntilDate = recurrenceRule.UntilDate,
            Count = recurrenceRule.Count,
            WeeklyDays = weeklyDays,
            MonthlyDayOfMonth = recurrenceRule.MonthlyDayOfMonth,
            YearlyMonth = recurrenceRule.YearlyMonth,
            YearlyDayOfMonth = recurrenceRule.YearlyDayOfMonth,
        };

        var validation = EventRecurrenceRuleValidation.Validate(rule, firstOccurrenceDate);
        if (!validation.IsValid)
        {
            errors[prefix] = validation.Errors.ToArray();
        }

        return validation.IsValid ? rule : null;
    }

    private static void ValidateEvent(string title, CalendarFieldSet? fields, string timeZoneId, Dictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            errors[nameof(CreateEventSeriesRequest.Title)] = ["Event title is required."];
        }

        if (fields is not null)
        {
            CalendarFieldResolver.TryValidate(fields, timeZoneId, errors);
        }
    }

    private static CalendarFieldSet? ResolveRequestFields(
        DateOnly? startDate,
        TimeOnly? startTime,
        DateOnly? endDate,
        TimeOnly? endTime,
        bool isAllDay,
        DateTimeOffset? legacyStartUtc,
        DateTimeOffset? legacyEndUtc,
        Dictionary<string, string[]> errors)
    {
        var hasCalendarFields = startDate is not null || startTime is not null || endDate is not null || endTime is not null;
        if (hasCalendarFields && (legacyStartUtc is not null || legacyEndUtc is not null))
        {
            errors["timing"] = ["Calendar fields cannot be combined with legacy UTC timing fields."];
            return null;
        }

        if (hasCalendarFields)
        {
            if (startDate is null) errors["startDate"] = ["Start date is required."];
            if (endDate is null) errors["endDate"] = ["End date is required."];
            return startDate is null || endDate is null
                ? null
                : new CalendarFieldSet(startDate.Value, startTime, endDate.Value, endTime, isAllDay);
        }

        if (legacyStartUtc is null)
        {
            errors["startDate"] = ["Start date is required."];
            return null;
        }

        return CalendarFieldResolver.FromLegacy(legacyStartUtc.Value, legacyEndUtc, isAllDay);
    }

    private static CalendarFieldSet ResolveSplitFields(EventSeries original, OccurrenceKey splitKey, SplitEventSeriesRequest request)
    {
        if (request.Timing is not null)
        {
            return request.Timing.ToDomain();
        }

        if (request.StartUtc is not null)
        {
            return CalendarFieldResolver.FromLegacy(request.StartUtc.Value, request.EndUtc, request.IsAllDay ?? original.IsAllDay);
        }

        var durationDays = Math.Max(0, original.EndDate.DayNumber - original.StartDate.DayNumber);
        return new CalendarFieldSet(
            splitKey.Date,
            original.IsAllDay ? null : original.StartTime,
            splitKey.Date.AddDays(durationDays),
            original.IsAllDay ? null : original.EndTime,
            original.IsAllDay);
    }

    private static Task<string> GetHouseholdTimeZoneIdAsync(HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        dbContext.Households.AsNoTracking()
            .Where(household => household.Id == SeedHousehold.Id)
            .Select(household => household.TimeZoneId)
            .SingleAsync(cancellationToken);

    private static Task<EventSeries?> LoadRepairCandidateAsync(Guid eventId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        dbContext.EventSeries
            .Include(series => series.EventSource)
            .FirstOrDefaultAsync(series =>
                series.Id == eventId &&
                series.EventSource!.HouseholdId == SeedHousehold.Id &&
                series.EventSource.IsWritable &&
                series.CalendarWriteContractVersion == 1,
                cancellationToken);

    private static CalendarFieldSetRequest ToCalendarFieldSetRequest(EventSeries series) =>
        new(series.StartDate, series.StartTime, series.EndDate, series.EndTime, series.IsAllDay);

    private static DateTimeOffset ResolveStart(CalendarFieldSet fields, string timeZoneId) =>
        CalendarFieldResolver.Resolve(fields.StartDate, fields.StartTime ?? TimeOnly.MinValue, timeZoneId);

    private static DateTimeOffset ResolveEnd(CalendarFieldSet fields, string timeZoneId) =>
        CalendarFieldResolver.Resolve(fields.EndDate, fields.EndTime ?? TimeOnly.MinValue, timeZoneId);

    private static string? NormalizeDescription(string? description)
    {
        return string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }
}
