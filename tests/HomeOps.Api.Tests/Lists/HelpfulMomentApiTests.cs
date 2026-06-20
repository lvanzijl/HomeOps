using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Motivation;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Lists;

public sealed class HelpfulMomentApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task HelpfulMomentCanBeCreatedPersistedAndRetrieved()
    {
        var response = await _client.PostAsJsonAsync("/api/helpful-moments", new CreateHelpfulMomentRequest("riley", "Helped Jordan find shoes", "Kindly stopped to help before school.", "Kindness"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<HelpfulMomentDto>();
        Assert.NotNull(created);
        Assert.Equal("riley", created.FamilyMemberId);
        Assert.Equal("Kindness", created.RecognitionTag);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.Contains(dbContext.HelpfulMoments, moment => moment.Id == created.Id && moment.Title == "Helped Jordan find shoes");

        var moments = await _client.GetFromJsonAsync<IReadOnlyCollection<HelpfulMomentDto>>("/api/helpful-moments?familyMemberId=riley");
        Assert.NotNull(moments);
        Assert.Contains(moments, moment => moment.Id == created.Id && moment.FamilyMemberName == "Riley");
    }

    [Fact]
    public async Task HelpfulMomentRejectsRewardEconomyConceptsByIgnoringUnknownFields()
    {
        var response = await _client.PostAsJsonAsync("/api/helpful-moments", new { familyMemberId = "jordan", title = "Took initiative", recognitionTag = "Initiative", points = 10, tokens = 3, rewardValue = "shop" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<HelpfulMomentDto>();
        Assert.NotNull(created);
        Assert.Equal("Initiative", created.RecognitionTag);
    }

    [Fact]
    public async Task HelpfulMomentDoesNotChangeMotivationProgress()
    {
        var before = await _client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");
        await _client.PostAsJsonAsync("/api/helpful-moments", new CreateHelpfulMomentRequest("riley", "Showed teamwork", null, "Teamwork"));

        var after = await _client.GetFromJsonAsync<MotivationSnapshotDto>("/api/motivation");

        Assert.Equal(before?.FamilyGoal?.CurrentProgress, after?.FamilyGoal?.CurrentProgress);
        Assert.Equal(before?.IndividualGoals.Single(goal => goal.FamilyMemberId == "riley").CurrentProgress, after?.IndividualGoals.Single(goal => goal.FamilyMemberId == "riley").CurrentProgress);
    }
}
