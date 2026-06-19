using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.WidgetLayouts;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.WidgetLayouts;

public sealed class WorkspaceLayoutApiTests
{
    [Fact]
    public async Task GetLayoutReturnsSeededHomeLayout()
    {
        await using var factory = new WidgetLayoutWebApplicationFactory();
        var client = factory.CreateClient();

        var layout = await client.GetFromJsonAsync<WorkspaceLayoutDto>("/api/workspaces/home/layout");

        Assert.NotNull(layout);
        Assert.Equal("home", layout.WorkspaceKey);
        Assert.Equal(SeedHousehold.Id, layout.HouseholdId);
        Assert.Equal(["agenda-mvp", "shopping-list-mvp", "welcome-text"], layout.Placements.Select(placement => placement.WidgetType).ToArray());
    }

    [Fact]
    public async Task SaveLayoutReplacesPlacementsInOrder()
    {
        await using var factory = new WidgetLayoutWebApplicationFactory();
        var client = factory.CreateClient();
        var request = new SaveWorkspaceLayoutRequest([
            new SaveWidgetPlacementRequest("shopping-list-mvp", 0, "medium", "{}"),
            new SaveWidgetPlacementRequest("agenda-mvp", 1, "large", "{}"),
        ]);

        var response = await client.PutAsJsonAsync("/api/workspaces/home/layout", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = await response.Content.ReadFromJsonAsync<WorkspaceLayoutDto>();
        Assert.NotNull(saved);
        Assert.Equal(["shopping-list-mvp", "agenda-mvp"], saved.Placements.Select(placement => placement.WidgetType).ToArray());

        var loaded = await client.GetFromJsonAsync<WorkspaceLayoutDto>("/api/workspaces/home/layout");
        Assert.NotNull(loaded);
        Assert.Equal(["shopping-list-mvp", "agenda-mvp"], loaded.Placements.Select(placement => placement.WidgetType).ToArray());
    }

    [Fact]
    public async Task GetLayoutUsesSeededHouseholdBoundary()
    {
        await using var factory = new WidgetLayoutWebApplicationFactory();
        var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var otherHouseholdId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        var now = DateTimeOffset.UtcNow;
        dbContext.Households.Add(new Household
        {
            Id = otherHouseholdId,
            Name = "Other Home",
            CreatedUtc = now,
            UpdatedUtc = now,
        });
        dbContext.WorkspaceLayouts.Add(new WorkspaceLayout
        {
            Id = Guid.NewGuid(),
            HouseholdId = otherHouseholdId,
            WorkspaceKey = "home",
            CreatedUtc = now,
            UpdatedUtc = now,
            Placements =
            {
                new WidgetPlacement
                {
                    Id = Guid.NewGuid(),
                    WidgetType = "settings-placeholder",
                    Position = 0,
                    Size = "medium",
                    ConfigurationJson = "{}",
                },
            },
        });
        await dbContext.SaveChangesAsync();

        var layout = await client.GetFromJsonAsync<WorkspaceLayoutDto>("/api/workspaces/home/layout");

        Assert.NotNull(layout);
        Assert.Equal(SeedHousehold.Id, layout.HouseholdId);
        Assert.Contains(layout.Placements, placement => placement.WidgetType == "agenda-mvp");
        Assert.DoesNotContain(layout.Placements, placement => placement.WidgetType == "settings-placeholder");
    }
}
