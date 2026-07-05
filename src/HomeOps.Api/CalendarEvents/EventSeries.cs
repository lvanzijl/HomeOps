namespace HomeOps.Api.CalendarEvents;

public sealed class EventSeries
{
    public Guid Id { get; set; }
    public Guid EventSourceId { get; set; }
    public EventSource? EventSource { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public bool IsAllDay { get; set; }
    public DateOnly StartDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly? EndTime { get; set; }
    public RecurrenceType RecurrenceType { get; set; } = RecurrenceType.None;
    public string? ProviderEventId { get; set; }
    public string? ProviderInstanceId { get; set; }
    public string? ProviderRevision { get; set; }
    public string? ContentFingerprint { get; set; }
    public DateTimeOffset? ImportedAtUtc { get; set; }
    public DateTimeOffset? LastImportedUtc { get; set; }
    public DateTimeOffset? LastSeenSyncAttemptUtc { get; set; }
    public ICollection<EventException> Exceptions { get; set; } = new List<EventException>();
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
