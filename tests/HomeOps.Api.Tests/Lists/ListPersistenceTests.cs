using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.Lists;

public sealed class ListPersistenceTests
{
    [Fact]
    public async Task FreshDbContextDoesNotSeedHouseholdLists()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();

        var household = await dbContext.Households.SingleAsync();
        var lists = await dbContext.Lists.Include(list => list.Items).ToListAsync();

        Assert.Equal(SeedHousehold.Id, household.Id);
        Assert.False(household.OnboardingCompleted);
        Assert.Empty(lists);
    }

    [Fact]
    public async Task DbContextPersistsListCrudBehavior()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();

        var now = DateTimeOffset.UtcNow;
        var list = new List
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            Name = "Hardware Store",
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        var item = new ListItem
        {
            Id = Guid.NewGuid(),
            ListId = list.Id,
            Text = "Light bulbs",
            IsCompleted = false,
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        dbContext.Lists.Add(list);
        dbContext.ListItems.Add(item);
        await dbContext.SaveChangesAsync();

        item.IsCompleted = true;
        item.UpdatedUtc = now.AddMinutes(1);
        await dbContext.SaveChangesAsync();

        dbContext.ListItems.Remove(item);
        await dbContext.SaveChangesAsync();

        Assert.True(await dbContext.Lists.AnyAsync(savedList => savedList.Name == "Hardware Store"));
        Assert.False(await dbContext.ListItems.AnyAsync(savedItem => savedItem.Id == item.Id));
    }

    private static HomeOpsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"lists-{Guid.NewGuid()}")
            .Options;

        return new HomeOpsDbContext(options);
    }
}
