namespace HomeOps.Contracts.Events;

/// <summary>
/// Identifies the origin family for a normalized event source.
/// </summary>
public enum EventSourceType
{
    Manual = 0,
    GoogleCalendar = 1,
    Birthdays = 2,
    TvSeries = 3,
    SchoolHolidays = 4,
    External = 99
}
