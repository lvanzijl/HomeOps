using HomeOps.Api.Data;

namespace HomeOps.Api.VisualReviewFixtures;

public static class VisualReviewFixtureEndpoints
{
    public static IEndpointRouteBuilder MapVisualReviewFixtureEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/visual-review-fixtures").WithTags("Visual Review Fixtures");
        group.MapGet("/scenarios", () => Results.Ok(VisualReviewFixtureService.Scenarios))
            .WithName("GetVisualReviewFixtureScenarios")
            .Produces<IReadOnlyCollection<VisualReviewScenarioDto>>();
        group.MapGet("/marketing-time", (VisualReviewMarketingTimeProvider timeProvider) =>
        {
            var anchorUtc = timeProvider.ActiveMarketingAnchorUtc;
            return Results.Ok(new VisualReviewMarketingTimeDto(anchorUtc, anchorUtc is null ? null : DateOnly.FromDateTime(anchorUtc.Value.UtcDateTime)));
        }).WithName("GetVisualReviewMarketingTime").Produces<VisualReviewMarketingTimeDto>();
        group.MapPost("/{scenarioName}/reset", async (string scenarioName, HomeOpsDbContext dbContext, VisualReviewMarketingTimeProvider timeProvider, CancellationToken cancellationToken) =>
        {
            var result = await VisualReviewFixtureService.ApplyScenario(dbContext, scenarioName, cancellationToken);
            if (result is null) return Results.NotFound(new { error = $"Unknown visual review scenario '{scenarioName}'." });
            timeProvider.SetActiveScenario(result.ScenarioName, result.AnchorUtc);
            return Results.Ok(result);
        }).WithName("ResetVisualReviewFixtureScenario").Produces<ApplyVisualReviewScenarioResponse>().Produces(StatusCodes.Status404NotFound);
        return app;
    }
}
