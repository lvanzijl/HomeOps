using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.VisualReviewFixtures;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Lists;

public sealed class VisualReviewFixtureApiTests
{
    [Fact]
    public async Task ScenariosExposeRequiredVisualReviewNames()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var scenarios = await client.GetFromJsonAsync<List<VisualReviewScenarioDto>>("/api/visual-review-fixtures/scenarios");

        Assert.NotNull(scenarios);
        Assert.Equal(new[] { "visual-full", "visual-mixed", "visual-empty", "visual-child-young", "visual-child-older", "visual-weekly-reset", "visual-shopping-lifecycle", "visual-marketing-home", "visual-marketing-family", "visual-marketing-agenda", "visual-marketing-tasks", "visual-marketing-shopping", "visual-marketing-motivation", "visual-marketing-weekly-reset", "visual-marketing-settings" }, scenarios.Select(s => s.Name));
    }

    [Fact]
    public async Task ResetScenarioIsDeterministicAndIsolatesExistingSeedRows()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            db.Lists.Add(new List { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = "Manual setup should be removed", CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow });
            await db.SaveChangesAsync();
        }

        var first = await client.PostAsync("/api/visual-review-fixtures/visual-full/reset", null);
        var firstBody = await first.Content.ReadFromJsonAsync<ApplyVisualReviewScenarioResponse>();
        var second = await client.PostAsync("/api/visual-review-fixtures/visual-full/reset", null);
        var secondBody = await second.Content.ReadFromJsonAsync<ApplyVisualReviewScenarioResponse>();

        first.EnsureSuccessStatusCode();
        second.EnsureSuccessStatusCode();
        Assert.NotNull(firstBody);
        Assert.NotNull(secondBody);
        Assert.Equal(firstBody, secondBody);
        Assert.Equal(new DateTimeOffset(2026, 6, 21, 9, 0, 0, TimeSpan.Zero), firstBody.AnchorUtc);
        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.DoesNotContain(verifyDb.Lists, list => list.Name == "Manual setup should be removed");
        Assert.Contains(verifyDb.ListItems, item => item.Id == Guid.Parse("77000000-0000-0000-0000-000000000201") && item.Text == "Milk");
    }

    [Theory]
    [InlineData("visual-marketing-home")]
    [InlineData("visual-marketing-family")]
    [InlineData("visual-marketing-agenda")]
    [InlineData("visual-marketing-tasks")]
    [InlineData("visual-marketing-shopping")]
    [InlineData("visual-marketing-motivation")]
    [InlineData("visual-marketing-weekly-reset")]
    [InlineData("visual-marketing-settings")]
    public async Task MarketingScenariosUseCanonicalHousehold(string scenarioName)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsync($"/api/visual-review-fixtures/{scenarioName}/reset", null);
        var body = await response.Content.ReadFromJsonAsync<ApplyVisualReviewScenarioResponse>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(body);
        var expectedAnchorUtc = scenarioName == "visual-marketing-weekly-reset"
            ? new DateTimeOffset(2026, 6, 21, 17, 35, 0, TimeSpan.Zero)
            : new DateTimeOffset(2026, 6, 16, 7, 5, 0, TimeSpan.Zero);
        Assert.Equal(expectedAnchorUtc, body.AnchorUtc);
        Assert.Equal(4, body.FamilyMembers);
        Assert.True(body.Tasks > 0);
        Assert.True(body.ListItems > 0);
        Assert.True(body.Events > 0);
        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.Equal(new[] { "Dad", "Mom", "Robin", "Thomas" }, verifyDb.FamilyMembers.Select(member => member.Name).OrderBy(name => name));
        Assert.Contains(verifyDb.EventSeries, series => series.Title == "Zwemles Thomas" && series.StartDate == new DateOnly(2026, 6, 16));
        Assert.Contains(verifyDb.ListItems, item => item.Text == "Zwemluiers voor Robin" && item.PreferredStore == "Jumbo");
        Assert.Contains(verifyDb.MotivationFamilyGoals, goal => goal.Title == "20 helpful moments before Sunday pancake breakfast");
    }

    [Fact]
    public async Task MarketingShoppingScenarioSupportsCookieStoryWithoutPreAddingBananas()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsync("/api/visual-review-fixtures/visual-marketing-shopping/reset", null);

        response.EnsureSuccessStatusCode();
        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var activeItemNames = verifyDb.ListItems
            .Where(item => !item.IsCompleted && !item.IsDeleted)
            .Select(item => item.Text)
            .ToArray();

        Assert.Contains("Bloem", activeItemNames);
        Assert.Contains("Roomboter", activeItemNames);
        Assert.Contains("Chocoladestukjes", activeItemNames);
        Assert.Contains("Vanillesuiker", activeItemNames);
        Assert.DoesNotContain("Bananen", activeItemNames);
        Assert.Contains(verifyDb.ListItems, item => item.Text == "Bloem" && item.PreferredStore == "Albert Heijn");
        Assert.Contains(verifyDb.ListItems, item => item.Text == "Roomboter" && item.PreferredStore == "HEMA");
    }

    [Fact]
    public async Task EmptyScenarioClearsReviewSurfaces()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsync("/api/visual-review-fixtures/visual-empty/reset", null);
        var body = await response.Content.ReadFromJsonAsync<ApplyVisualReviewScenarioResponse>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(body);
        Assert.Equal(0, body.FamilyMembers);
        Assert.Equal(0, body.Tasks);
        Assert.Equal(0, body.Lists);
        Assert.Equal(0, body.FamilyGoals);
        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.Empty(verifyDb.HouseholdTasks);
        Assert.Empty(verifyDb.Lists);
        Assert.Empty(verifyDb.MotivationFamilyGoals);
    }

    [Fact]
    public async Task UnknownScenarioReturnsNotFound()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsync("/api/visual-review-fixtures/not-a-scenario/reset", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
