using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Motivation;
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

    [Theory]
    [InlineData("/api/motivation")]
    [InlineData("/api/motivation/family-goals")]
    public async Task MotivationMutationEndpointsAreNotAvailable(string url)
    {
        var response = await _client.PostAsJsonAsync(url, new { title = "New goal" });

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.MethodNotAllowed, HttpStatusCode.NotFound });
    }
}
