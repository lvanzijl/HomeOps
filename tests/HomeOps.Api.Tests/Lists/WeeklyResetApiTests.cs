using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.Motivation;
using HomeOps.Api.Tasks;
using HomeOps.Api.WeeklyReset;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Lists;

public sealed class WeeklyResetApiTests : IClassFixture<HomeOpsWebApplicationFactory>
{
    [Fact]
    public async Task WeeklyResetCollectsOnlyReviewCandidatesAndRecap()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var now = DateTimeOffset.UtcNow;
            db.HouseholdTasks.Add(new HouseholdTask { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = "Review me", DueDate = null, NoDateReviewState = NoDateTaskReviewState.NeedsReview, CreatedUtc = now.AddDays(-20), UpdatedUtc = now.AddDays(-20) });
            db.HouseholdTasks.Add(new HouseholdTask { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = "Fresh task", DueDate = null, NoDateReviewState = NoDateTaskReviewState.Active, CreatedUtc = now, UpdatedUtc = now });
            db.HouseholdTasks.Add(new HouseholdTask { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = "Done this week", DueDate = null, IsCompleted = true, CompletedUtc = now.AddDays(-1), NoDateReviewState = NoDateTaskReviewState.Completed, CreatedUtc = now.AddDays(-2), UpdatedUtc = now.AddDays(-1) });
            db.Lists.Add(new List { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = "Old Costco", IsArchived = true, CreatedUtc = now.AddDays(-40), UpdatedUtc = now.AddDays(-35) });
            db.HelpfulMoments.Add(new HelpfulMoment { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FamilyMemberId = "riley", Title = "Helped set the table", RecognitionTag = "responsibility", CreatedUtc = now.AddDays(-1) });
            await db.SaveChangesAsync();
        }

        var reset = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");

        Assert.NotNull(reset);
        Assert.Contains(reset.ReviewCandidates, task => task.Title == "Review me");
        Assert.DoesNotContain(reset.ReviewCandidates, task => task.Title == "Fresh task");
        Assert.NotNull(reset.FamilyGoal);
        Assert.NotEmpty(reset.IndividualGoals);
        Assert.Contains(reset.ShoppingReviewCandidates, list => list.Name == "Old Costco");
        Assert.True(reset.ContributionRecap.CompletedTaskCount >= 1);
        Assert.Contains(reset.ContributionRecap.HelpfulMoments, moment => moment.Title == "Helped set the table");
    }

    [Fact]
    public async Task WeeklyResetCanArchiveFamilyGoal()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var reset = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        Assert.NotNull(reset?.FamilyGoal);

        var response = await client.PostAsync($"/api/weekly-reset/family-goal/{reset.FamilyGoal.Id}/archive", null);

        response.EnsureSuccessStatusCode();
        var after = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        Assert.Null(after?.FamilyGoal);
    }
}
