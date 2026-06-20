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
            var familyGoal = await dbContext.MotivationFamilyGoals.AsNoTracking()
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive)
                .OrderBy(goal => goal.Id)
                .Select(goal => new MotivationFamilyGoalDto(goal.Id, goal.Title, goal.TargetCount, goal.CurrentProgress, goal.UnitLabel, goal.RewardLabel))
                .FirstOrDefaultAsync(cancellationToken);

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
                RewardLabel = NormalizeOptionalLabel(request.RewardLabel),
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
            goal.RewardLabel = NormalizeOptionalLabel(request.RewardLabel);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToDto(goal));
        }).WithName("UpdateMotivationFamilyGoal").Produces<MotivationFamilyGoalDto>().Produces(StatusCodes.Status404NotFound).ProducesValidationProblem();

        return app;
    }

    private static MotivationFamilyGoalDto ToDto(MotivationFamilyGoal goal) =>
        new(goal.Id, goal.Title, goal.TargetCount, goal.CurrentProgress, goal.UnitLabel, goal.RewardLabel);

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
        if (request.RewardLabel?.Length > 240) errors[nameof(request.RewardLabel)] = ["Reward label must be 240 characters or fewer."];
        return errors.Count == 0 ? null : Results.ValidationProblem(errors);
    }
}
