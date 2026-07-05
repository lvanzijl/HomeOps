namespace HomeOps.Api.CalendarEvents.ICalendar;

public enum ICalFeedImportFailureCategory
{
    InvalidConfiguration = 0,
    InvalidUrl = 1,
    UnsupportedScheme = 2,
    NetworkFailure = 3,
    Timeout = 4,
    Unauthorized = 5,
    Forbidden = 6,
    NotFound = 7,
    ServerError = 8,
    InvalidContent = 9,
    ParseFailure = 10,
    Unknown = 11,
}
