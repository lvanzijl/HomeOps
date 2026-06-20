using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Households;

public sealed class OnboardingApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task ExistingSeededHouseholdBypassesOnboarding()
    {
        var status = await _client.GetFromJsonAsync<OnboardingStatusDto>("/api/onboarding/status");
        Assert.NotNull(status);
        Assert.True(status.OnboardingCompleted);
        Assert.True(status.HasActiveFamilyMembers);
        Assert.False(status.RequiresOnboarding);
    }

    [Fact]
    public async Task HouseholdWithoutActiveMembersRequiresOnboardingUntilCompletedAfterMembersExist()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var household = await dbContext.Households.FirstAsync(h => h.Id == SeedHousehold.Id);
            household.OnboardingCompleted = false;
            foreach (var member in dbContext.FamilyMembers) member.IsDeleted = true;
            await dbContext.SaveChangesAsync();
        }

        var emptyStatus = await _client.GetFromJsonAsync<OnboardingStatusDto>("/api/onboarding/status");
        Assert.NotNull(emptyStatus);
        Assert.False(emptyStatus.OnboardingCompleted);
        Assert.False(emptyStatus.HasActiveFamilyMembers);
        Assert.True(emptyStatus.RequiresOnboarding);

        var complete = await _client.PostAsync("/api/onboarding/complete", null);
        complete.EnsureSuccessStatusCode();
        var completed = await complete.Content.ReadFromJsonAsync<OnboardingStatusDto>();
        Assert.NotNull(completed);
        Assert.True(completed.OnboardingCompleted);
        Assert.True(completed.RequiresOnboarding);

        using var restoreScope = factory.Services.CreateScope();
        var restoreDb = restoreScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var restoreHousehold = await restoreDb.Households.FirstAsync(h => h.Id == SeedHousehold.Id);
        restoreHousehold.OnboardingCompleted = true;
        foreach (var member in restoreDb.FamilyMembers) member.IsDeleted = false;
        await restoreDb.SaveChangesAsync();
    }
}
