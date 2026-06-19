namespace HomeOps.Api.CalendarEvents;

public sealed class EventException
{
    public Guid Id { get; set; }
    public Guid EventSeriesId { get; set; }
    public EventSeries? EventSeries { get; set; }
    public DateOnly OccurrenceDate { get; set; }
    public bool IsSkipped { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateOnly? StartDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public DateOnly? EndDate { get; set; }
    public TimeOnly? EndTime { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
