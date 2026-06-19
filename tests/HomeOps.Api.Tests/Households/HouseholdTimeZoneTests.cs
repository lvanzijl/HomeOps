using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.Households;

public sealed class HouseholdTimeZoneTests
{
    [Fact]
    public void DefaultHouseholdTimeZoneRemainsEuropeAmsterdam()
    {
        Assert.Equal("Europe/Amsterdam", HouseholdTimeZone.DefaultTimeZoneId);
    }

    [Fact]
    public void InitialHouseholdTimeZoneFallsBackToEuropeAmsterdamWhenNoHouseholdZoneCanBeDerived()
    {
        var previousTimeZone = Environment.GetEnvironmentVariable("TZ");
        try
        {
            Environment.SetEnvironmentVariable("TZ", "UTC");

            var timeZoneId = HouseholdTimeZone.DeriveInitialTimeZoneId();

            Assert.Equal(HouseholdTimeZone.DefaultTimeZoneId, timeZoneId);
        }
        finally
        {
            Environment.SetEnvironmentVariable("TZ", previousTimeZone);
        }
    }

    [Fact]
    public async Task DbContextSeedsPersistedHouseholdTimeZone()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();

        var household = await dbContext.Households.SingleAsync(candidate => candidate.Id == SeedHousehold.Id);

        Assert.Equal(HouseholdTimeZone.DefaultTimeZoneId, household.TimeZoneId);
    }

    private static HomeOpsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"household-time-zone-{Guid.NewGuid()}")
            .Options;

        return new HomeOpsDbContext(options);
    }
}
