namespace HomeOps.Api.CalendarEvents;

public sealed class ICalFeedSourceConfiguration : EventSourceConfiguration
{
    public string FeedUrl { get; set; } = string.Empty;
    public string? ETag { get; set; }
    public string? LastModified { get; set; }
    public string? LastContentHash { get; set; }
}
