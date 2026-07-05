namespace HomeOps.Api.CalendarEvents.ICalendar;

public enum ICalFileImportFailureCategory
{
    MissingConfiguration = 0,
    MissingFile = 1,
    InvalidReference = 2,
    InvalidContent = 3,
    ParseFailure = 4,
    StorageFailure = 5,
    AccessDenied = 6,
    Unknown = 7,
}
