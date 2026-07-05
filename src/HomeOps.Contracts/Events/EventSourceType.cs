namespace HomeOps.Contracts.Events;

/// <summary>
/// Identifies the origin family for a normalized event source.
/// </summary>
public enum EventSourceType
{
    Manual = 0,
    ICalFeed = 1,
    ICalFile = 2,
    GoogleCalendar = 3,
    CalDav = 4,
    Exchange = 5,
    SchoolHolidays = 6,
    TvSeries = 7,
    Provider = 99,
    Birthdays = 100
}
