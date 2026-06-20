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
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive)
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

        return app;
    }
}
