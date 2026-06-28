namespace HomeOps.Api.VisualReviewFixtures;

public sealed class VisualReviewMarketingTimeProvider
{
    private DateTimeOffset? activeMarketingAnchorUtc;

    public DateTimeOffset? ActiveMarketingAnchorUtc => activeMarketingAnchorUtc;

    public void SetActiveScenario(string scenarioName, DateTimeOffset anchorUtc)
    {
        activeMarketingAnchorUtc = scenarioName.StartsWith("visual-marketing-", StringComparison.OrdinalIgnoreCase)
            ? anchorUtc
            : null;
    }
}

public sealed record VisualReviewMarketingTimeDto(DateTimeOffset? AnchorUtc, DateOnly? Today);
