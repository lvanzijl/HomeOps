using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Motivation;
using HomeOps.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.WeeklyReset;

public static class WeeklyResetEndpoints
{
    public static IEndpointRouteBuilder MapWeeklyResetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/weekly-reset").WithTags("Weekly Reset");
        group.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var now = DateTimeOffset.UtcNow; var weekStart = now.AddDays(-7); var oldActiveTaskCutoff = now.AddDays(-21); var somedayCutoff = now.AddDays(-30);
            var reviewCandidates = await dbContext.HouseholdTasks.AsNoTracking().Where(t => t.HouseholdId == SeedHousehold.Id && !t.IsCompleted && !t.IsExpired && t.NoDateReviewState != NoDateTaskReviewState.Archived)
                .Where(t => t.NoDateReviewState == NoDateTaskReviewState.NeedsReview || (t.NoDateReviewState == NoDateTaskReviewState.Active && (t.NoDateLastReviewedUtc ?? t.CreatedUtc) <= oldActiveTaskCutoff) || (t.NoDateReviewState == NoDateTaskReviewState.Someday && (t.NoDateLastReviewedUtc ?? t.UpdatedUtc) <= somedayCutoff))
                .OrderBy(t => t.NoDateReviewState == NoDateTaskReviewState.NeedsReview ? 0 : t.NoDateReviewState == NoDateTaskReviewState.Active ? 1 : 2).ThenBy(t => t.NoDateLastReviewedUtc ?? t.CreatedUtc).Take(8)
                .Select(t => new HouseholdTaskDto(t.Id, t.Title, t.DueDate, t.OwnershipKind, t.FamilyMemberId, t.IsCompleted, t.CompletedUtc, t.CreatedUtc, t.UpdatedUtc, t.RecurringTaskSeriesId, t.RecurrenceFrequency, t.NoDateReviewState, t.NoDateLastReviewedUtc, t.ArchivedUtc)).ToListAsync(cancellationToken);
            var familyGoal = await dbContext.MotivationFamilyGoals.AsNoTracking().Where(g => g.HouseholdId == SeedHousehold.Id && g.IsActive).OrderBy(g => g.Id).Select(g => ToFamilyGoalDto(g)).FirstOrDefaultAsync(cancellationToken);
            var individualGoals = await dbContext.MotivationIndividualGoals.AsNoTracking().Include(g => g.FamilyMember).Where(g => g.HouseholdId == SeedHousehold.Id && g.IsActive && g.FamilyMember != null && !g.FamilyMember.IsDeleted).OrderBy(g => g.FamilyMember!.Name).Select(g => new MotivationIndividualGoalDto(g.Id, g.FamilyMemberId, g.FamilyMember!.Name, g.Title, g.TargetCount, g.CurrentProgress, g.UnitLabel, g.VisualKind)).ToListAsync(cancellationToken);
            var duplicateNames = await dbContext.Lists.AsNoTracking().Where(l => l.HouseholdId == SeedHousehold.Id && !l.IsDeleted).GroupBy(l => l.Name.ToLower()).Where(g => g.Count() > 1).Select(g => g.Key).ToListAsync(cancellationToken);
            var shoppingCandidates = await dbContext.Lists.AsNoTracking().Where(l => l.HouseholdId == SeedHousehold.Id && !l.IsDeleted && (l.IsArchived || l.UpdatedUtc <= now.AddDays(-30) || duplicateNames.Contains(l.Name.ToLower()))).OrderByDescending(l => l.IsArchived).ThenBy(l => l.UpdatedUtc).Take(4).Select(l => new ShoppingReviewCandidateDto(l.Id, l.Name, l.IsArchived ? "Archived list to keep in history or delete later" : "Older or duplicate-looking list to glance at", l.UpdatedUtc, l.Items.Count(i => !i.IsDeleted))).ToListAsync(cancellationToken);
            var completedTaskCount = await dbContext.HouseholdTasks.AsNoTracking().CountAsync(t => t.HouseholdId == SeedHousehold.Id && t.IsCompleted && t.CompletedUtc >= weekStart, cancellationToken);
            var helpfulMoments = await dbContext.HelpfulMoments.AsNoTracking().Include(m => m.FamilyMember).Where(m => m.HouseholdId == SeedHousehold.Id && m.CreatedUtc >= weekStart && m.FamilyMember != null && !m.FamilyMember.IsDeleted).OrderByDescending(m => m.CreatedUtc).Take(5).Select(m => new HelpfulMomentDto(m.Id, m.HouseholdId.ToString(), m.FamilyMemberId, m.FamilyMember!.Name, m.FamilyMember.DisplayColor, m.FamilyMember.Initials, m.Title, m.Description, m.RecognitionTag, m.CreatedUtc)).ToListAsync(cancellationToken);
            var memories = await dbContext.MotivationFamilyGoals.AsNoTracking().Where(g => g.HouseholdId == SeedHousehold.Id && g.CelebrationStatus == FamilyCelebrationStatus.Celebrated && g.CelebrationCelebratedUtc >= weekStart && g.CelebrationCelebratedUtc != null && g.CelebrationTitle != null).OrderByDescending(g => g.CelebrationCelebratedUtc).Select(g => new MotivationFamilyCelebrationMemoryDto(g.Id, g.CelebrationTitle!, g.CelebrationDescription, g.CelebrationCelebratedUtc!.Value)).ToListAsync(cancellationToken);
            return Results.Ok(new WeeklyResetDto(reviewCandidates, familyGoal, individualGoals, shoppingCandidates, new WeeklyContributionRecapDto(completedTaskCount, helpfulMoments.Count, familyGoal, individualGoals, helpfulMoments, memories)));
        }).WithName("GetWeeklyReset").Produces<WeeklyResetDto>();
        group.MapPost("/family-goal/{id:guid}/archive", async (Guid id, HomeOpsDbContext dbContext, CancellationToken cancellationToken) => { var goal = await dbContext.MotivationFamilyGoals.FirstOrDefaultAsync(g => g.HouseholdId == SeedHousehold.Id && g.Id == id && g.IsActive, cancellationToken); if (goal is null) return Results.NotFound(); goal.IsActive = false; await dbContext.SaveChangesAsync(cancellationToken); return Results.NoContent(); }).WithName("ArchiveWeeklyResetFamilyGoal").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);
        return app;
    }
    private static MotivationFamilyGoalDto ToFamilyGoalDto(MotivationFamilyGoal goal) => new(goal.Id, goal.Title, goal.TargetCount, goal.CurrentProgress, goal.UnitLabel, string.IsNullOrWhiteSpace(goal.CelebrationTitle) ? null : new MotivationFamilyCelebrationDto(goal.CelebrationTitle, goal.CelebrationDescription, goal.CelebrationStatus, goal.CelebrationCelebratedUtc));
}
