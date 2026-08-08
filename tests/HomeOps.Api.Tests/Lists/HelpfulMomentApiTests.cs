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

    [Fact]
    public async Task HelpfulMomentCanBeCorrectedAndSoftDeleted()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        var createResponse = await client.PostAsJsonAsync("/api/helpful-moments", new CreateHelpfulMomentRequest("riley", "Helped tidy", "Original note", "Kindness"));
        var created = await createResponse.Content.ReadFromJsonAsync<HelpfulMomentDto>();
        Assert.NotNull(created);

        var updateResponse = await client.PutAsJsonAsync($"/api/helpful-moments/{created.Id}", new UpdateHelpfulMomentRequest("jordan", "Helped tidy the table", "Corrected note", "Teamwork", created.UpdatedUtc));

        updateResponse.EnsureSuccessStatusCode();
        var updated = await updateResponse.Content.ReadFromJsonAsync<HelpfulMomentDto>();
        Assert.NotNull(updated);
        Assert.Equal("jordan", updated.FamilyMemberId);
        Assert.Equal("Helped tidy the table", updated.Title);
        Assert.Equal("Teamwork", updated.RecognitionTag);
        Assert.True(updated.UpdatedUtc > created.UpdatedUtc);

        var staleResponse = await client.PutAsJsonAsync($"/api/helpful-moments/{created.Id}", new UpdateHelpfulMomentRequest("jordan", "Stale correction", null, "Routine", created.UpdatedUtc));
        Assert.Equal(HttpStatusCode.Conflict, staleResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/helpful-moments/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        var visible = await client.GetFromJsonAsync<IReadOnlyCollection<HelpfulMomentDto>>("/api/helpful-moments?limit=50");
        Assert.DoesNotContain(visible!, moment => moment.Id == created.Id);

        using var scope = isolatedFactory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.Contains(dbContext.HelpfulMoments, moment => moment.Id == created.Id && moment.IsDeleted && moment.DeletedUtc != null);
    }

    [Fact]
    public async Task HelpfulMomentKeepsHistoricalAttributionWhenMemberIsRemoved()
    {
        await using var isolatedFactory = new HomeOpsWebApplicationFactory();
        var client = isolatedFactory.CreateClient();
        var createResponse = await client.PostAsJsonAsync("/api/helpful-moments", new CreateHelpfulMomentRequest("riley", "Shared the markers", null, "Teamwork"));
        var created = await createResponse.Content.ReadFromJsonAsync<HelpfulMomentDto>();
        Assert.NotNull(created);

        var removeResponse = await client.DeleteAsync("/api/family-members/riley");
        Assert.Equal(HttpStatusCode.NoContent, removeResponse.StatusCode);

        var moments = await client.GetFromJsonAsync<IReadOnlyCollection<HelpfulMomentDto>>("/api/helpful-moments?limit=50");
        var retained = Assert.Single(moments!, moment => moment.Id == created.Id);
        Assert.Equal("Riley", retained.FamilyMemberName);
        Assert.True(retained.FamilyMemberIsRemoved);
    }
}
