using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Motivation;
using HomeOps.Api.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Lists;

public sealed class MotivationApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetMotivationSnapshotReturnsSeededFamilyAndIndividualGoals()
    {
        var snapshot = await _client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");

        Assert.NotNull(snapshot);
        Assert.NotNull(snapshot.FamilyGoal);
        Assert.Equal("Fill the family helper path", snapshot.FamilyGoal.Title);
        Assert.Equal(13, snapshot.FamilyGoal.CurrentProgress);
        Assert.Contains(snapshot.IndividualGoals, goal => goal.FamilyMemberId == "alex" && goal.FamilyMemberName == "Alex");
        Assert.Contains(snapshot.IndividualGoals, goal => goal.FamilyMemberId == "jordan" && goal.VisualKind == "stars");
    }

    [Fact]
    public async Task MotivationRecordsArePersistedInSeededDatabase()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();

        Assert.Contains(dbContext.MotivationFamilyGoals, goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive);
        Assert.Contains(dbContext.MotivationIndividualGoals, goal => goal.HouseholdId == SeedHousehold.Id && goal.FamilyMemberId == "riley");
    }

    [Fact]
    public async Task GetMotivationSnapshotReturnsNeutralResponseWhenNoRecordsExist()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        using (var scope = isolatedFactory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.MotivationFamilyGoals.RemoveRange(dbContext.MotivationFamilyGoals);
            dbContext.MotivationIndividualGoals.RemoveRange(dbContext.MotivationIndividualGoals);
            await dbContext.SaveChangesAsync();
        }

        var snapshot = await isolatedFactory.CreateClient().GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");

        Assert.NotNull(snapshot);
        Assert.Null(snapshot.FamilyGoal);
        Assert.Empty(snapshot.IndividualGoals);
    }

    [Fact]
    public async Task CompletingSharedHouseholdTaskAdvancesFamilyGoalAndMotivationApi()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        var before = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        var task = await CreateTask(client, "Reset table", TaskOwnershipKind.SharedHousehold, null);

        await client.PostAsync($"/api/tasks/{task.Id}/complete", null);

        var after = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        Assert.NotNull(before?.FamilyGoal);
        Assert.NotNull(after?.FamilyGoal);
        Assert.Equal(Math.Min(before.FamilyGoal.CurrentProgress + 1, before.FamilyGoal.TargetCount), after.FamilyGoal.CurrentProgress);
    }

    [Fact]
    public async Task ReopeningSharedHouseholdTaskReversesFamilyGoalProgress()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        var task = await CreateTask(client, "Sweep kitchen", TaskOwnershipKind.SharedHousehold, null);
        await client.PostAsync($"/api/tasks/{task.Id}/complete", null);
        var completed = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");

        await client.PostAsync($"/api/tasks/{task.Id}/reopen", null);

        var reopened = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        Assert.NotNull(completed?.FamilyGoal);
        Assert.NotNull(reopened?.FamilyGoal);
        Assert.Equal(completed.FamilyGoal.CurrentProgress - 1, reopened.FamilyGoal.CurrentProgress);
    }

    [Fact]
    public async Task CompletingAssignedTaskAdvancesMatchingIndividualGoalOnly()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        var before = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        var task = await CreateTask(client, "Pack backpack", TaskOwnershipKind.FamilyMember, "riley");

        await client.PostAsync($"/api/tasks/{task.Id}/complete", null);

        var after = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        var beforeRiley = Assert.Single(before!.IndividualGoals, goal => goal.FamilyMemberId == "riley");
        var afterRiley = Assert.Single(after!.IndividualGoals, goal => goal.FamilyMemberId == "riley");
        var afterAlex = Assert.Single(after.IndividualGoals, goal => goal.FamilyMemberId == "alex");
        var beforeAlex = Assert.Single(before.IndividualGoals, goal => goal.FamilyMemberId == "alex");
        Assert.Equal(Math.Min(beforeRiley.CurrentProgress + 1, beforeRiley.TargetCount), afterRiley.CurrentProgress);
        Assert.Equal(beforeAlex.CurrentProgress, afterAlex.CurrentProgress);
    }

    [Fact]
    public async Task ReopeningAssignedTaskReversesMatchingIndividualGoalProgress()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        var task = await CreateTask(client, "Practice spelling", TaskOwnershipKind.FamilyMember, "riley");
        await client.PostAsync($"/api/tasks/{task.Id}/complete", null);
        var completed = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");

        await client.PostAsync($"/api/tasks/{task.Id}/reopen", null);

        var reopened = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        var completedRiley = Assert.Single(completed!.IndividualGoals, goal => goal.FamilyMemberId == "riley");
        var reopenedRiley = Assert.Single(reopened!.IndividualGoals, goal => goal.FamilyMemberId == "riley");
        Assert.Equal(completedRiley.CurrentProgress - 1, reopenedRiley.CurrentProgress);
    }

    [Fact]
    public async Task MotivationProgressIsCappedAtTarget()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        using (var scope = isolatedFactory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var familyGoal = dbContext.MotivationFamilyGoals.Single(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive);
            familyGoal.CurrentProgress = familyGoal.TargetCount;
            await dbContext.SaveChangesAsync();
        }
        var task = await CreateTask(client, "Clean hallway", TaskOwnershipKind.SharedHousehold, null);

        await client.PostAsync($"/api/tasks/{task.Id}/complete", null);

        var after = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        Assert.NotNull(after?.FamilyGoal);
        Assert.Equal(after.FamilyGoal.TargetCount, after.FamilyGoal.CurrentProgress);
    }

    [Fact]
    public async Task GoalCompletionMovesFamilyCelebrationToReadyAndParentCanMarkCelebrated()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        using (var scope = isolatedFactory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var familyGoal = dbContext.MotivationFamilyGoals.Single(goal => goal.HouseholdId == SeedHousehold.Id && goal.IsActive);
            familyGoal.CurrentProgress = familyGoal.TargetCount - 1;
            familyGoal.CelebrationTitle = "Movie night";
            familyGoal.CelebrationStatus = FamilyCelebrationStatus.Planned;
            await dbContext.SaveChangesAsync();
        }

        var task = await CreateTask(client, "Final helper step", TaskOwnershipKind.SharedHousehold, null);
        await client.PostAsync($"/api/tasks/{task.Id}/complete", null);

        var ready = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        Assert.Equal(FamilyCelebrationStatus.ReadyToCelebrate, ready?.FamilyGoal?.Celebration?.Status);

        var response = await client.PostAsync($"/api/motivation/family-goals/{ready!.FamilyGoal!.Id}/celebration/celebrated", null);

        response.EnsureSuccessStatusCode();
        var celebrated = await response.Content.ReadFromJsonAsync<MotivationFamilyGoalDto>();
        Assert.Equal(FamilyCelebrationStatus.Celebrated, celebrated?.Celebration?.Status);
    }

    private static async Task<HouseholdTaskDto> CreateTask(HttpClient client, string title, TaskOwnershipKind ownershipKind, string? familyMemberId)
    {
        var response = await client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest(title, null, ownershipKind, familyMemberId));
        response.EnsureSuccessStatusCode();
        var task = await response.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.NotNull(task);
        return task;
    }


    [Fact]
    public async Task CreateFamilyGoalCreatesFirstActiveFamilyGoal()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        using (var scope = isolatedFactory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.MotivationFamilyGoals.RemoveRange(dbContext.MotivationFamilyGoals);
            await dbContext.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync("/api/motivation/family-goals", new UpsertMotivationFamilyGoalRequest(
            "Complete 10 helpful household tasks",
            10,
            "helpful tasks",
            "Movie night together",
            "Pick a movie as a family."));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<MotivationFamilyGoalDto>();
        Assert.NotNull(created);
        Assert.Equal("Complete 10 helpful household tasks", created.Title);
        Assert.Equal(0, created.CurrentProgress);
        Assert.NotNull(created.Celebration);
        Assert.Equal("Movie night together", created.Celebration.Title);
        Assert.Equal("Pick a movie as a family.", created.Celebration.Description);
        Assert.Equal(FamilyCelebrationStatus.Planned, created.Celebration.Status);
        var snapshot = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        Assert.Equal(created.Id, snapshot?.FamilyGoal?.Id);
    }

    [Fact]
    public async Task EditActiveFamilyGoalPreservesAndCapsProgress()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        var before = await client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        Assert.NotNull(before?.FamilyGoal);

        var response = await client.PutAsJsonAsync($"/api/motivation/family-goals/{before.FamilyGoal.Id}", new UpsertMotivationFamilyGoalRequest(
            "Complete 5 helpful household tasks",
            5,
            "helpful tasks",
            null,
            null));

        response.EnsureSuccessStatusCode();
        var updated = await response.Content.ReadFromJsonAsync<MotivationFamilyGoalDto>();
        Assert.NotNull(updated);
        Assert.Equal("Complete 5 helpful household tasks", updated.Title);
        Assert.Equal(5, updated.TargetCount);
        Assert.Equal(5, updated.CurrentProgress);
        Assert.Null(updated.Celebration);
    }

    [Fact]
    public async Task FamilyGoalCreationRejectsRewardEconomyFieldsByIgnoringUnknownJson()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/motivation/family-goals", new
        {
            title = "Finish weekend reset together",
            targetCount = 4,
            unitLabel = "helpful tasks",
            celebrationTitle = "Pancake breakfast",
            celebrationDescription = "Cook together on Sunday",
            gems = 10,
            tokens = 3,
            coins = 4,
            points = 50,
            shop = "Prize shelf",
            negativePoints = true
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<MotivationFamilyGoalDto>();
        Assert.NotNull(created);
        Assert.NotNull(created.Celebration);
        Assert.Equal("Pancake breakfast", created.Celebration.Title);
        Assert.Equal("Cook together on Sunday", created.Celebration.Description);
    }
}
