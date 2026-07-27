using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using Microsoft.AspNetCore.Http;
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
    public async Task CompletedHouseholdWithoutActiveMembersDoesNotRestartOnboarding()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var household = await dbContext.Households.FirstAsync(item => item.Id == SeedHousehold.Id);
        var originalCompletion = household.OnboardingCompleted;
        var members = await dbContext.FamilyMembers
            .Where(member => member.HouseholdId == SeedHousehold.Id)
            .ToListAsync();
        var originalDeletionState = members.ToDictionary(
            member => member.Id,
            member => (member.IsDeleted, member.DeletedUtc));

        try
        {
            household.OnboardingCompleted = true;
            foreach (var member in members)
            {
                member.IsDeleted = true;
                member.DeletedUtc ??= DateTimeOffset.UtcNow;
            }
            await dbContext.SaveChangesAsync();

            var status = await _client.GetFromJsonAsync<OnboardingStatusDto>("/api/onboarding/status");

            Assert.NotNull(status);
            Assert.True(status.OnboardingCompleted);
            Assert.False(status.HasActiveFamilyMembers);
            Assert.False(status.RequiresOnboarding);
        }
        finally
        {
            household.OnboardingCompleted = originalCompletion;
            foreach (var member in members)
            {
                var original = originalDeletionState[member.Id];
                member.IsDeleted = original.IsDeleted;
                member.DeletedUtc = original.DeletedUtc;
            }
            await dbContext.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task CompletionValidationFailureWritesNothing()
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

        var invalid = await _client.PostAsJsonAsync("/api/onboarding/complete", new CompleteOnboardingRequest("Home", "Europe/Amsterdam", []));
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, invalid.StatusCode);

        var invalidFields = await _client.PostAsJsonAsync(
            "/api/onboarding/complete",
            new CompleteOnboardingRequest(
                "",
                "UTC",
                [new OnboardingMemberRequest("", "", "", FamilyMemberKind.Adult, null, null)]));
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, invalidFields.StatusCode);
        var problem = await invalidFields.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("householdName", problem.Errors);
        Assert.Contains("timeZoneId", problem.Errors);
        Assert.Contains("members[0].name", problem.Errors);
        Assert.Contains("members[0].displayColor", problem.Errors);
        Assert.Contains("members[0].initials", problem.Errors);
        Assert.Contains("members[0].avatarSelection", problem.Errors);

        using (var assertionScope = factory.Services.CreateScope())
        {
            var assertionDb = assertionScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            Assert.False((await assertionDb.Households.FirstAsync(h => h.Id == SeedHousehold.Id)).OnboardingCompleted);
            Assert.Empty(await assertionDb.FamilyMembers.Where(member => member.HouseholdId == SeedHousehold.Id && !member.IsDeleted).ToListAsync());
        }

        using var restoreScope = factory.Services.CreateScope();
        var restoreDb = restoreScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var restoreHousehold = await restoreDb.Households.FirstAsync(h => h.Id == SeedHousehold.Id);
        restoreHousehold.OnboardingCompleted = true;
        foreach (var member in restoreDb.FamilyMembers) member.IsDeleted = false;
        await restoreDb.SaveChangesAsync();
    }

    [Fact]
    public async Task CompletionIsAtomicAndIdempotentAfterResponseRetry()
    {
        await ResetToIncompleteHousehold();
        var request = ValidRequest("Alex", FamilyMemberKind.Adult);

        var first = await _client.PostAsJsonAsync("/api/onboarding/complete", request);
        first.EnsureSuccessStatusCode();
        var retry = await _client.PostAsJsonAsync("/api/onboarding/complete", request);
        retry.EnsureSuccessStatusCode();

        using var assertionScope = factory.Services.CreateScope();
        var db = assertionScope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var household = await db.Households.FirstAsync(h => h.Id == SeedHousehold.Id);
        Assert.True(household.OnboardingCompleted);
        Assert.Equal("Thuis", household.Name);
        Assert.Equal("Europe/Amsterdam", household.TimeZoneId);
        var member = Assert.Single(await db.FamilyMembers.Where(member => member.HouseholdId == SeedHousehold.Id && !member.IsDeleted).ToListAsync());
        Assert.NotNull(member.AvatarSelection);

        var status = await _client.GetFromJsonAsync<OnboardingStatusDto>("/api/onboarding/status");
        Assert.NotNull(status);
        Assert.False(status.RequiresOnboarding);
    }

    private async Task ResetToIncompleteHousehold()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var household = await db.Households.FirstAsync(h => h.Id == SeedHousehold.Id);
        household.OnboardingCompleted = false;
        foreach (var member in db.FamilyMembers.Where(member => member.HouseholdId == SeedHousehold.Id)) member.IsDeleted = true;
        await db.SaveChangesAsync();
    }

    private CompleteOnboardingRequest ValidRequest(string name, FamilyMemberKind kind)
    {
        using var scope = factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<AvatarCatalogService>();
        var selection = catalog.DefaultSelection();
        return new CompleteOnboardingRequest("Thuis", "Europe/Amsterdam", [
            new OnboardingMemberRequest(name, "#c7d2fe", "A", kind, kind == FamilyMemberKind.Child ? new DateOnly(2018, 4, 12) : null, new AvatarSelectionDto(selection.SchemaVersion, selection.Selections)),
        ]);
    }
}
