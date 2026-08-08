using HomeOps.Api.Data;
using HomeOps.Api.DecorativeAvatars;
using HomeOps.Api.Lists;
using HomeOps.Api.Households;
using HomeOps.Api.Motivation;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tasks;

public static class TaskEndpoints
{
    private const int GenerationHorizonDays = 60;
    private const int NoDateNeedsReviewDays = 14;
    private const int NoDateReviewCandidateLimit = 5;

    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        group.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            await GenerateRecurringTasks(dbContext, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            await ClassifyNoDateTasks(dbContext, DateTimeOffset.UtcNow, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            var tasks = await dbContext.HouseholdTasks.AsNoTracking()
                .Where(task => task.HouseholdId == SeedHousehold.Id && !task.IsExpired && task.NoDateReviewState != NoDateTaskReviewState.Archived)
                .OrderBy(task => task.IsCompleted).ThenBy(task => task.DueDate == null).ThenBy(task => task.DueDate).ThenBy(task => task.CreatedUtc)
                .Select(task => ToDto(task))
                .ToListAsync(cancellationToken);
            return Results.Ok(tasks);
        }).WithName("GetTasks").Produces<IReadOnlyCollection<HouseholdTaskDto>>();

        group.MapGet("/archived", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var tasks = await dbContext.HouseholdTasks.AsNoTracking()
                .Where(task => task.HouseholdId == SeedHousehold.Id
                    && !task.IsExpired
                    && task.NoDateReviewState == NoDateTaskReviewState.Archived
                    && task.RecurringTaskSeriesId == null
                    && task.RecurrenceFrequency == TaskRecurrenceFrequency.None)
                .OrderByDescending(task => task.ArchivedUtc)
                .ThenBy(task => task.Title)
                .Select(task => ToDto(task))
                .ToListAsync(cancellationToken);
            return Results.Ok(tasks);
        }).WithName("GetArchivedTasks").Produces<IReadOnlyCollection<HouseholdTaskDto>>();

        group.MapPost("/", async (CreateHouseholdTaskRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = await ValidateTaskInput(request.Title, request.OwnershipKind, request.FamilyMemberId, dbContext, cancellationToken);
            if (validation.Error is not null) return Results.BadRequest(new { error = validation.Error });
            var avatarValidation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!avatarValidation.IsValid) return Results.BadRequest(new { error = avatarValidation.Error });
            var frequency = request.RecurrenceFrequency ?? TaskRecurrenceFrequency.None;
            if (frequency == TaskRecurrenceFrequency.None)
            {
                var task = CreateTask(validation.Title, request.DueDate, validation.OwnershipKind, validation.FamilyMemberId, null, DateTimeOffset.UtcNow);
                task.DecorativeAvatarReferenceType = avatarValidation.ReferenceType;
                task.DecorativeAvatarReferenceId = avatarValidation.ReferenceId;
                dbContext.HouseholdTasks.Add(task);
                await dbContext.SaveChangesAsync(cancellationToken);
                return Results.Created($"/api/tasks/{task.Id}", ToDto(task));
            }

            var startDate = request.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            var now = DateTimeOffset.UtcNow;
            var series = new RecurringTaskSeries
            {
                Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = validation.Title, StartDate = startDate, Frequency = frequency,
                OwnershipKind = validation.OwnershipKind, FamilyMemberId = validation.FamilyMemberId,
                DecorativeAvatarReferenceType = avatarValidation.ReferenceType, DecorativeAvatarReferenceId = avatarValidation.ReferenceId,
                CreatedUtc = now, UpdatedUtc = now,
            };
            dbContext.RecurringTaskSeries.Add(series);
            await GenerateOccurrencesForSeries(dbContext, series, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            var first = await dbContext.HouseholdTasks.AsNoTracking().Where(task => task.RecurringTaskSeriesId == series.Id && !task.IsExpired).OrderBy(task => task.DueDate).FirstAsync(cancellationToken);
            return Results.Created($"/api/tasks/{first.Id}", ToDto(first));
        }).WithName("CreateTask").Produces<HouseholdTaskDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{taskId:guid}", async (Guid taskId, UpdateHouseholdTaskRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken);
            if (task is null) return Results.NotFound();
            var validation = await ValidateTaskInput(request.Title, request.OwnershipKind, request.FamilyMemberId, dbContext, cancellationToken);
            if (validation.Error is not null) return Results.BadRequest(new { error = validation.Error });
            var avatarValidation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!avatarValidation.IsValid) return Results.BadRequest(new { error = avatarValidation.Error });
            var frequency = request.RecurrenceFrequency ?? TaskRecurrenceFrequency.None;
            var now = DateTimeOffset.UtcNow;
            if (IsRecurring(task))
            {
                if (request.RecurrenceScope is null)
                    return Results.BadRequest(new { error = "Choose whether this change applies to this occurrence, this and future occurrences, or the entire series." });
                var result = await UpdateRecurringTask(dbContext, task, request.RecurrenceScope.Value, validation.Title, request.DueDate, validation.OwnershipKind, validation.FamilyMemberId, frequency, avatarValidation.ReferenceType, avatarValidation.ReferenceId, now, cancellationToken);
                if (result.Error is not null)
                    return result.IsConflict ? Results.Conflict(new { error = result.Error }) : Results.BadRequest(new { error = result.Error });
                await dbContext.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToDto(result.Task!));
            }

            if (frequency == TaskRecurrenceFrequency.None)
            {
                ApplyTaskFields(task, validation.Title, request.DueDate, validation.OwnershipKind, validation.FamilyMemberId, TaskRecurrenceFrequency.None, avatarValidation.ReferenceType, avatarValidation.ReferenceId, now);
                task.RecurringTaskSeriesId = null;
            }
            else
            {
                var startDate = request.DueDate ?? task.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
                var series = NewSeries(validation.Title, startDate, frequency, validation.OwnershipKind, validation.FamilyMemberId, avatarValidation.ReferenceType, avatarValidation.ReferenceId, now);
                dbContext.RecurringTaskSeries.Add(series);
                ApplyTaskFields(task, validation.Title, startDate, validation.OwnershipKind, validation.FamilyMemberId, frequency, avatarValidation.ReferenceType, avatarValidation.ReferenceId, now);
                task.RecurringTaskSeriesId = series.Id;
                await GenerateOccurrencesForSeries(dbContext, series, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("UpdateTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/recurrence/delete", async (Guid taskId, DeleteRecurringTaskRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken);
            if (task?.RecurringTaskSeriesId is null) return Results.NotFound();
            if (!request.Confirmed)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["confirmed"] = ["Explicit confirmation is required."] });
            var series = await dbContext.RecurringTaskSeries.FirstOrDefaultAsync(s => s.Id == task.RecurringTaskSeriesId && s.HouseholdId == SeedHousehold.Id && !s.IsDeleted, cancellationToken);
            if (series is null) return Results.NotFound();
            var error = await DeleteRecurringTask(dbContext, task, series, request.Scope, DateTimeOffset.UtcNow, cancellationToken);
            if (error is not null) return Results.Conflict(new { error });
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteRecurringTaskRecurrence").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        group.MapGet("/review/no-date", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            await ClassifyNoDateTasks(dbContext, DateTimeOffset.UtcNow, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            var tasks = await dbContext.HouseholdTasks.AsNoTracking()
                .Where(task => task.HouseholdId == SeedHousehold.Id && task.DueDate == null && !task.IsCompleted && !task.IsExpired && task.NoDateReviewState == NoDateTaskReviewState.NeedsReview)
                .OrderBy(task => task.NoDateLastReviewedUtc ?? task.CreatedUtc).ThenBy(task => task.CreatedUtc)
                .Take(NoDateReviewCandidateLimit)
                .Select(task => ToDto(task))
                .ToListAsync(cancellationToken);
            return Results.Ok(tasks);
        }).WithName("GetNoDateTaskReviewCandidates").Produces<IReadOnlyCollection<HouseholdTaskDto>>();

        group.MapPost("/{taskId:guid}/keep-active", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var now = DateTimeOffset.UtcNow; task.NoDateReviewState = NoDateTaskReviewState.Active; task.NoDateLastReviewedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("KeepNoDateTaskActive").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/add-due-date", async (Guid taskId, ReviewNoDateTaskRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            if (request.DueDate is null) return Results.BadRequest(new { error = "Due date is required." });
            var now = DateTimeOffset.UtcNow; task.DueDate = request.DueDate; task.NoDateReviewState = NoDateTaskReviewState.Active; task.NoDateLastReviewedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("AddDueDateToNoDateTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/move-to-someday", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var now = DateTimeOffset.UtcNow; task.DueDate = null; task.NoDateReviewState = NoDateTaskReviewState.Someday; task.NoDateLastReviewedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("MoveNoDateTaskToSomeday").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/archive", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            if (IsRecurring(task)) return Results.Conflict(new { error = "Recurring tasks cannot be archived. Manage the routine instead." });
            var now = DateTimeOffset.UtcNow; task.NoDateReviewState = NoDateTaskReviewState.Archived; task.ArchivedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("ArchiveTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        group.MapPost("/{taskId:guid}/restore", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadArchivedNormalTask(dbContext, taskId, cancellationToken);
            if (task is null) return Results.NotFound();
            var now = DateTimeOffset.UtcNow;
            task.NoDateReviewState = task.IsCompleted ? NoDateTaskReviewState.Completed : NoDateTaskReviewState.Active;
            task.ArchivedUtc = null;
            if (!task.IsCompleted && task.DueDate is null) task.NoDateLastReviewedUtc = now;
            task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("RestoreArchivedTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{taskId:guid}", async (Guid taskId, bool confirmed, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (!confirmed)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["confirmed"] = ["Explicit confirmation is required."] });
            var task = await LoadArchivedNormalTask(dbContext, taskId, cancellationToken);
            if (task is null) return Results.NotFound();
            dbContext.HouseholdTasks.Remove(task);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteArchivedTask").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/complete", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var wasCompleted = task.IsCompleted; var now = DateTimeOffset.UtcNow; task.IsCompleted = true; task.CompletedUtc ??= now; task.NoDateReviewState = NoDateTaskReviewState.Completed; task.UpdatedUtc = now;
            if (!wasCompleted) await ApplyMotivationProgress(dbContext, task, 1, cancellationToken);
            await GenerateRecurringTasks(dbContext, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("CompleteTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/reopen", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadActiveTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var wasCompleted = task.IsCompleted; task.IsCompleted = false; task.CompletedUtc = null; task.NoDateReviewState = task.DueDate is null ? NoDateTaskReviewState.Active : task.NoDateReviewState; task.UpdatedUtc = DateTimeOffset.UtcNow;
            if (wasCompleted) await ApplyMotivationProgress(dbContext, task, -1, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("ReopenTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);
        return app;
    }

    private static async Task<RecurringTaskMutationResult> UpdateRecurringTask(
        HomeOpsDbContext dbContext,
        HouseholdTask task,
        TaskRecurrenceScope scope,
        string title,
        DateOnly? dueDate,
        TaskOwnershipKind ownershipKind,
        string? familyMemberId,
        TaskRecurrenceFrequency frequency,
        DecorativeAvatarReferenceType? avatarReferenceType,
        string? avatarReferenceId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (task.RecurringTaskSeriesId is null)
            return RecurringTaskMutationResult.Conflict("The recurring series could not be found.");
        var series = await dbContext.RecurringTaskSeries
            .FirstOrDefaultAsync(candidate => candidate.Id == task.RecurringTaskSeriesId && candidate.HouseholdId == SeedHousehold.Id && !candidate.IsDeleted, cancellationToken);
        if (series is null)
            return RecurringTaskMutationResult.Conflict("The recurring series could not be found.");

        var originalDueDate = await ResolveOriginalDueDate(dbContext, task, cancellationToken);
        if (originalDueDate is null)
            return RecurringTaskMutationResult.BadRequest("A recurring occurrence must have an original due date.");

        if (scope == TaskRecurrenceScope.Occurrence)
        {
            if (task.IsCompleted)
                return RecurringTaskMutationResult.Conflict("Completed occurrences are history and cannot be edited.");
            if (frequency != series.Frequency)
                return RecurringTaskMutationResult.BadRequest("Recurrence frequency can only change for this and future occurrences or the entire series.");
            if (dueDate is null)
                return RecurringTaskMutationResult.BadRequest("A recurring occurrence requires a due date.");
            if (await HasSeriesDueDateCollision(dbContext, series.Id, dueDate.Value, task.Id, cancellationToken))
                return RecurringTaskMutationResult.Conflict("Another occurrence in this series already uses that due date.");

            var exception = await LoadExceptionForOccurrence(dbContext, series.Id, originalDueDate.Value, task.Id, cancellationToken)
                ?? new RecurringTaskException { Id = Guid.NewGuid(), RecurringTaskSeriesId = series.Id, OriginalDueDate = originalDueDate.Value, CreatedUtc = now };
            if (dbContext.Entry(exception).State == EntityState.Detached) dbContext.RecurringTaskExceptions.Add(exception);
            exception.ExceptionType = RecurringTaskExceptionType.Modified;
            exception.ReplacementTaskId = task.Id;
            exception.Title = title;
            exception.DueDate = dueDate;
            exception.OwnershipKind = ownershipKind;
            exception.FamilyMemberId = familyMemberId;
            exception.DecorativeAvatarReferenceType = avatarReferenceType;
            exception.DecorativeAvatarReferenceId = avatarReferenceId;
            exception.UpdatedUtc = now;
            ApplyTaskFields(task, title, dueDate, ownershipKind, familyMemberId, series.Frequency, avatarReferenceType, avatarReferenceId, now);
            return RecurringTaskMutationResult.Success(task);
        }

        if (scope == TaskRecurrenceScope.ThisAndFuture)
        {
            if (task.IsCompleted)
                return RecurringTaskMutationResult.Conflict("Choose an incomplete occurrence to change this and future occurrences.");
            if (await HasCompletedOccurrenceAtOrAfter(dbContext, series.Id, originalDueDate.Value, cancellationToken))
                return RecurringTaskMutationResult.Conflict("A completed occurrence exists in this range. Choose a later incomplete occurrence or edit the entire series.");

            var boundaryExceptions = await dbContext.RecurringTaskExceptions
                .Where(exception => exception.RecurringTaskSeriesId == series.Id && exception.OriginalDueDate >= originalDueDate.Value)
                .ToListAsync(cancellationToken);
            await RemoveIncompleteOccurrences(dbContext, series.Id, task.Id, originalDueDate.Value, boundaryExceptions, cancellationToken);
            dbContext.RecurringTaskExceptions.RemoveRange(boundaryExceptions);
            series.EndDate = originalDueDate.Value.AddDays(-1);
            series.IsDeleted = series.EndDate < series.StartDate;
            series.UpdatedUtc = now;

            if (frequency == TaskRecurrenceFrequency.None)
            {
                ApplyTaskFields(task, title, dueDate, ownershipKind, familyMemberId, TaskRecurrenceFrequency.None, avatarReferenceType, avatarReferenceId, now);
                task.RecurringTaskSeriesId = null;
                return RecurringTaskMutationResult.Success(task);
            }
            if (dueDate is null)
                return RecurringTaskMutationResult.BadRequest("A recurring series requires a start date.");

            var splitSeries = NewSeries(title, dueDate.Value, frequency, ownershipKind, familyMemberId, avatarReferenceType, avatarReferenceId, now);
            dbContext.RecurringTaskSeries.Add(splitSeries);
            ApplyTaskFields(task, title, dueDate, ownershipKind, familyMemberId, frequency, avatarReferenceType, avatarReferenceId, now);
            task.RecurringTaskSeriesId = splitSeries.Id;
            await GenerateOccurrencesForSeries(dbContext, splitSeries, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            return RecurringTaskMutationResult.Success(task);
        }

        var allExceptions = await dbContext.RecurringTaskExceptions
            .Where(exception => exception.RecurringTaskSeriesId == series.Id)
            .ToListAsync(cancellationToken);
        await RemoveIncompleteOccurrences(dbContext, series.Id, task.Id, null, allExceptions, cancellationToken);
        dbContext.RecurringTaskExceptions.RemoveRange(allExceptions);

        if (frequency == TaskRecurrenceFrequency.None)
        {
            series.IsDeleted = true;
            series.UpdatedUtc = now;
            ApplyTaskFields(task, title, dueDate, ownershipKind, familyMemberId, TaskRecurrenceFrequency.None, avatarReferenceType, avatarReferenceId, now);
            task.RecurringTaskSeriesId = null;
            return RecurringTaskMutationResult.Success(task);
        }
        if (dueDate is null)
            return RecurringTaskMutationResult.BadRequest("A recurring series requires a start date.");
        if (await HasSeriesDueDateCollision(dbContext, series.Id, dueDate.Value, task.Id, cancellationToken, completedOnly: true))
            return RecurringTaskMutationResult.Conflict("A completed occurrence already uses the new series start date.");

        series.Title = title;
        series.StartDate = dueDate.Value;
        series.EndDate = null;
        series.Frequency = frequency;
        series.OwnershipKind = ownershipKind;
        series.FamilyMemberId = familyMemberId;
        series.DecorativeAvatarReferenceType = avatarReferenceType;
        series.DecorativeAvatarReferenceId = avatarReferenceId;
        series.IsDeleted = false;
        series.UpdatedUtc = now;
        if (!task.IsCompleted)
            ApplyTaskFields(task, title, dueDate, ownershipKind, familyMemberId, frequency, avatarReferenceType, avatarReferenceId, now);
        await GenerateOccurrencesForSeries(dbContext, series, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
        return RecurringTaskMutationResult.Success(task);
    }

    private static async Task<string?> DeleteRecurringTask(HomeOpsDbContext dbContext, HouseholdTask task, RecurringTaskSeries series, TaskRecurrenceScope scope, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var originalDueDate = await ResolveOriginalDueDate(dbContext, task, cancellationToken);
        if (originalDueDate is null) return "A recurring occurrence must have an original due date.";

        if (scope == TaskRecurrenceScope.Occurrence)
        {
            if (task.IsCompleted) return "Completed occurrences are history and cannot be removed.";
            var exception = await LoadExceptionForOccurrence(dbContext, series.Id, originalDueDate.Value, task.Id, cancellationToken)
                ?? new RecurringTaskException { Id = Guid.NewGuid(), RecurringTaskSeriesId = series.Id, OriginalDueDate = originalDueDate.Value, CreatedUtc = now };
            if (dbContext.Entry(exception).State == EntityState.Detached) dbContext.RecurringTaskExceptions.Add(exception);
            SetSkippedException(exception, now);
            dbContext.HouseholdTasks.Remove(task);
            return null;
        }

        if (scope == TaskRecurrenceScope.ThisAndFuture)
        {
            if (task.IsCompleted) return "Choose an incomplete occurrence to remove this and future occurrences.";
            var exceptions = await dbContext.RecurringTaskExceptions
                .Where(exception => exception.RecurringTaskSeriesId == series.Id && exception.OriginalDueDate >= originalDueDate.Value)
                .ToListAsync(cancellationToken);
            await RemoveIncompleteOccurrences(dbContext, series.Id, null, originalDueDate.Value, exceptions, cancellationToken);
            dbContext.RecurringTaskExceptions.RemoveRange(exceptions);
            series.EndDate = originalDueDate.Value.AddDays(-1);
            series.IsDeleted = series.EndDate < series.StartDate;
            series.UpdatedUtc = now;
            return null;
        }

        var allExceptions = await dbContext.RecurringTaskExceptions.Where(exception => exception.RecurringTaskSeriesId == series.Id).ToListAsync(cancellationToken);
        var incomplete = await dbContext.HouseholdTasks.Where(candidate => candidate.RecurringTaskSeriesId == series.Id && !candidate.IsCompleted).ToListAsync(cancellationToken);
        dbContext.HouseholdTasks.RemoveRange(incomplete);
        dbContext.RecurringTaskExceptions.RemoveRange(allExceptions);
        series.IsDeleted = true;
        series.UpdatedUtc = now;
        return null;
    }

    private static void SetSkippedException(RecurringTaskException exception, DateTimeOffset now)
    {
        exception.ExceptionType = RecurringTaskExceptionType.Skipped;
        exception.ReplacementTaskId = null;
        exception.Title = null;
        exception.DueDate = null;
        exception.OwnershipKind = null;
        exception.FamilyMemberId = null;
        exception.DecorativeAvatarReferenceType = null;
        exception.DecorativeAvatarReferenceId = null;
        exception.UpdatedUtc = now;
    }

    private static async Task<DateOnly?> ResolveOriginalDueDate(HomeOpsDbContext dbContext, HouseholdTask task, CancellationToken cancellationToken)
    {
        var exception = await dbContext.RecurringTaskExceptions.AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.ReplacementTaskId == task.Id, cancellationToken);
        return exception?.OriginalDueDate ?? task.DueDate;
    }

    private static Task<RecurringTaskException?> LoadExceptionForOccurrence(HomeOpsDbContext dbContext, Guid seriesId, DateOnly originalDueDate, Guid taskId, CancellationToken cancellationToken) =>
        dbContext.RecurringTaskExceptions.FirstOrDefaultAsync(exception => exception.RecurringTaskSeriesId == seriesId && (exception.OriginalDueDate == originalDueDate || exception.ReplacementTaskId == taskId), cancellationToken);

    private static async Task RemoveIncompleteOccurrences(HomeOpsDbContext dbContext, Guid seriesId, Guid? keepTaskId, DateOnly? boundary, IReadOnlyCollection<RecurringTaskException> exceptions, CancellationToken cancellationToken)
    {
        var originalDatesByReplacement = exceptions
            .Where(exception => exception.ReplacementTaskId is not null)
            .ToDictionary(exception => exception.ReplacementTaskId!.Value, exception => exception.OriginalDueDate);
        var candidates = await dbContext.HouseholdTasks
            .Where(task => task.RecurringTaskSeriesId == seriesId && !task.IsCompleted && task.Id != keepTaskId)
            .ToListAsync(cancellationToken);
        var removable = boundary is null
            ? candidates
            : candidates.Where(candidate => (originalDatesByReplacement.TryGetValue(candidate.Id, out var originalDate) ? originalDate : candidate.DueDate) >= boundary).ToList();
        dbContext.HouseholdTasks.RemoveRange(removable);
    }

    private static async Task<bool> HasCompletedOccurrenceAtOrAfter(HomeOpsDbContext dbContext, Guid seriesId, DateOnly boundary, CancellationToken cancellationToken)
    {
        var exceptions = await dbContext.RecurringTaskExceptions.AsNoTracking()
            .Where(exception => exception.RecurringTaskSeriesId == seriesId && exception.ReplacementTaskId != null)
            .ToDictionaryAsync(exception => exception.ReplacementTaskId!.Value, exception => exception.OriginalDueDate, cancellationToken);
        var completed = await dbContext.HouseholdTasks.AsNoTracking()
            .Where(task => task.RecurringTaskSeriesId == seriesId && task.IsCompleted)
            .Select(task => new { task.Id, task.DueDate })
            .ToListAsync(cancellationToken);
        return completed.Any(task => (exceptions.TryGetValue(task.Id, out var originalDate) ? originalDate : task.DueDate) >= boundary);
    }

    private static Task<bool> HasSeriesDueDateCollision(HomeOpsDbContext dbContext, Guid seriesId, DateOnly dueDate, Guid taskId, CancellationToken cancellationToken, bool completedOnly = false) =>
        dbContext.HouseholdTasks.AnyAsync(candidate => candidate.RecurringTaskSeriesId == seriesId && candidate.Id != taskId && candidate.DueDate == dueDate && (!completedOnly || candidate.IsCompleted), cancellationToken);

    private static RecurringTaskSeries NewSeries(string title, DateOnly startDate, TaskRecurrenceFrequency frequency, TaskOwnershipKind ownershipKind, string? familyMemberId, DecorativeAvatarReferenceType? avatarReferenceType, string? avatarReferenceId, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = title, StartDate = startDate, Frequency = frequency,
        OwnershipKind = ownershipKind, FamilyMemberId = familyMemberId, DecorativeAvatarReferenceType = avatarReferenceType,
        DecorativeAvatarReferenceId = avatarReferenceId, CreatedUtc = now, UpdatedUtc = now,
    };

    private static void ApplyTaskFields(HouseholdTask task, string title, DateOnly? dueDate, TaskOwnershipKind ownershipKind, string? familyMemberId, TaskRecurrenceFrequency frequency, DecorativeAvatarReferenceType? avatarReferenceType, string? avatarReferenceId, DateTimeOffset now)
    {
        task.Title = title;
        task.DueDate = dueDate;
        task.OwnershipKind = ownershipKind;
        task.FamilyMemberId = familyMemberId;
        task.RecurrenceFrequency = frequency;
        task.DecorativeAvatarReferenceType = avatarReferenceType;
        task.DecorativeAvatarReferenceId = avatarReferenceId;
        task.UpdatedUtc = now;
    }

    private static async Task GenerateRecurringTasks(HomeOpsDbContext dbContext, DateOnly today, CancellationToken cancellationToken)
    {
        var series = await dbContext.RecurringTaskSeries.Where(s => s.HouseholdId == SeedHousehold.Id && !s.IsDeleted).ToListAsync(cancellationToken);
        foreach (var item in series) await GenerateOccurrencesForSeries(dbContext, item, today, cancellationToken);
    }

    private static async Task GenerateOccurrencesForSeries(HomeOpsDbContext dbContext, RecurringTaskSeries series, DateOnly today, CancellationToken cancellationToken)
    {
        if (series.IsDeleted) return;
        var horizon = today.AddDays(GenerationHorizonDays);
        if (series.EndDate is not null && series.EndDate < horizon) horizon = series.EndDate.Value;
        var existingTasks = await dbContext.HouseholdTasks.Where(t => t.RecurringTaskSeriesId == series.Id).Select(t => new { t.Id, t.DueDate }).ToListAsync(cancellationToken);
        var localTasks = dbContext.HouseholdTasks.Local.Where(task => task.RecurringTaskSeriesId == series.Id && dbContext.Entry(task).State != EntityState.Deleted).Select(task => new { task.Id, task.DueDate });
        var allExistingTasks = existingTasks.Concat(localTasks).GroupBy(task => task.Id).Select(group => group.First()).ToList();
        var existingDates = allExistingTasks.Select(task => task.DueDate).ToList();
        var existing = existingDates.OfType<DateOnly>().ToHashSet();
        var existingIds = allExistingTasks.Select(task => task.Id).ToHashSet();
        var exceptions = await dbContext.RecurringTaskExceptions.AsNoTracking().Where(exception => exception.RecurringTaskSeriesId == series.Id).ToDictionaryAsync(exception => exception.OriginalDueDate, cancellationToken);
        for (var due = series.StartDate; due <= horizon; due = NextDueDate(due, series.Frequency))
        {
            if (exceptions.TryGetValue(due, out var exception))
            {
                if (exception.ExceptionType == RecurringTaskExceptionType.Skipped || exception.ReplacementTaskId is null || existingIds.Contains(exception.ReplacementTaskId.Value)) continue;
                var replacement = CreateTask(exception.Title!, exception.DueDate, exception.OwnershipKind!.Value, exception.FamilyMemberId, series.Id, DateTimeOffset.UtcNow);
                replacement.Id = exception.ReplacementTaskId.Value;
                replacement.RecurrenceFrequency = series.Frequency;
                replacement.DecorativeAvatarReferenceType = exception.DecorativeAvatarReferenceType;
                replacement.DecorativeAvatarReferenceId = exception.DecorativeAvatarReferenceId;
                dbContext.HouseholdTasks.Add(replacement);
                existingIds.Add(replacement.Id);
                continue;
            }
            if (existing.Contains(due)) continue;
            var task = CreateTask(series.Title, due, series.OwnershipKind, series.FamilyMemberId, series.Id, DateTimeOffset.UtcNow);
            task.RecurrenceFrequency = series.Frequency;
            task.DecorativeAvatarReferenceType = series.DecorativeAvatarReferenceType;
            task.DecorativeAvatarReferenceId = series.DecorativeAvatarReferenceId;
            dbContext.HouseholdTasks.Add(task);
        }
        await ExpireOlderIncompleteOccurrences(dbContext, series.Id, today, cancellationToken);
    }

    private static async Task ExpireOlderIncompleteOccurrences(HomeOpsDbContext dbContext, Guid seriesId, DateOnly today, CancellationToken cancellationToken)
    {
        var hasCurrentOrUpcomingOccurrence = await dbContext.HouseholdTasks
            .AnyAsync(t => t.RecurringTaskSeriesId == seriesId && t.DueDate >= today && !t.IsExpired, cancellationToken);
        if (!hasCurrentOrUpcomingOccurrence) return;

        var expiredUtc = DateTimeOffset.UtcNow;
        var staleOccurrences = await dbContext.HouseholdTasks
            .Where(t => t.RecurringTaskSeriesId == seriesId && !t.IsCompleted && !t.IsExpired && t.DueDate < today)
            .ToListAsync(cancellationToken);
        foreach (var occurrence in staleOccurrences)
        {
            occurrence.IsExpired = true;
            occurrence.UpdatedUtc = expiredUtc;
        }
    }

    private static async Task ClassifyNoDateTasks(HomeOpsDbContext dbContext, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var reviewBefore = now.AddDays(-NoDateNeedsReviewDays);
        var tasks = await dbContext.HouseholdTasks
            .Where(task => task.HouseholdId == SeedHousehold.Id && task.DueDate == null && !task.IsCompleted && !task.IsExpired && task.NoDateReviewState == NoDateTaskReviewState.Active && (task.NoDateLastReviewedUtc ?? task.CreatedUtc) <= reviewBefore)
            .ToListAsync(cancellationToken);
        foreach (var task in tasks) { task.NoDateReviewState = NoDateTaskReviewState.NeedsReview; task.UpdatedUtc = now; }
    }

    private static DateOnly NextDueDate(DateOnly date, TaskRecurrenceFrequency frequency) => frequency switch
    {
        TaskRecurrenceFrequency.Daily => date.AddDays(1),
        TaskRecurrenceFrequency.Weekly => date.AddDays(7),
        TaskRecurrenceFrequency.Monthly => date.AddMonths(1),
        _ => date.AddYears(100),
    };

    private static HouseholdTask CreateTask(string title, DateOnly? dueDate, TaskOwnershipKind ownershipKind, string? familyMemberId, Guid? seriesId, DateTimeOffset now) => new()
    { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = title, DueDate = dueDate, OwnershipKind = ownershipKind, FamilyMemberId = familyMemberId, RecurringTaskSeriesId = seriesId, RecurrenceFrequency = seriesId is null ? TaskRecurrenceFrequency.None : TaskRecurrenceFrequency.Daily, IsCompleted = false, IsExpired = false, NoDateReviewState = NoDateTaskReviewState.Active, CreatedUtc = now, UpdatedUtc = now };

    private static async Task<(string Title, TaskOwnershipKind OwnershipKind, string? FamilyMemberId, string? Error)> ValidateTaskInput(string titleInput, TaskOwnershipKind? ownership, string? member, HomeOpsDbContext dbContext, CancellationToken cancellationToken)
    {
        var title = titleInput.Trim(); if (title.Length == 0) return (title, TaskOwnershipKind.Unassigned, null, "Task title is required.");
        var kind = ownership ?? TaskOwnershipKind.Unassigned; var familyMemberId = string.IsNullOrWhiteSpace(member) ? null : member.Trim();
        if (kind != TaskOwnershipKind.FamilyMember) familyMemberId = null;
        else if (familyMemberId is null) return (title, kind, null, "Family member id is required for assigned tasks.");
        else if (!await dbContext.FamilyMembers.AnyAsync(m => m.Id == familyMemberId && m.HouseholdId == SeedHousehold.Id && !m.IsDeleted, cancellationToken)) return (title, kind, familyMemberId, "Family member id must reference an existing family member.");
        return (title, kind, familyMemberId, null);
    }

    private static Task<HouseholdTask?> LoadActiveTask(HomeOpsDbContext dbContext, Guid taskId, CancellationToken cancellationToken) =>
        dbContext.HouseholdTasks.FirstOrDefaultAsync(task => task.Id == taskId && task.HouseholdId == SeedHousehold.Id && task.NoDateReviewState != NoDateTaskReviewState.Archived, cancellationToken);

    private static Task<HouseholdTask?> LoadArchivedNormalTask(HomeOpsDbContext dbContext, Guid taskId, CancellationToken cancellationToken) =>
        dbContext.HouseholdTasks.FirstOrDefaultAsync(task => task.Id == taskId
            && task.HouseholdId == SeedHousehold.Id
            && task.NoDateReviewState == NoDateTaskReviewState.Archived
            && task.RecurringTaskSeriesId == null
            && task.RecurrenceFrequency == TaskRecurrenceFrequency.None, cancellationToken);

    private static bool IsRecurring(HouseholdTask task) =>
        task.RecurringTaskSeriesId is not null || task.RecurrenceFrequency != TaskRecurrenceFrequency.None;

    private static async Task ApplyMotivationProgress(HomeOpsDbContext dbContext, HouseholdTask task, int delta, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        if (task.OwnershipKind == TaskOwnershipKind.SharedHousehold)
        {
            var familyGoal = await dbContext.MotivationFamilyGoals.Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive).OrderBy(goal => goal.Id).FirstOrDefaultAsync(cancellationToken);
            if (familyGoal is not null)
            {
                await AppendTaskProgressEntry(dbContext, MotivationGoalType.Family, familyGoal.Id, familyGoal.CurrentProgress, task, delta, now, cancellationToken);
                familyGoal.CurrentProgress = await MotivationProgress.GetProjectedIncludingPendingAsync(dbContext, MotivationGoalType.Family, familyGoal.Id, familyGoal.TargetCount, cancellationToken);
                if (!string.IsNullOrWhiteSpace(familyGoal.CelebrationTitle) && familyGoal.CelebrationStatus != FamilyCelebrationStatus.Celebrated)
                    familyGoal.CelebrationStatus = familyGoal.CurrentProgress >= familyGoal.TargetCount ? FamilyCelebrationStatus.ReadyToCelebrate : FamilyCelebrationStatus.Planned;
            }
            return;
        }
        if (task.OwnershipKind == TaskOwnershipKind.FamilyMember && task.FamilyMemberId is not null)
        {
            var goals = await dbContext.MotivationIndividualGoals.Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive && goal.FamilyMemberId == task.FamilyMemberId).ToListAsync(cancellationToken);
            foreach (var goal in goals)
            {
                await AppendTaskProgressEntry(dbContext, MotivationGoalType.Individual, goal.Id, goal.CurrentProgress, task, delta, now, cancellationToken);
                goal.CurrentProgress = await MotivationProgress.GetProjectedIncludingPendingAsync(dbContext, MotivationGoalType.Individual, goal.Id, goal.TargetCount, cancellationToken);
            }
        }
    }

    private static async Task AppendTaskProgressEntry(
        HomeOpsDbContext dbContext,
        MotivationGoalType goalType,
        Guid goalId,
        int currentProgress,
        HouseholdTask task,
        int delta,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await MotivationProgress.EnsureBaselineAsync(dbContext, goalType, goalId, currentProgress, now, cancellationToken);
        Guid? correctionOfEntryId = null;
        if (delta < 0)
        {
            correctionOfEntryId = await dbContext.MotivationProgressLedgerEntries.AsNoTracking()
                .Where(entry => entry.HouseholdId == SeedHousehold.Id
                    && entry.GoalType == goalType
                    && entry.GoalId == goalId
                    && entry.SourceType == MotivationProgressSourceType.TaskCompletion
                    && entry.SourceId == task.Id.ToString("D"))
                .OrderByDescending(entry => entry.OccurredUtc)
                .ThenByDescending(entry => entry.Id)
                .Select(entry => (Guid?)entry.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        MotivationProgress.Append(
            dbContext,
            goalType,
            goalId,
            delta > 0 ? MotivationProgressSourceType.TaskCompletion : MotivationProgressSourceType.TaskReopen,
            task.Id.ToString("D"),
            delta,
            now,
            delta > 0 ? $"Taak voltooid: {task.Title}" : $"Taak heropend: {task.Title}",
            correctionOfEntryId);
    }
    private static HouseholdTaskDto ToDto(HouseholdTask task) => new(task.Id, task.Title, task.DueDate, task.OwnershipKind, task.FamilyMemberId, task.IsCompleted, task.CompletedUtc, task.CreatedUtc, task.UpdatedUtc, task.RecurringTaskSeriesId, task.RecurrenceFrequency, task.NoDateReviewState, task.NoDateLastReviewedUtc, task.ArchivedUtc, ToDecorativeAvatarDto(task));

    private static DecorativeAvatarReferenceDto? ToDecorativeAvatarDto(HouseholdTask task) =>
        task.DecorativeAvatarReferenceType is null || string.IsNullOrWhiteSpace(task.DecorativeAvatarReferenceId)
            ? null
            : new DecorativeAvatarReferenceDto(task.DecorativeAvatarReferenceType.Value, task.DecorativeAvatarReferenceId);

    private sealed record RecurringTaskMutationResult(HouseholdTask? Task, string? Error, bool IsConflict)
    {
        public static RecurringTaskMutationResult Success(HouseholdTask task) => new(task, null, false);
        public static RecurringTaskMutationResult BadRequest(string error) => new(null, error, false);
        public static RecurringTaskMutationResult Conflict(string error) => new(null, error, true);
    }
}
