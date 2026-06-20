using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Households;

public static class OnboardingEndpoints
{
    public static IEndpointRouteBuilder MapOnboardingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/onboarding").WithTags("Onboarding");

        group.MapGet("/status", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var household = await dbContext.Households.AsNoTracking().FirstAsync(h => h.Id == SeedHousehold.Id, cancellationToken);
            var hasActiveMembers = await dbContext.FamilyMembers.AsNoTracking().AnyAsync(m => m.HouseholdId == SeedHousehold.Id && !m.IsDeleted, cancellationToken);
            return Results.Ok(new OnboardingStatusDto(household.OnboardingCompleted, hasActiveMembers, !household.OnboardingCompleted || !hasActiveMembers));
        }).WithName("GetOnboardingStatus").Produces<OnboardingStatusDto>();

        group.MapPost("/complete", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var household = await dbContext.Households.FirstAsync(h => h.Id == SeedHousehold.Id, cancellationToken);
            household.OnboardingCompleted = true;
            household.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            var hasActiveMembers = await dbContext.FamilyMembers.AsNoTracking().AnyAsync(m => m.HouseholdId == SeedHousehold.Id && !m.IsDeleted, cancellationToken);
            return Results.Ok(new OnboardingStatusDto(household.OnboardingCompleted, hasActiveMembers, !household.OnboardingCompleted || !hasActiveMembers));
        }).WithName("CompleteOnboarding").Produces<OnboardingStatusDto>();

        return app;
    }
}
