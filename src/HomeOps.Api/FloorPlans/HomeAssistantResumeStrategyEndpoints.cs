using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public static class HomeAssistantResumeStrategyEndpoints
{
    public static IEndpointRouteBuilder MapHomeAssistantResumeStrategyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/climate-providers/{providerId:guid}/home-assistant/resume-strategy").WithTags("Home Assistant Resume Strategy");
        group.MapGet("/", Get).WithName("GetHomeAssistantResumeStrategy").Produces<HomeAssistantResumeStrategyConfigurationDto>().Produces(404);
        group.MapPut("/", Put).WithName("UpdateHomeAssistantResumeStrategy").Produces<HomeAssistantResumeStrategyConfigurationDto>().ProducesValidationProblem().Produces(404).Produces(409);
        return app;
    }

    private static async Task<IResult> Get(Guid providerId, HomeOpsDbContext db, CancellationToken ct)
    {
        var provider = await Find(providerId, db, ct);
        return provider is null ? Results.NotFound() : Results.Ok(HomeAssistantResumeStrategyValidation.ToDto(provider));
    }

    private static async Task<IResult> Put(Guid providerId, UpdateHomeAssistantResumeStrategyRequest request, HomeOpsDbContext db, CancellationToken ct)
    {
        var provider = await Find(providerId, db, ct);
        if (provider is null) return Results.NotFound();
        if (!provider.IsEnabled || provider.IsArchived) return Results.Conflict(new Dictionary<string, string[]> { ["providerId"] = ["Home Assistant-provider moet actief zijn om de hervatmethode te wijzigen."] });
        var validation = HomeAssistantResumeStrategyValidation.Validate(request);
        if (!validation.Valid) return Results.ValidationProblem(new Dictionary<string, string[]> { ["resumeStrategy"] = validation.Blockers.ToArray() });
        HomeAssistantResumeStrategyValidation.Apply(provider, request, DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(ct);
        return Results.Ok(HomeAssistantResumeStrategyValidation.ToDto(provider));
    }

    private static Task<ClimateProvider?> Find(Guid providerId, HomeOpsDbContext db, CancellationToken ct) =>
        db.ClimateProviders.FirstOrDefaultAsync(provider => provider.Id == providerId && provider.HouseholdId == SeedHousehold.Id && provider.ProviderType == ProviderType.HomeAssistant, ct);
}
