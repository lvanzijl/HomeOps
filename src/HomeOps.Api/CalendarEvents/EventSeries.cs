namespace HomeOps.Api.CalendarEvents;

public sealed class EventSeries
{
    public Guid Id { get; set; }
    public Guid EventSourceId { get; set; }
    public EventSource? EventSource { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsAllDay { get; set; }
    public DateOnly StartDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly? EndTime { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
