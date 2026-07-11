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
            var task = await LoadTask(dbContext, taskId, cancellationToken);
            if (task is null) return Results.NotFound();
            var validation = await ValidateTaskInput(request.Title, request.OwnershipKind, request.FamilyMemberId, dbContext, cancellationToken);
            if (validation.Error is not null) return Results.BadRequest(new { error = validation.Error });
            var avatarValidation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!avatarValidation.IsValid) return Results.BadRequest(new { error = avatarValidation.Error });
            var frequency = request.RecurrenceFrequency ?? TaskRecurrenceFrequency.None;
            var now = DateTimeOffset.UtcNow;
            if (frequency == TaskRecurrenceFrequency.None)
            {
                task.Title = validation.Title; task.DueDate = request.DueDate; task.OwnershipKind = validation.OwnershipKind; task.FamilyMemberId = validation.FamilyMemberId; task.DecorativeAvatarReferenceType = avatarValidation.ReferenceType; task.DecorativeAvatarReferenceId = avatarValidation.ReferenceId; task.RecurringTaskSeriesId = null; task.RecurrenceFrequency = TaskRecurrenceFrequency.None; task.UpdatedUtc = now;
            }
            else
            {
                var series = task.RecurringTaskSeriesId is null ? null : await dbContext.RecurringTaskSeries.FirstOrDefaultAsync(s => s.Id == task.RecurringTaskSeriesId && s.HouseholdId == SeedHousehold.Id, cancellationToken);
                if (series is null)
                {
                    series = new RecurringTaskSeries { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, CreatedUtc = now };
                    dbContext.RecurringTaskSeries.Add(series);
                }
                series.Title = validation.Title; series.StartDate = request.DueDate ?? task.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow); series.Frequency = frequency; series.OwnershipKind = validation.OwnershipKind; series.FamilyMemberId = validation.FamilyMemberId; series.DecorativeAvatarReferenceType = avatarValidation.ReferenceType; series.DecorativeAvatarReferenceId = avatarValidation.ReferenceId; series.IsDeleted = false; series.UpdatedUtc = now;
                task.DecorativeAvatarReferenceType = avatarValidation.ReferenceType; task.DecorativeAvatarReferenceId = avatarValidation.ReferenceId;
                var pending = await dbContext.HouseholdTasks.Where(t => t.RecurringTaskSeriesId == series.Id && !t.IsCompleted).ToListAsync(cancellationToken);
                dbContext.HouseholdTasks.RemoveRange(pending);
                await GenerateOccurrencesForSeries(dbContext, series, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("UpdateTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{taskId:guid}/series", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken);
            if (task?.RecurringTaskSeriesId is null) return Results.NotFound();
            var series = await dbContext.RecurringTaskSeries.FirstOrDefaultAsync(s => s.Id == task.RecurringTaskSeriesId, cancellationToken);
            if (series is null) return Results.NotFound();
            series.IsDeleted = true; series.UpdatedUtc = DateTimeOffset.UtcNow;
            var incomplete = await dbContext.HouseholdTasks.Where(t => t.RecurringTaskSeriesId == series.Id && !t.IsCompleted).ToListAsync(cancellationToken);
            dbContext.HouseholdTasks.RemoveRange(incomplete);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteRecurringTaskSeries").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

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
            var task = await LoadTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var now = DateTimeOffset.UtcNow; task.NoDateReviewState = NoDateTaskReviewState.Active; task.NoDateLastReviewedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("KeepNoDateTaskActive").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/add-due-date", async (Guid taskId, ReviewNoDateTaskRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            if (request.DueDate is null) return Results.BadRequest(new { error = "Due date is required." });
            var now = DateTimeOffset.UtcNow; task.DueDate = request.DueDate; task.NoDateReviewState = NoDateTaskReviewState.Active; task.NoDateLastReviewedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("AddDueDateToNoDateTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/move-to-someday", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var now = DateTimeOffset.UtcNow; task.DueDate = null; task.NoDateReviewState = NoDateTaskReviewState.Someday; task.NoDateLastReviewedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("MoveNoDateTaskToSomeday").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/archive", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var now = DateTimeOffset.UtcNow; task.NoDateReviewState = NoDateTaskReviewState.Archived; task.ArchivedUtc = now; task.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken); return Results.Ok(ToDto(task));
        }).WithName("ArchiveTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/complete", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var wasCompleted = task.IsCompleted; var now = DateTimeOffset.UtcNow; task.IsCompleted = true; task.CompletedUtc ??= now; task.NoDateReviewState = NoDateTaskReviewState.Completed; task.UpdatedUtc = now;
            if (!wasCompleted) await ApplyMotivationProgress(dbContext, task, 1, cancellationToken);
            await GenerateRecurringTasks(dbContext, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("CompleteTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/reopen", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken); if (task is null) return Results.NotFound();
            var wasCompleted = task.IsCompleted; task.IsCompleted = false; task.CompletedUtc = null; task.NoDateReviewState = task.DueDate is null ? NoDateTaskReviewState.Active : task.NoDateReviewState; task.UpdatedUtc = DateTimeOffset.UtcNow;
            if (wasCompleted) await ApplyMotivationProgress(dbContext, task, -1, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("ReopenTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);
        return app;
    }

    private static async Task GenerateRecurringTasks(HomeOpsDbContext dbContext, DateOnly today, CancellationToken cancellationToken)
    {
        var series = await dbContext.RecurringTaskSeries.Where(s => s.HouseholdId == SeedHousehold.Id && !s.IsDeleted).ToListAsync(cancellationToken);
        foreach (var item in series) await GenerateOccurrencesForSeries(dbContext, item, today, cancellationToken);
    }

    private static async Task GenerateOccurrencesForSeries(HomeOpsDbContext dbContext, RecurringTaskSeries series, DateOnly today, CancellationToken cancellationToken)
    {
        var horizon = today.AddDays(GenerationHorizonDays);
        var existingDates = await dbContext.HouseholdTasks.Where(t => t.RecurringTaskSeriesId == series.Id).Select(t => t.DueDate).ToListAsync(cancellationToken);
        var existing = existingDates.OfType<DateOnly>().ToHashSet();
        for (var due = series.StartDate; due <= horizon; due = NextDueDate(due, series.Frequency))
        {
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

    private static Task<HouseholdTask?> LoadTask(HomeOpsDbContext dbContext, Guid taskId, CancellationToken cancellationToken) => dbContext.HouseholdTasks.FirstOrDefaultAsync(task => task.Id == taskId && task.HouseholdId == SeedHousehold.Id, cancellationToken);

    private static async Task ApplyMotivationProgress(HomeOpsDbContext dbContext, HouseholdTask task, int delta, CancellationToken cancellationToken)
    {
        if (task.OwnershipKind == TaskOwnershipKind.SharedHousehold)
        {
            var familyGoal = await dbContext.MotivationFamilyGoals.Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive).OrderBy(goal => goal.Id).FirstOrDefaultAsync(cancellationToken);
            if (familyGoal is not null)
            {
                familyGoal.CurrentProgress = ClampProgress(familyGoal.CurrentProgress + delta, familyGoal.TargetCount);
                if (!string.IsNullOrWhiteSpace(familyGoal.CelebrationTitle) && familyGoal.CelebrationStatus != FamilyCelebrationStatus.Celebrated)
                    familyGoal.CelebrationStatus = familyGoal.CurrentProgress >= familyGoal.TargetCount ? FamilyCelebrationStatus.ReadyToCelebrate : FamilyCelebrationStatus.Planned;
            }
            return;
        }
        if (task.OwnershipKind == TaskOwnershipKind.FamilyMember && task.FamilyMemberId is not null)
        {
            var goals = await dbContext.MotivationIndividualGoals.Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive && goal.FamilyMemberId == task.FamilyMemberId).ToListAsync(cancellationToken);
            foreach (var goal in goals) goal.CurrentProgress = ClampProgress(goal.CurrentProgress + delta, goal.TargetCount);
        }
    }

    private static int ClampProgress(int progress, int targetCount) => Math.Min(Math.Max(progress, 0), targetCount);
    private static HouseholdTaskDto ToDto(HouseholdTask task) => new(task.Id, task.Title, task.DueDate, task.OwnershipKind, task.FamilyMemberId, task.IsCompleted, task.CompletedUtc, task.CreatedUtc, task.UpdatedUtc, task.RecurringTaskSeriesId, task.RecurrenceFrequency, task.NoDateReviewState, task.NoDateLastReviewedUtc, task.ArchivedUtc, ToDecorativeAvatarDto(task));

    private static DecorativeAvatarReferenceDto? ToDecorativeAvatarDto(HouseholdTask task) =>
        task.DecorativeAvatarReferenceType is null || string.IsNullOrWhiteSpace(task.DecorativeAvatarReferenceId)
            ? null
            : new DecorativeAvatarReferenceDto(task.DecorativeAvatarReferenceType.Value, task.DecorativeAvatarReferenceId);
}
