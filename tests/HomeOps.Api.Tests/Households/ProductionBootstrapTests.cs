using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.VisualReviewFixtures;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.Households;

public sealed class ProductionBootstrapTests
{
    [Fact]
    public async Task Fresh_model_contains_only_an_incomplete_household_and_structural_defaults()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"production-bootstrap-{Guid.NewGuid()}")
            .Options;

        await using var dbContext = new HomeOpsDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var household = await dbContext.Households.SingleAsync();
        Assert.Equal(SeedHousehold.Id, household.Id);
        Assert.False(household.OnboardingCompleted);
        Assert.False(household.LegacyDemoDataReviewRequired);

        Assert.Empty(await dbContext.FamilyMembers.ToListAsync());
        Assert.Empty(await dbContext.Lists.ToListAsync());
        Assert.Empty(await dbContext.ListItems.ToListAsync());
        Assert.Empty(await dbContext.MotivationFamilyGoals.ToListAsync());
        Assert.Empty(await dbContext.MotivationIndividualGoals.ToListAsync());
        Assert.Empty(await dbContext.EventSeries.ToListAsync());

        Assert.Single(await dbContext.EventSources.ToListAsync());
        Assert.Equal(4, await dbContext.WorkspaceLayouts.CountAsync());
        Assert.Equal(5, await dbContext.TaskTemplates.CountAsync());
    }

    [Fact]
    public async Task Explicit_legacy_test_fixture_populates_and_completes_an_empty_household()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"demo-bootstrap-{Guid.NewGuid()}")
            .Options;

        await using var dbContext = new HomeOpsDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();
        await LegacySeedTestFixture.ApplyAsync(dbContext);
        await LegacySeedTestFixture.ApplyAsync(dbContext);

        var household = await dbContext.Households.SingleAsync();
        Assert.True(household.OnboardingCompleted);
        Assert.False(household.LegacyDemoDataReviewRequired);
        Assert.Equal(["Alex", "Jordan", "Riley", "Sam"], await dbContext.FamilyMembers.OrderBy(member => member.Name).Select(member => member.Name).ToArrayAsync());
        Assert.Equal(2, await dbContext.Lists.CountAsync());
        Assert.Equal(4, await dbContext.EventSeries.CountAsync());
        Assert.Single(await dbContext.MotivationFamilyGoals.ToListAsync());
    }
}
