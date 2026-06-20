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
        Assert.Contains(members, member => member.Id == "alex" && member.Name == "Alex");
    }

    [Fact]
    public async Task UpdateFamilyMemberPersistsAvatarConfiguration()
    {
        var request = new UpdateFamilyMemberRequest("Alex", "#111111", "AX", new FamilyMemberAvatarDto(FamilyMemberAgeGroup.Adult, FamilyMemberPresentation.Neutral, "#aaaaaa", "#222222", FamilyMemberHairStyle.Bob, true, "#333333"));
        var response = await _client.PutAsJsonAsync("/api/family-members/alex", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var loaded = await _client.GetFromJsonAsync<FamilyMemberDto>("/api/family-members/alex");
        Assert.NotNull(loaded);
        Assert.Equal("#111111", loaded.DisplayColor);
        Assert.Equal(FamilyMemberHairStyle.Bob, loaded.Avatar.HairStyle);
        Assert.True(loaded.Avatar.Glasses);
    }

    [Fact]
    public async Task AssignedTaskMustReferencePersistedFamilyMember()
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
