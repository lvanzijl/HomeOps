using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace HomeOps.Api.Motivation;

public static class MotivationEndpoints
{
    public static IEndpointRouteBuilder MapMotivationEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/motivation", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var familyGoalEntity = await dbContext.MotivationFamilyGoals.AsNoTracking()
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive)
                .OrderBy(goal => goal.Id)
                .FirstOrDefaultAsync(cancellationToken);
            var familyGoal = familyGoalEntity is null
                ? null
                : ToDto(familyGoalEntity, await MotivationProgress.GetProjectedAsync(
                    dbContext,
                    MotivationGoalType.Family,
                    familyGoalEntity.Id,
                    familyGoalEntity.TargetCount,
                    familyGoalEntity.CurrentProgress,
                    cancellationToken));

            var individualGoalEntities = await dbContext.MotivationIndividualGoals.AsNoTracking()
                .Include(goal => goal.FamilyMember)
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive && goal.FamilyMember != null && !goal.FamilyMember.IsDeleted)
                .OrderBy(goal => goal.FamilyMemberId)
                .ToListAsync(cancellationToken);
            var individualGoals = new List<MotivationIndividualGoalDto>(individualGoalEntities.Count);
            foreach (var goal in individualGoalEntities)
            {
                var progress = await MotivationProgress.GetProjectedAsync(
                    dbContext,
                    MotivationGoalType.Individual,
                    goal.Id,
                    goal.TargetCount,
                    goal.CurrentProgress,
                    cancellationToken);
                individualGoals.Add(ToIndividualGoalDto(goal, progress));
            }

            var celebrationMemories = await dbContext.MotivationFamilyGoals.AsNoTracking()
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.CelebrationStatus == FamilyCelebrationStatus.Celebrated && goal.CelebrationCelebratedUtc != null && goal.CelebrationTitle != null)
                .OrderByDescending(goal => goal.CelebrationCelebratedUtc)
                .ThenBy(goal => goal.Id)
                .Take(6)
                .Select(goal => new MotivationFamilyCelebrationMemoryDto(
                    goal.Id,
                    goal.CelebrationTitle!,
                    goal.CelebrationDescription,
                    goal.CelebrationCelebratedUtc!.Value))
                .ToListAsync(cancellationToken);

            return Results.Ok(new MotivationSnapshotDto(familyGoal, individualGoals, celebrationMemories));
        }).WithName("GetMotivationSnapshot").Produces<MotivationSnapshotDto>();

        app.MapGet("/api/motivation/goals/{goalType}/{goalId:guid}/progress", async (MotivationGoalType goalType, Guid goalId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var goal = await LoadGoalProgressState(dbContext, goalType, goalId, cancellationToken);
            if (goal is null) return Results.NotFound();
            return Results.Ok(await ToProgressLedgerDto(dbContext, goal, cancellationToken));
        }).WithName("GetMotivationProgressLedger").Produces<MotivationProgressLedgerDto>().Produces(StatusCodes.Status404NotFound);

        app.MapPost("/api/motivation/goals/{goalType}/{goalId:guid}/progress/corrections", async (MotivationGoalType goalType, Guid goalId, CreateMotivationProgressCorrectionRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var errors = new Dictionary<string, string[]>();
            if (request.Delta == 0 || request.Delta < -999 || request.Delta > 999)
                errors[nameof(request.Delta)] = ["Correction delta must be between -999 and 999 and cannot be zero."];
            if (string.IsNullOrWhiteSpace(request.Reason))
                errors[nameof(request.Reason)] = ["A correction reason is required."];
            else if (request.Reason.Length > 300)
                errors[nameof(request.Reason)] = ["Correction reason must be 300 characters or fewer."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var goal = await LoadGoalProgressState(dbContext, goalType, goalId, cancellationToken);
            if (goal is null) return Results.NotFound();

            MotivationProgressLedgerEntry? correctedEntry = null;
            if (request.CorrectionOfEntryId is not null)
            {
                correctedEntry = await dbContext.MotivationProgressLedgerEntries.AsNoTracking()
                    .FirstOrDefaultAsync(entry => entry.Id == request.CorrectionOfEntryId
                        && entry.HouseholdId == SeedHousehold.Id
                        && entry.GoalType == goalType
                        && entry.GoalId == goalId, cancellationToken);
                if (correctedEntry is null)
                    return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.CorrectionOfEntryId)] = ["Choose an entry from this goal's ledger."] });
                if (request.Delta != -correctedEntry.Delta)
                    return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Delta)] = ["A linked correction must exactly compensate the selected entry."] });
            }

            var now = DateTimeOffset.UtcNow;
            await MotivationProgress.EnsureBaselineAsync(dbContext, goalType, goalId, goal.LegacyProgress, now, cancellationToken);
            MotivationProgress.Append(
                dbContext,
                goalType,
                goalId,
                MotivationProgressSourceType.Correction,
                Guid.NewGuid().ToString("D"),
                request.Delta,
                now,
                request.Reason.Trim(),
                correctedEntry?.Id);
            var projected = await MotivationProgress.GetProjectedIncludingPendingAsync(dbContext, goalType, goalId, goal.TargetCount, cancellationToken);
            goal.SetCurrentProgress(projected);
            goal.UpdateCelebrationStatus();
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(await ToProgressLedgerDto(dbContext, goal with { LegacyProgress = projected }, cancellationToken));
        }).WithName("CreateMotivationProgressCorrection").Produces<MotivationProgressLedgerDto>().ProducesValidationProblem().Produces(StatusCodes.Status404NotFound);





        app.MapPost("/api/motivation/individual-goals", async (UpsertMotivationIndividualGoalRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = await ValidateIndividualGoalRequest(request, dbContext, cancellationToken);
            if (validation is not null) return validation;

            var member = await dbContext.FamilyMembers.AsNoTracking()
                .FirstAsync(item => item.HouseholdId == SeedHousehold.Id && item.Id == request.FamilyMemberId.Trim() && !item.IsDeleted, cancellationToken);
            await RetireOtherActiveIndividualGoals(dbContext, member.Id, null, cancellationToken);

            var goal = new MotivationIndividualGoal
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                FamilyMemberId = member.Id,
                Title = request.Title.Trim(),
                TargetCount = request.TargetCount,
                CurrentProgress = 0,
                UnitLabel = request.UnitLabel.Trim(),
                VisualKind = "stars",
                IsActive = true
            };
            dbContext.MotivationIndividualGoals.Add(goal);
            await dbContext.SaveChangesAsync(cancellationToken);
            goal.FamilyMember = member;
            return Results.Created($"/api/motivation/individual-goals/{goal.Id}", ToIndividualGoalDto(goal));
        }).WithName("CreateMotivationIndividualGoal").Produces<MotivationIndividualGoalDto>(StatusCodes.Status201Created).ProducesValidationProblem();

        app.MapPut("/api/motivation/individual-goals/{id:guid}", async (Guid id, UpsertMotivationIndividualGoalRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = await ValidateIndividualGoalRequest(request, dbContext, cancellationToken);
            if (validation is not null) return validation;

            var goal = await dbContext.MotivationIndividualGoals
                .Include(item => item.FamilyMember)
                .Where(item => item.HouseholdId == SeedHousehold.Id && item.Id == id && item.IsActive)
                .FirstOrDefaultAsync(cancellationToken);
            if (goal is null) return Results.NotFound();

            var newFamilyMemberId = request.FamilyMemberId.Trim();
            await RetireOtherActiveIndividualGoals(dbContext, newFamilyMemberId, goal.Id, cancellationToken);

            goal.FamilyMemberId = newFamilyMemberId;
            goal.Title = request.Title.Trim();
            goal.TargetCount = request.TargetCount;
            goal.CurrentProgress = await MotivationProgress.GetProjectedAsync(dbContext, MotivationGoalType.Individual, goal.Id, goal.TargetCount, goal.CurrentProgress, cancellationToken);
            goal.UnitLabel = request.UnitLabel.Trim();
            await dbContext.SaveChangesAsync(cancellationToken);
            await dbContext.Entry(goal).Reference(item => item.FamilyMember).LoadAsync(cancellationToken);
            return Results.Ok(ToIndividualGoalDto(goal));
        }).WithName("UpdateMotivationIndividualGoal").Produces<MotivationIndividualGoalDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        app.MapPost("/api/motivation/individual-goals/{id:guid}/archive", async (Guid id, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var goal = await dbContext.MotivationIndividualGoals
                .Where(item => item.HouseholdId == SeedHousehold.Id && item.Id == id && item.IsActive)
                .FirstOrDefaultAsync(cancellationToken);
            if (goal is null) return Results.NotFound();
            goal.IsActive = false;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("ArchiveMotivationIndividualGoal").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        app.MapPost("/api/motivation/family-goals", async (UpsertMotivationFamilyGoalRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = ValidateFamilyGoalRequest(request);
            if (validation is not null) return validation;

            var existingActiveGoals = await dbContext.MotivationFamilyGoals
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive)
                .ToListAsync(cancellationToken);
            foreach (var existingGoal in existingActiveGoals)
            {
                existingGoal.IsActive = false;
            }

            var goal = new MotivationFamilyGoal
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                Title = request.Title.Trim(),
                TargetCount = request.TargetCount,
                CurrentProgress = 0,
                UnitLabel = request.UnitLabel.Trim(),
                CelebrationTitle = NormalizeOptionalLabel(request.CelebrationTitle),
                CelebrationDescription = NormalizeOptionalLabel(request.CelebrationDescription),
                CelebrationStatus = FamilyCelebrationStatus.Planned,
                IsActive = true
            };
            dbContext.MotivationFamilyGoals.Add(goal);
            await dbContext.SaveChangesAsync(cancellationToken);

            var dto = ToDto(goal);
            return Results.Created($"/api/motivation/family-goals/{goal.Id}", dto);
        }).WithName("CreateMotivationFamilyGoal").Produces<MotivationFamilyGoalDto>(StatusCodes.Status201Created).ProducesValidationProblem();

        app.MapPut("/api/motivation/family-goals/{id:guid}", async (Guid id, UpsertMotivationFamilyGoalRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = ValidateFamilyGoalRequest(request);
            if (validation is not null) return validation;

            var goal = await dbContext.MotivationFamilyGoals
                .Where(item => item.HouseholdId == SeedHousehold.Id && item.Id == id && item.IsActive)
                .FirstOrDefaultAsync(cancellationToken);
            if (goal is null) return Results.NotFound();

            await RetireOtherActiveFamilyGoals(dbContext, goal.Id, cancellationToken);

            goal.Title = request.Title.Trim();
            goal.TargetCount = request.TargetCount;
            goal.CurrentProgress = await MotivationProgress.GetProjectedAsync(dbContext, MotivationGoalType.Family, goal.Id, goal.TargetCount, goal.CurrentProgress, cancellationToken);
            goal.UnitLabel = request.UnitLabel.Trim();
            goal.CelebrationTitle = NormalizeOptionalLabel(request.CelebrationTitle);
            goal.CelebrationDescription = NormalizeOptionalLabel(request.CelebrationDescription);
            if (goal.CelebrationTitle is null)
            {
                goal.CelebrationDescription = null;
                goal.CelebrationStatus = FamilyCelebrationStatus.Planned;
            }
            else if (goal.CelebrationStatus != FamilyCelebrationStatus.Celebrated)
            {
                goal.CelebrationStatus = goal.CurrentProgress >= goal.TargetCount ? FamilyCelebrationStatus.ReadyToCelebrate : FamilyCelebrationStatus.Planned;
            }
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToDto(goal));
        }).WithName("UpdateMotivationFamilyGoal").Produces<MotivationFamilyGoalDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        app.MapPost("/api/motivation/family-goals/{id:guid}/celebration/celebrated", async (Guid id, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var goal = await dbContext.MotivationFamilyGoals
                .Where(item => item.HouseholdId == SeedHousehold.Id && item.Id == id && item.IsActive)
                .FirstOrDefaultAsync(cancellationToken);
            if (goal is null) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(goal.CelebrationTitle) || goal.CurrentProgress < goal.TargetCount)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["Celebration"] = ["The family celebration is not ready yet."] });
            }

            goal.CelebrationStatus = FamilyCelebrationStatus.Celebrated;
            goal.CelebrationCelebratedUtc ??= DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(goal));
        }).WithName("MarkFamilyGoalCelebrated").Produces<MotivationFamilyGoalDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        return app;
    }

    private static async Task RetireOtherActiveFamilyGoals(HomeOpsDbContext dbContext, Guid keepGoalId, CancellationToken cancellationToken)
    {
        var activeGoals = await dbContext.MotivationFamilyGoals
            .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive && goal.Id != keepGoalId)
            .ToListAsync(cancellationToken);
        foreach (var activeGoal in activeGoals)
        {
            activeGoal.IsActive = false;
        }
    }

    private static async Task RetireOtherActiveIndividualGoals(HomeOpsDbContext dbContext, string familyMemberId, Guid? keepGoalId, CancellationToken cancellationToken)
    {
        var activeGoals = await dbContext.MotivationIndividualGoals
            .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.FamilyMemberId == familyMemberId && goal.IsActive && (keepGoalId == null || goal.Id != keepGoalId.Value))
            .ToListAsync(cancellationToken);
        foreach (var activeGoal in activeGoals)
        {
            activeGoal.IsActive = false;
        }
    }

    private static MotivationIndividualGoalDto ToIndividualGoalDto(MotivationIndividualGoal goal, int? currentProgress = null) =>
        new(goal.Id, goal.FamilyMemberId, goal.FamilyMember?.Name ?? string.Empty, goal.Title, goal.TargetCount, currentProgress ?? goal.CurrentProgress, goal.UnitLabel, goal.VisualKind);

    private static async Task<IResult?> ValidateIndividualGoalRequest(UpsertMotivationIndividualGoalRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.FamilyMemberId)) errors[nameof(request.FamilyMemberId)] = ["Choose who this goal is for."];
        if (string.IsNullOrWhiteSpace(request.Title)) errors[nameof(request.Title)] = ["Goal title is required."];
        if (request.Title?.Length > 240) errors[nameof(request.Title)] = ["Goal title must be 240 characters or fewer."];
        if (request.TargetCount < 1) errors[nameof(request.TargetCount)] = ["Target count must be at least 1."];
        if (request.TargetCount > 99) errors[nameof(request.TargetCount)] = ["Target count must be 99 or fewer."];
        if (string.IsNullOrWhiteSpace(request.UnitLabel)) errors[nameof(request.UnitLabel)] = ["Unit label is required."];
        if (request.UnitLabel?.Length > 80) errors[nameof(request.UnitLabel)] = ["Unit label must be 80 characters or fewer."];
        if (!string.IsNullOrWhiteSpace(request.FamilyMemberId))
        {
            var exists = await dbContext.FamilyMembers.AsNoTracking().AnyAsync(item => item.HouseholdId == SeedHousehold.Id && item.Id == request.FamilyMemberId.Trim() && !item.IsDeleted, cancellationToken);
            if (!exists) errors[nameof(request.FamilyMemberId)] = ["Choose an active family member."];
        }
        return errors.Count == 0 ? null : Results.ValidationProblem(errors);
    }

    private static MotivationFamilyGoalDto ToDto(MotivationFamilyGoal goal, int? currentProgress = null) =>
        new(goal.Id, goal.Title, goal.TargetCount, currentProgress ?? goal.CurrentProgress, goal.UnitLabel, ToCelebrationDto(goal));

    private static async Task<GoalProgressState?> LoadGoalProgressState(HomeOpsDbContext dbContext, MotivationGoalType goalType, Guid goalId, CancellationToken cancellationToken)
    {
        if (goalType == MotivationGoalType.Family)
        {
            var goal = await dbContext.MotivationFamilyGoals.FirstOrDefaultAsync(item => item.Id == goalId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
            return goal is null ? null : new GoalProgressState(goalType, goal.Id, goal.TargetCount, goal.CurrentProgress, goal.UnitLabel, goal, null);
        }

        var individualGoal = await dbContext.MotivationIndividualGoals.FirstOrDefaultAsync(item => item.Id == goalId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
        return individualGoal is null ? null : new GoalProgressState(goalType, individualGoal.Id, individualGoal.TargetCount, individualGoal.CurrentProgress, individualGoal.UnitLabel, null, individualGoal);
    }

    private static async Task<MotivationProgressLedgerDto> ToProgressLedgerDto(HomeOpsDbContext dbContext, GoalProgressState goal, CancellationToken cancellationToken)
    {
        var currentProgress = await MotivationProgress.GetProjectedAsync(dbContext, goal.GoalType, goal.GoalId, goal.TargetCount, goal.LegacyProgress, cancellationToken);
        var entries = await dbContext.MotivationProgressLedgerEntries.AsNoTracking()
            .Where(entry => entry.HouseholdId == SeedHousehold.Id && entry.GoalType == goal.GoalType && entry.GoalId == goal.GoalId)
            .OrderByDescending(entry => entry.OccurredUtc)
            .ThenByDescending(entry => entry.Id)
            .Select(entry => new MotivationProgressLedgerEntryDto(entry.Id, entry.SourceType, entry.SourceId, entry.Delta, entry.OccurredUtc, entry.Reason, entry.CorrectionOfEntryId))
            .ToListAsync(cancellationToken);
        return new MotivationProgressLedgerDto(goal.GoalType, goal.GoalId, currentProgress, goal.TargetCount, goal.UnitLabel, entries);
    }

    private sealed record GoalProgressState(
        MotivationGoalType GoalType,
        Guid GoalId,
        int TargetCount,
        int LegacyProgress,
        string UnitLabel,
        MotivationFamilyGoal? FamilyGoal,
        MotivationIndividualGoal? IndividualGoal)
    {
        public void SetCurrentProgress(int progress)
        {
            if (FamilyGoal is not null) FamilyGoal.CurrentProgress = progress;
            if (IndividualGoal is not null) IndividualGoal.CurrentProgress = progress;
        }

        public void UpdateCelebrationStatus()
        {
            if (FamilyGoal is null || string.IsNullOrWhiteSpace(FamilyGoal.CelebrationTitle) || FamilyGoal.CelebrationStatus == FamilyCelebrationStatus.Celebrated) return;
            FamilyGoal.CelebrationStatus = FamilyGoal.CurrentProgress >= FamilyGoal.TargetCount
                ? FamilyCelebrationStatus.ReadyToCelebrate
                : FamilyCelebrationStatus.Planned;
        }
    }

    private static MotivationFamilyCelebrationDto? ToCelebrationDto(MotivationFamilyGoal goal)
    {
        var title = NormalizeOptionalLabel(goal.CelebrationTitle);
        return title is null ? null : new MotivationFamilyCelebrationDto(title, NormalizeOptionalLabel(goal.CelebrationDescription), goal.CelebrationStatus, goal.CelebrationCelebratedUtc);
    }

    private static string? NormalizeOptionalLabel(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static IResult? ValidateFamilyGoalRequest(UpsertMotivationFamilyGoalRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors[nameof(request.Title)] = ["Title is required."];
        if (request.Title?.Length > 240) errors[nameof(request.Title)] = ["Title must be 240 characters or fewer."];
        if (request.TargetCount < 1) errors[nameof(request.TargetCount)] = ["Target count must be at least 1."];
        if (request.TargetCount > 999) errors[nameof(request.TargetCount)] = ["Target count must be 999 or fewer."];
        if (string.IsNullOrWhiteSpace(request.UnitLabel)) errors[nameof(request.UnitLabel)] = ["Unit label is required."];
        if (request.UnitLabel?.Length > 80) errors[nameof(request.UnitLabel)] = ["Unit label must be 80 characters or fewer."];
        if (request.CelebrationTitle?.Length > 240) errors[nameof(request.CelebrationTitle)] = ["Celebration title must be 240 characters or fewer."];
        if (request.CelebrationDescription?.Length > 500) errors[nameof(request.CelebrationDescription)] = ["Celebration description must be 500 characters or fewer."];
        return errors.Count == 0 ? null : Results.ValidationProblem(errors);
    }
}
