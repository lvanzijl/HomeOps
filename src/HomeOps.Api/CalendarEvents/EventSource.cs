using HomeOps.Api.Households;

namespace HomeOps.Api.CalendarEvents;

public sealed class EventSource
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public bool IsWritable { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public ICollection<EventSeries> EventSeries { get; set; } = new System.Collections.Generic.List<EventSeries>();
}
