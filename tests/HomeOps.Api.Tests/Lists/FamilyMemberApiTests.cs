using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Tasks;

namespace HomeOps.Api.Tests.Lists;

public sealed class FamilyMemberApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetFamilyMembersReturnsSeededHouseholdMembers()
    {
        var members = await _client.GetFromJsonAsync<IReadOnlyCollection<FamilyMemberDto>>("/api/family-members");
        Assert.NotNull(members);
        Assert.Contains(members, member => member.Id == "alex" && member.MemberKind == FamilyMemberKind.Adult);
        Assert.Contains(members, member => member.Id == "riley" && member.MemberKind == FamilyMemberKind.Child && member.DateOfBirth == new DateOnly(2018, 4, 12));
    }

    [Fact]
    public async Task AddAdultPersistsWithoutDateOfBirth()
    {
        var response = await _client.PostAsJsonAsync("/api/family-members", new CreateFamilyMemberRequest("Taylor", FamilyMemberKind.Adult, null, "#abcdef", null, null));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<FamilyMemberDto>();
        Assert.NotNull(created);
        Assert.Equal(FamilyMemberKind.Adult, created.MemberKind);
        Assert.Null(created.DateOfBirth);
    }

    [Fact]
    public async Task AddChildRequiresAndPersistsDateOfBirth()
    {
        var missing = await _client.PostAsJsonAsync("/api/family-members", new CreateFamilyMemberRequest("Casey", FamilyMemberKind.Child, null, null, null, null));
        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);

        var response = await _client.PostAsJsonAsync("/api/family-members", new CreateFamilyMemberRequest("Casey", FamilyMemberKind.Child, new DateOnly(2019, 7, 8), null, null, null));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<FamilyMemberDto>();
        Assert.NotNull(created);
        Assert.Equal(new DateOnly(2019, 7, 8), created.DateOfBirth);
    }

    [Fact]
    public async Task UpdateFamilyMemberPersistsDetailsAndAvatarConfiguration()
    {
        var request = new UpdateFamilyMemberRequest("Alex Updated", "#111111", "AX", FamilyMemberKind.Adult, new DateOnly(1985, 1, 2), new FamilyMemberAvatarDto(FamilyMemberAgeGroup.Adult, FamilyMemberPresentation.Neutral, "#aaaaaa", "#222222", FamilyMemberHairStyle.Bob, true, "#333333"));
        var response = await _client.PutAsJsonAsync("/api/family-members/alex", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var loaded = await _client.GetFromJsonAsync<FamilyMemberDto>("/api/family-members/alex");
        Assert.NotNull(loaded);
        Assert.Equal("Alex Updated", loaded.Name);
        Assert.Equal(new DateOnly(1985, 1, 2), loaded.DateOfBirth);
        Assert.Equal("#111111", loaded.DisplayColor);
        Assert.Equal(FamilyMemberHairStyle.Bob, loaded.Avatar.HairStyle);
        Assert.True(loaded.Avatar.Glasses);
    }

    [Fact]
    public async Task SoftDeleteFiltersMemberButPreservesExistingReferences()
    {
        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Keep reference", null, TaskOwnershipKind.FamilyMember, "jordan"));
        Assert.Equal(HttpStatusCode.Created, taskResponse.StatusCode);

        var delete = await _client.DeleteAsync("/api/family-members/jordan");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var members = await _client.GetFromJsonAsync<IReadOnlyCollection<FamilyMemberDto>>("/api/family-members");
        Assert.NotNull(members);
        Assert.DoesNotContain(members, member => member.Id == "jordan");

        var task = await taskResponse.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.NotNull(task);
        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        Assert.NotNull(tasks);
        Assert.Contains(tasks, item => item.Id == task.Id && item.FamilyMemberId == "jordan");

        var newAssignment = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("New assignment", null, TaskOwnershipKind.FamilyMember, "jordan"));
        Assert.Equal(HttpStatusCode.BadRequest, newAssignment.StatusCode);
    }

    [Fact]
    public async Task AssignedTaskMustReferencePersistedActiveFamilyMember()
    {
        var invalid = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Pack lunch", null, TaskOwnershipKind.FamilyMember, "missing"));
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        var valid = await _client.PostAsJsonAsync("/api/tasks", new CreateHouseholdTaskRequest("Pack lunch", null, TaskOwnershipKind.FamilyMember, "alex"));
        Assert.Equal(HttpStatusCode.Created, valid.StatusCode);
        var created = await valid.Content.ReadFromJsonAsync<HouseholdTaskDto>();
        Assert.NotNull(created);
        Assert.Equal("alex", created.FamilyMemberId);
    }
}
