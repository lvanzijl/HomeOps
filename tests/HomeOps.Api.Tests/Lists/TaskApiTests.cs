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

public sealed class TaskDecorativeAvatarApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly HomeOpsWebApplicationFactory _factory = factory;

    [Fact]
    public async Task CreateUpdateAndClearTaskDecorativeAvatarIndependentlyFromAssignment()
    {
        var known = await CreateKnownPerson($"Grandma Task {Guid.NewGuid()}");
        var create = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest(
            "Buy birthday present",
            DateOnly.FromDateTime(DateTime.UtcNow),
            TaskOwnershipKind.FamilyMember,
            "riley",
            TaskRecurrenceFrequency.None,
            new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.KnownPerson, known.Id.ToString())));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = (await create.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
        Assert.Equal("riley", created.FamilyMemberId);
        Assert.Equal(TaskOwnershipKind.FamilyMember, created.OwnershipKind);
        Assert.Equal(HomeOps.Api.Lists.DecorativeAvatarReferenceType.KnownPerson, created.DecorativeAvatar?.ReferenceType);
        Assert.Equal(known.Id.ToString(), created.DecorativeAvatar?.ReferenceId);

        var update = await _client.PutAsJsonAsync($"/api/tasks/{created.Id}", new UpdateHouseholdTaskRequest(
            created.Title,
            created.DueDate,
            created.OwnershipKind,
            created.FamilyMemberId,
            TaskRecurrenceFrequency.None,
            new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, "alex")));
        update.EnsureSuccessStatusCode();
        var updated = (await update.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
        Assert.Equal("riley", updated.FamilyMemberId);
        Assert.Equal("alex", updated.DecorativeAvatar?.ReferenceId);

        var clear = await _client.PutAsJsonAsync($"/api/tasks/{created.Id}", new UpdateHouseholdTaskRequest(created.Title, created.DueDate, created.OwnershipKind, created.FamilyMemberId, TaskRecurrenceFrequency.None, null));
        clear.EnsureSuccessStatusCode();
        var cleared = (await clear.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
        Assert.Equal("riley", cleared.FamilyMemberId);
        Assert.Null(cleared.DecorativeAvatar);
    }

    [Fact]
    public async Task TaskDecorativeAvatarRejectsInvalidNullablePair()
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new { title = "Bad pair", ownershipKind = "Unassigned", familyMemberId = (string?)null, recurrenceFrequency = "None", decorativeAvatar = new { referenceType = "FamilyMember" } });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeletingKnownPersonClearsTaskDecorativeAvatarOnly()
    {
        var known = await CreateKnownPerson($"Delete Task Decoration {Guid.NewGuid()}");
        var create = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Decorated task", null, TaskOwnershipKind.FamilyMember, "riley", TaskRecurrenceFrequency.None, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.KnownPerson, known.Id.ToString())));
        var created = (await create.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
        var recurring = await CreateRecurringTask($"Decorated recurring {Guid.NewGuid()}", TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.KnownPerson, known.Id.ToString()));

        var delete = await _client.DeleteAsync($"/api/known-people/{known.Id}");
        delete.EnsureSuccessStatusCode();
        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var reloaded = tasks!.Single(task => task.Id == created.Id);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOps.Api.Data.HomeOpsDbContext>();
        var series = await dbContext.RecurringTaskSeries.FindAsync(recurring.RecurringTaskSeriesId);

        Assert.Equal("Decorated task", reloaded.Title);
        Assert.Equal("riley", reloaded.FamilyMemberId);
        Assert.Null(reloaded.DecorativeAvatar);
        Assert.Null(series!.DecorativeAvatarReferenceType);
        Assert.Null(series.DecorativeAvatarReferenceId);
    }



    [Fact]
    public async Task CreateRecurringSeriesCanOmitDecorativeAvatar()
    {
        var created = await CreateRecurringTask($"No decoration recurrence {Guid.NewGuid()}", TaskRecurrenceFrequency.Weekly, null);
        Assert.NotNull(created.RecurringTaskSeriesId);
        Assert.Null(created.DecorativeAvatar);
    }

    [Fact]
    public async Task CreateRecurringSeriesWithFamilyMemberDecorativeAvatarPropagatesToGeneratedOccurrences()
    {
        var created = await CreateRecurringTask($"Riley recurring decoration {Guid.NewGuid()}", TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, "riley"));

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var seriesTasks = tasks!.Where(task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId).ToList();

        Assert.NotNull(created.RecurringTaskSeriesId);
        Assert.True(seriesTasks.Count >= 2);
        Assert.All(seriesTasks, task =>
        {
            Assert.Equal(TaskRecurrenceFrequency.Weekly, task.RecurrenceFrequency);
            Assert.Equal(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, task.DecorativeAvatar?.ReferenceType);
            Assert.Equal("riley", task.DecorativeAvatar?.ReferenceId);
        });
    }

    [Fact]
    public async Task CreateRecurringSeriesWithKnownPersonDecorativeAvatarPersistsSeriesReference()
    {
        var known = await CreateKnownPerson($"Recurring Grandma {Guid.NewGuid()}");
        var created = await CreateRecurringTask($"Known recurring decoration {Guid.NewGuid()}", TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.KnownPerson, known.Id.ToString()));

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOps.Api.Data.HomeOpsDbContext>();
        var series = await dbContext.RecurringTaskSeries.FindAsync(created.RecurringTaskSeriesId);

        Assert.Equal(HomeOps.Api.Lists.DecorativeAvatarReferenceType.KnownPerson, series!.DecorativeAvatarReferenceType);
        Assert.Equal(known.Id.ToString(), series.DecorativeAvatarReferenceId);
    }

    [Fact]
    public async Task UpdatingRecurringSeriesChangesAndClearsDecorationForRegeneratedOccurrences()
    {
        var known = await CreateKnownPerson($"Series Update Grandma {Guid.NewGuid()}");
        var created = await CreateRecurringTask($"Update recurring decoration {Guid.NewGuid()}", TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.KnownPerson, known.Id.ToString()));

        var update = await _client.PutAsJsonAsync($"/api/tasks/{created.Id}", new UpdateHouseholdTaskRequest(created.Title, created.DueDate, created.OwnershipKind, created.FamilyMemberId, TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, "alex")));
        update.EnsureSuccessStatusCode();
        var afterUpdate = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var updatedSeriesTasks = afterUpdate!.Where(task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId).ToList();
        Assert.All(updatedSeriesTasks, task => Assert.Equal("alex", task.DecorativeAvatar?.ReferenceId));
        Assert.All(updatedSeriesTasks, task => Assert.Equal(TaskRecurrenceFrequency.Weekly, task.RecurrenceFrequency));

        var first = updatedSeriesTasks.OrderBy(task => task.DueDate).First();
        var clear = await _client.PutAsJsonAsync($"/api/tasks/{first.Id}", new UpdateHouseholdTaskRequest(first.Title, first.DueDate, first.OwnershipKind, first.FamilyMemberId, TaskRecurrenceFrequency.Weekly, null));
        clear.EnsureSuccessStatusCode();
        var afterClear = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var clearedSeriesTasks = afterClear!.Where(task => task.RecurringTaskSeriesId == created.RecurringTaskSeriesId).ToList();

        Assert.All(clearedSeriesTasks, task => Assert.Null(task.DecorativeAvatar));
        Assert.All(clearedSeriesTasks, task => Assert.Equal(TaskRecurrenceFrequency.Weekly, task.RecurrenceFrequency));
    }

    [Fact]
    public async Task RecurringDecorativeAvatarRejectsInvalidReferences()
    {
        var known = await CreateKnownPerson($"Recurring Mismatch {Guid.NewGuid()}");
        await AssertBadRequest(_client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Recurring missing member", DateOnly.FromDateTime(DateTime.UtcNow), TaskOwnershipKind.Unassigned, null, TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, "missing-member"))));
        await AssertBadRequest(_client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Recurring mismatch", DateOnly.FromDateTime(DateTime.UtcNow), TaskOwnershipKind.Unassigned, null, TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, known.Id.ToString()))));
        await AssertBadRequest(_client.PostAsJsonAsync("/api/tasks", new { title = "Recurring bad pair", dueDate = DateOnly.FromDateTime(DateTime.UtcNow), ownershipKind = "Unassigned", recurrenceFrequency = "Weekly", decorativeAvatar = new { referenceType = "FamilyMember" } }));
    }

    [Fact]
    public async Task DeletingFamilyMemberClearsOneOffTaskAndRecurringSeriesDecorativeReferencesOnly()
    {
        var decorativeMember = await CreateFamilyMember($"Decorative Temp {Guid.NewGuid():N}");
        var oneOff = await CreateOneOffTask($"One-off family delete {Guid.NewGuid()}", TaskOwnershipKind.FamilyMember, "alex", new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, decorativeMember.Id));
        var recurring = await CreateRecurringTask($"Recurring family delete {Guid.NewGuid()}", TaskRecurrenceFrequency.Weekly, new HomeOps.Api.Lists.DecorativeAvatarReferenceDto(HomeOps.Api.Lists.DecorativeAvatarReferenceType.FamilyMember, decorativeMember.Id));

        var delete = await _client.DeleteAsync($"/api/family-members/{decorativeMember.Id}");
        delete.EnsureSuccessStatusCode();
        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var reloadedOneOff = tasks!.Single(task => task.Id == oneOff.Id);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOps.Api.Data.HomeOpsDbContext>();
        var series = await dbContext.RecurringTaskSeries.FindAsync(recurring.RecurringTaskSeriesId);

        Assert.Equal("alex", reloadedOneOff.FamilyMemberId);
        Assert.Null(reloadedOneOff.DecorativeAvatar);
        Assert.Null(series!.DecorativeAvatarReferenceType);
        Assert.Null(series.DecorativeAvatarReferenceId);
        Assert.Equal(TaskRecurrenceFrequency.Weekly, series.Frequency);
    }

    private async Task<HouseholdTaskDto> CreateOneOffTask(string title, TaskOwnershipKind ownershipKind, string? familyMemberId, HomeOps.Api.Lists.DecorativeAvatarReferenceDto? decorativeAvatar)
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest(title, DateOnly.FromDateTime(DateTime.UtcNow), ownershipKind, familyMemberId, TaskRecurrenceFrequency.None, decorativeAvatar));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
    }

    private async Task<HouseholdTaskDto> CreateRecurringTask(string title, TaskRecurrenceFrequency frequency, HomeOps.Api.Lists.DecorativeAvatarReferenceDto? decorativeAvatar)
    {
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest(title, DateOnly.FromDateTime(DateTime.UtcNow), TaskOwnershipKind.Unassigned, null, frequency, decorativeAvatar));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<HouseholdTaskDto>())!;
    }

    private static async Task AssertBadRequest(Task<HttpResponseMessage> request)
    {
        var response = await request;
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }


    private async Task<HomeOps.Api.FamilyMembers.FamilyMemberDto> CreateFamilyMember(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/family-members", new HomeOps.Api.FamilyMembers.CreateFamilyMemberRequest(name, HomeOps.Api.FamilyMembers.FamilyMemberKind.Adult, null, "#fef3c7", "DT", null, null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<HomeOps.Api.FamilyMembers.FamilyMemberDto>())!;
    }

    private async Task<HomeOps.Api.KnownPeople.KnownPersonDto> CreateKnownPerson(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", new HomeOps.Api.KnownPeople.CreateKnownPersonRequest(name, null, HomeOps.Api.KnownPeople.KnownPersonRelationshipType.Grandparent, null, HomeOps.Api.KnownPeople.KnownPersonScope.Shared, null, null, null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<HomeOps.Api.KnownPeople.KnownPersonDto>())!;
    }
}
