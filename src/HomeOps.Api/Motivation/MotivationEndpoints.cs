using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

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
            var familyGoal = familyGoalEntity is null ? null : ToDto(familyGoalEntity);

            var individualGoals = await dbContext.MotivationIndividualGoals.AsNoTracking()
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive && goal.FamilyMember != null && !goal.FamilyMember.IsDeleted)
                .OrderBy(goal => goal.FamilyMemberId)
                .Select(goal => new MotivationIndividualGoalDto(
                    goal.Id,
                    goal.FamilyMemberId,
                    goal.FamilyMember == null ? string.Empty : goal.FamilyMember.Name,
                    goal.Title,
                    goal.TargetCount,
                    goal.CurrentProgress,
                    goal.UnitLabel,
                    goal.VisualKind))
                .ToListAsync(cancellationToken);

            return Results.Ok(new MotivationSnapshotDto(familyGoal, individualGoals));
        }).WithName("GetMotivationSnapshot").Produces<MotivationSnapshotDto>();



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

            goal.Title = request.Title.Trim();
            goal.TargetCount = request.TargetCount;
            goal.CurrentProgress = Math.Min(goal.CurrentProgress, goal.TargetCount);
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
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(goal));
        }).WithName("MarkFamilyGoalCelebrated").Produces<MotivationFamilyGoalDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        return app;
    }

    private static MotivationFamilyGoalDto ToDto(MotivationFamilyGoal goal) =>
        new(goal.Id, goal.Title, goal.TargetCount, goal.CurrentProgress, goal.UnitLabel, ToCelebrationDto(goal));

    private static MotivationFamilyCelebrationDto? ToCelebrationDto(MotivationFamilyGoal goal)
    {
        var title = NormalizeOptionalLabel(goal.CelebrationTitle);
        return title is null ? null : new MotivationFamilyCelebrationDto(title, NormalizeOptionalLabel(goal.CelebrationDescription), goal.CelebrationStatus);
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
