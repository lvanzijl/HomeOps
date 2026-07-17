using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public sealed class ClimateProvider
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public ProviderType ProviderType { get; set; } = ProviderType.Other;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedUtc { get; set; }
    public string? ExternalInstanceReference { get; set; }
    public string? DiagnosticMetadata { get; set; }
    public HomeAssistantResumeStrategyType HomeAssistantResumeStrategyType { get; set; } = HomeAssistantResumeStrategyType.None;
    public string? HomeAssistantResumeScriptEntityReference { get; set; }
    public string? HomeAssistantResumeClimateEntityReference { get; set; }
    public string? HomeAssistantResumePresetValue { get; set; }
    public DateTimeOffset? HomeAssistantResumeStrategyUpdatedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}

public enum ProviderType
{
    HomeAssistant,
    Other
}
