namespace HomeOps.Api.ManualEvents;

public sealed class ManualEvent
{
    public Guid Id { get; set; }
    public Guid EventSourceId { get; set; }
    public EventSource? EventSource { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset StartUtc { get; set; }
    public DateTimeOffset? EndUtc { get; set; }
    public bool IsAllDay { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
