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
        Assert.Equal(new[] { "visual-full", "visual-mixed", "visual-empty", "visual-child-young", "visual-child-older", "visual-weekly-reset", "visual-shopping-lifecycle" }, scenarios.Select(s => s.Name));
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
