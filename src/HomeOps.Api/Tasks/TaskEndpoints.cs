using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tasks;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        group.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var tasks = await dbContext.HouseholdTasks
                .AsNoTracking()
                .Where(task => task.HouseholdId == SeedHousehold.Id)
                .OrderBy(task => task.IsCompleted)
                .ThenBy(task => task.DueDate == null)
                .ThenBy(task => task.DueDate)
                .ThenBy(task => task.CreatedUtc)
                .Select(task => ToDto(task))
                .ToListAsync(cancellationToken);

            return Results.Ok(tasks);
        }).WithName("GetTasks").Produces<IReadOnlyCollection<HouseholdTaskDto>>();

        group.MapPost("/", async (CreateHouseholdTaskRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var title = request.Title.Trim();
            if (title.Length == 0)
            {
                return Results.BadRequest(new { error = "Task title is required." });
            }

            var ownershipKind = request.OwnershipKind ?? TaskOwnershipKind.Unassigned;
            var familyMemberId = string.IsNullOrWhiteSpace(request.FamilyMemberId) ? null : request.FamilyMemberId.Trim();
            if (ownershipKind != TaskOwnershipKind.FamilyMember)
            {
                familyMemberId = null;
            }
            else if (familyMemberId is null)
            {
                return Results.BadRequest(new { error = "Family member id is required for assigned tasks." });
            }
            else if (!await dbContext.FamilyMembers.AnyAsync(member => member.Id == familyMemberId && member.HouseholdId == SeedHousehold.Id, cancellationToken))
            {
                return Results.BadRequest(new { error = "Family member id must reference an existing family member." });
            }

            var now = DateTimeOffset.UtcNow;
            var task = new HouseholdTask
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                Title = title,
                DueDate = request.DueDate,
                OwnershipKind = ownershipKind,
                FamilyMemberId = familyMemberId,
                IsCompleted = false,
                CreatedUtc = now,
                UpdatedUtc = now,
            };

            dbContext.HouseholdTasks.Add(task);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/tasks/{task.Id}", ToDto(task));
        }).WithName("CreateTask").Produces<HouseholdTaskDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest);

        group.MapPost("/{taskId:guid}/complete", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken);
            if (task is null) return Results.NotFound();
            var wasCompleted = task.IsCompleted;
            var now = DateTimeOffset.UtcNow;
            task.IsCompleted = true;
            task.CompletedUtc ??= now;
            task.UpdatedUtc = now;
            if (!wasCompleted)
            {
                await ApplyMotivationProgress(dbContext, task, 1, cancellationToken);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("CompleteTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{taskId:guid}/reopen", async (Guid taskId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var task = await LoadTask(dbContext, taskId, cancellationToken);
            if (task is null) return Results.NotFound();
            var wasCompleted = task.IsCompleted;
            task.IsCompleted = false;
            task.CompletedUtc = null;
            task.UpdatedUtc = DateTimeOffset.UtcNow;
            if (wasCompleted)
            {
                await ApplyMotivationProgress(dbContext, task, -1, cancellationToken);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(task));
        }).WithName("ReopenTask").Produces<HouseholdTaskDto>().Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static Task<HouseholdTask?> LoadTask(HomeOpsDbContext dbContext, Guid taskId, CancellationToken cancellationToken) =>
        dbContext.HouseholdTasks.FirstOrDefaultAsync(task => task.Id == taskId && task.HouseholdId == SeedHousehold.Id, cancellationToken);

    private static async Task ApplyMotivationProgress(HomeOpsDbContext dbContext, HouseholdTask task, int delta, CancellationToken cancellationToken)
    {
        if (task.OwnershipKind == TaskOwnershipKind.SharedHousehold)
        {
            var familyGoal = await dbContext.MotivationFamilyGoals
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive)
                .OrderBy(goal => goal.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (familyGoal is not null)
            {
                familyGoal.CurrentProgress = ClampProgress(familyGoal.CurrentProgress + delta, familyGoal.TargetCount);
            }
            return;
        }

        if (task.OwnershipKind == TaskOwnershipKind.FamilyMember && task.FamilyMemberId is not null)
        {
            var individualGoals = await dbContext.MotivationIndividualGoals
                .Where(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive && goal.FamilyMemberId == task.FamilyMemberId)
                .ToListAsync(cancellationToken);
            foreach (var goal in individualGoals)
            {
                goal.CurrentProgress = ClampProgress(goal.CurrentProgress + delta, goal.TargetCount);
            }
        }
    }

    private static int ClampProgress(int progress, int targetCount) => Math.Min(Math.Max(progress, 0), targetCount);

    private static HouseholdTaskDto ToDto(HouseholdTask task) => new(task.Id, task.Title, task.DueDate, task.OwnershipKind, task.FamilyMemberId, task.IsCompleted, task.CompletedUtc, task.CreatedUtc, task.UpdatedUtc);
}
