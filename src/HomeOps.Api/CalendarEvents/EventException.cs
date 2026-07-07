namespace HomeOps.Api.CalendarEvents;

public sealed class EventException
{
    public Guid Id { get; set; }
    public Guid EventSeriesId { get; set; }
    public EventSeries? EventSeries { get; set; }
    public DateOnly OccurrenceDate { get; set; }
    public OccurrenceKey OccurrenceKey { get; set; }
    public EventExceptionType ExceptionType { get; set; } = EventExceptionType.Modified;
    public bool IsSkipped { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool? IsAllDay { get; set; }
    public DateOnly? StartDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public DateOnly? EndDate { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? RawProviderRecurrenceId { get; set; }
    public string? NormalizedProviderRecurrenceId { get; set; }
    public string? DetachedProviderEventId { get; set; }
    public string? DetachedProviderRevision { get; set; }
    public string? DetachedContentFingerprint { get; set; }
    public string? RawDetachedRecurrenceMetadata { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}

public enum EventExceptionType
{
    Skipped = 1,
    Modified = 2,
}
