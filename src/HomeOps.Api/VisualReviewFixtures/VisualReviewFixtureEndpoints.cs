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
        group.MapPost("/{scenarioName}/reset", async (string scenarioName, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var result = await VisualReviewFixtureService.ApplyScenario(dbContext, scenarioName, cancellationToken);
            return result is null ? Results.NotFound(new { error = $"Unknown visual review scenario '{scenarioName}'." }) : Results.Ok(result);
        }).WithName("ResetVisualReviewFixtureScenario").Produces<ApplyVisualReviewScenarioResponse>().Produces(StatusCodes.Status404NotFound);
        return app;
    }
}
