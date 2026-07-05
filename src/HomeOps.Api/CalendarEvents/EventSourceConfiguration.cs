namespace HomeOps.Api.CalendarEvents;

public abstract class EventSourceConfiguration
{
    public Guid EventSourceId { get; set; }
    public EventSource? EventSource { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
