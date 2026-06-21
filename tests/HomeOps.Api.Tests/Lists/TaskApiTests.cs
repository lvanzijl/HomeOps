using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Lists;

public sealed class TaskApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreateTaskAddsUnassignedTask()
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Take out recycling", null, null, null));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.NotNull(created);
        Assert.Equal("Take out recycling", created.Title);
        Assert.Equal(TaskOwnershipKind.Unassigned, created.OwnershipKind);
        Assert.False(created.IsCompleted);
    }

    [Fact]
    public async Task CompleteAndReopenTaskUpdatesLifecycle()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Water plants", DateOnly.FromDateTime(DateTime.UtcNow), TaskOwnershipKind.SharedHousehold, null));
        var created = await createResponse.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.NotNull(created);

        var completeResponse = await _client.PostAsync($"/api/tasks/{created.Id}/complete", null);
        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);
        var completed = await completeResponse.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.NotNull(completed);
        Assert.True(completed.IsCompleted);
        Assert.NotNull(completed.CompletedUtc);

        var reopenResponse = await _client.PostAsync($"/api/tasks/{created.Id}/reopen", null);
        Assert.Equal(HttpStatusCode.OK, reopenResponse.StatusCode);
        var reopened = await reopenResponse.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.NotNull(reopened);
        Assert.False(reopened.IsCompleted);
        Assert.Null(reopened.CompletedUtc);
    }

    [Fact]
    public async Task AssignedTaskRequiresFamilyMemberId()
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Pack lunch", null, TaskOwnershipKind.FamilyMember, null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}

public sealed class RecurringTaskApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Theory]
    [InlineData(TaskRecurrenceFrequency.Daily, 1)]
    [InlineData(TaskRecurrenceFrequency.Weekly, 7)]
    [InlineData(TaskRecurrenceFrequency.Monthly, 31)]
    public async Task CreatesRecurringTasksForSupportedFrequencies(TaskRecurrenceFrequency frequency, int expectedGapDays)
    {
        var start = new DateOnly(2026, 6, 20);
        var created = await CreateRecurringTask($"Recurring {frequency}", start, frequency, TaskOwnershipKind.Unassigned, null);

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var seriesTasks = tasks!.Where(task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId).OrderBy(task => task.DueDate).ToList();

        Assert.NotNull(created.RecurringTaskSeriesId);
        Assert.True(seriesTasks.Count >= 2);
        Assert.Equal(frequency, seriesTasks[0].RecurrenceFrequency);
        Assert.Equal(expectedGapDays, seriesTasks[1].DueDate!.Value.DayNumber - seriesTasks[0].DueDate!.Value.DayNumber);
    }

    [Fact]
    public async Task CompletingRecurringTaskKeepsSeriesAndAdvancesMotivation()
    {
        var before = await _client.GetFromJsonAsync<HomeOps.Api.Motivation.MotivationSnapshotDto>("/api/motivation");
        var created = await CreateRecurringTask("Reset shared room", new DateOnly(2026, 6, 20), TaskRecurrenceFrequency.Weekly, TaskOwnershipKind.SharedHousehold, null);

        var completeResponse = await _client.PostAsync($"/api/tasks/{created.Id}/complete", null);
        completeResponse.EnsureSuccessStatusCode();

        var after = await _client.GetFromJsonAsync<HomeOps.Api.Motivation.MotivationSnapshotDto>("/api/motivation");
        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");

        Assert.Equal(Math.Min(before!.FamilyGoal!.CurrentProgress + 1, before.FamilyGoal.TargetCount), after!.FamilyGoal!.CurrentProgress);
        Assert.Contains(tasks!, task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId && !task.IsCompleted);
    }

    [Fact]
    public async Task EditingRecurringTaskUpdatesPendingSeriesOccurrences()
    {
        var created = await CreateRecurringTask("Feed pet", new DateOnly(2026, 6, 20), TaskRecurrenceFrequency.Daily, TaskOwnershipKind.Unassigned, null);

        var update = await _client.PutAsJsonAsync($"/api/tasks/{created.Id}", new UpdateHouseholdTaskRequest("Feed fish", new DateOnly(2026, 6, 22), TaskOwnershipKind.FamilyMember, "riley", TaskRecurrenceFrequency.Weekly));
        update.EnsureSuccessStatusCode();

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var seriesTasks = tasks!.Where(task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId).OrderBy(task => task.DueDate).ToList();

        Assert.All(seriesTasks, task => Assert.Equal("Feed fish", task.Title));
        Assert.All(seriesTasks, task => Assert.Equal(TaskOwnershipKind.FamilyMember, task.OwnershipKind));
        Assert.All(seriesTasks, task => Assert.Equal("riley", task.FamilyMemberId));
        Assert.All(seriesTasks, task => Assert.Equal(TaskRecurrenceFrequency.Weekly, task.RecurrenceFrequency));
        Assert.Equal(7, seriesTasks[1].DueDate!.Value.DayNumber - seriesTasks[0].DueDate!.Value.DayNumber);
    }


    [Theory]
    [InlineData(TaskRecurrenceFrequency.Daily, 1)]
    [InlineData(TaskRecurrenceFrequency.Weekly, 7)]
    [InlineData(TaskRecurrenceFrequency.Monthly, 31)]
    public async Task RecurringHygieneExpiresOlderIncompleteOccurrences(TaskRecurrenceFrequency frequency, int daysBack)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var staleDate = today.AddDays(-daysBack);
        var title = $"Hygiene {frequency} {Guid.NewGuid()}";
        var created = await CreateRecurringTask(title, staleDate, frequency, TaskOwnershipKind.Unassigned, null);

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var seriesTasks = tasks!.Where(task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId).ToList();

        Assert.DoesNotContain(seriesTasks, task => !task.IsCompleted && task.DueDate < today);
        Assert.Contains(seriesTasks, task => !task.IsCompleted && task.DueDate >= today);
    }

    [Fact]
    public async Task RecurringHygienePreservesCompletedOccurrencesAndMotivationCompatibility()
    {
        var before = await _client.GetFromJsonAsync<HomeOps.Api.Motivation.MotivationSnapshotDto>("/api/motivation");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var created = await CreateRecurringTask($"Completed hygiene {Guid.NewGuid()}", today, TaskRecurrenceFrequency.Daily, TaskOwnershipKind.SharedHousehold, null);

        var completeResponse = await _client.PostAsync($"/api/tasks/{created.Id}/complete", null);
        completeResponse.EnsureSuccessStatusCode();

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var after = await _client.GetFromJsonAsync<HomeOps.Api.Motivation.MotivationSnapshotDto>("/api/motivation");

        Assert.Contains(tasks!, task => task.Id == created.Id && task.IsCompleted);
        Assert.Contains(tasks!, task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId && !task.IsCompleted && task.DueDate > today);
        Assert.Equal(Math.Min(before!.FamilyGoal!.CurrentProgress + 1, before.FamilyGoal.TargetCount), after!.FamilyGoal!.CurrentProgress);
    }

    [Fact]
    public async Task DeletingRecurringSeriesRemovesPendingOccurrencesOnly()
    {
        var created = await CreateRecurringTask("Change bedding", DateOnly.FromDateTime(DateTime.UtcNow), TaskRecurrenceFrequency.Monthly, TaskOwnershipKind.Unassigned, null);
        await _client.PostAsync($"/api/tasks/{created.Id}/complete", null);

        var delete = await _client.DeleteAsync($"/api/tasks/{created.Id}/series");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        Assert.Contains(tasks!, task => task.Id == created.Id && task.IsCompleted);
        Assert.DoesNotContain(tasks!, task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId && !task.IsCompleted);
    }

    private async Task<HouseholdTaskDto> CreateRecurringTask(string title, DateOnly dueDate, TaskRecurrenceFrequency frequency, TaskOwnershipKind ownershipKind, string? familyMemberId)
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest(title, dueDate, ownershipKind, familyMemberId, frequency));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
    }
}

public sealed class NoDateTaskLifecycleApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly HomeOpsWebApplicationFactory _factory = factory;

    [Fact]
    public async Task OlderNoDateTasksEnterParentReviewWithoutDisappearing()
    {
        var created = await CreateNoDateTask($"Treehouse idea {Guid.NewGuid()}");
        await AgeTask(created.Id, DateTimeOffset.UtcNow.AddDays(-21));

        var review = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks/review/no-date");
        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");

        Assert.Contains(review!, task => task.Id == created.Id && task.NoDateReviewState == NoDateTaskReviewState.NeedsReview);
        Assert.Contains(tasks!, task => task.Id == created.Id && task.NoDateReviewState == NoDateTaskReviewState.NeedsReview);
    }

    [Fact]
    public async Task ReviewActionsKeepActiveMoveSomedayCompleteAndArchive()
    {
        var active = await CreateNoDateTask($"Keep active {Guid.NewGuid()}");
        await AgeTask(active.Id, DateTimeOffset.UtcNow.AddDays(-21));
        await _client.GetAsync("/api/tasks/review/no-date");

        var keep = await _client.PostAsync($"/api/tasks/{active.Id}/keep-active", null);
        var kept = await keep.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.Equal(NoDateTaskReviewState.Active, kept!.NoDateReviewState);
        Assert.NotNull(kept.NoDateLastReviewedUtc);

        var someday = await CreateNoDateTask($"Build treehouse {Guid.NewGuid()}");
        var move = await _client.PostAsync($"/api/tasks/{someday.Id}/move-to-someday", null);
        var moved = await move.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.Equal(NoDateTaskReviewState.Someday, moved!.NoDateReviewState);

        var complete = await _client.PostAsync($"/api/tasks/{someday.Id}/complete", null);
        var completed = await complete.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.True(completed!.IsCompleted);
        Assert.Equal(NoDateTaskReviewState.Completed, completed.NoDateReviewState);

        var archive = await CreateNoDateTask($"Archive idea {Guid.NewGuid()}");
        var archiveResponse = await _client.PostAsync($"/api/tasks/{archive.Id}/archive", null);
        var archived = await archiveResponse.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        Assert.Equal(NoDateTaskReviewState.Archived, archived!.NoDateReviewState);
        Assert.DoesNotContain(tasks!, task => task.Id == archive.Id);
    }

    [Fact]
    public async Task AddDueDateReturnsTaskToActiveDatedFlow()
    {
        var task = await CreateNoDateTask($"Plan garden {Guid.NewGuid()}");
        var response = await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/add-due-date", new ReviewNoDateTaskRequest(new DateOnly(2026, 7, 1)));

        var updated = await response.Content.ReadFromJsonAsync<HouseholdTaskDto>();

        Assert.Equal(new DateOnly(2026, 7, 1), updated!.DueDate);
        Assert.Equal(NoDateTaskReviewState.Active, updated.NoDateReviewState);
    }

    private async Task<HouseholdTaskDto> CreateNoDateTask(string title)
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest(title, null, TaskOwnershipKind.Unassigned, null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
    }

    private async Task AgeTask(Guid taskId, DateTimeOffset createdUtc)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOps.Api.Data.HomeOpsDbContext>();
        var task = await dbContext.HouseholdTasks.FindAsync(taskId);
        task!.CreatedUtc = createdUtc;
        task.UpdatedUtc = createdUtc;
        await dbContext.SaveChangesAsync();
    }
}
