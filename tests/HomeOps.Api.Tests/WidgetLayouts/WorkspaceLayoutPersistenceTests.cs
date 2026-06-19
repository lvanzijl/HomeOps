using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.WidgetLayouts;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.WidgetLayouts;

public sealed class WorkspaceLayoutPersistenceTests
{
    [Fact]
    public async Task DbContextSeedsDefaultWorkspaceLayouts()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();

        var layouts = await dbContext.WorkspaceLayouts.Include(layout => layout.Placements).OrderBy(layout => layout.WorkspaceKey).ToListAsync();

        Assert.Equal(["home", "house", "media", "settings"], layouts.Select(layout => layout.WorkspaceKey).ToArray());
        Assert.Equal(["agenda-mvp", "shopping-list-mvp", "welcome-text"], layouts.Single(layout => layout.WorkspaceKey == "home").Placements.OrderBy(placement => placement.Position).Select(placement => placement.WidgetType).ToArray());
        Assert.All(layouts, layout => Assert.Equal(SeedHousehold.Id, layout.HouseholdId));
    }

    [Fact]
    public async Task DbContextUpdatesWorkspacePlacements()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();

        var layout = await dbContext.WorkspaceLayouts.AsNoTracking().SingleAsync(existingLayout => existingLayout.WorkspaceKey == "home");
        await dbContext.WidgetPlacements.Where(placement => placement.WorkspaceLayoutId == layout.Id).ExecuteDeleteAsync();
        dbContext.WidgetPlacements.Add(new WidgetPlacement
        {
            Id = Guid.NewGuid(),
            WorkspaceLayoutId = layout.Id,
            WidgetType = "shopping-list-mvp",
            Position = 0,
            Size = "medium",
            ConfigurationJson = "{}",
        });
        await dbContext.SaveChangesAsync();

        var saved = await dbContext.WorkspaceLayouts.Include(existingLayout => existingLayout.Placements).SingleAsync(existingLayout => existingLayout.WorkspaceKey == "home");
        Assert.Equal(["shopping-list-mvp"], saved.Placements.Select(placement => placement.WidgetType).ToArray());
    }

    private static HomeOpsDbContext CreateDbContext()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseSqlite(connection)
            .Options;

        return new HomeOpsDbContext(options);
    }
}
