using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Tasks;

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
