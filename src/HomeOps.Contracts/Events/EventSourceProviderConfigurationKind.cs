namespace HomeOps.Contracts.Events;

/// <summary>
/// Discriminator for provider-safe Calendar Source configuration contracts.
/// </summary>
public enum EventSourceProviderConfigurationKind
{
    ICalFeed = 0,
    ICalFile = 1
}
