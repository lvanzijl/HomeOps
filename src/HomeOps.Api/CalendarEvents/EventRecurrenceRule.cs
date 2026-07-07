namespace HomeOps.Api.CalendarEvents;

public sealed class EventRecurrenceRule
{
    public RecurrenceFrequency Frequency { get; set; }
    public int Interval { get; set; } = 1;
    public RecurrenceEndMode EndMode { get; set; } = RecurrenceEndMode.Never;
    public DateOnly? UntilDate { get; set; }
    public int? Count { get; set; }
    public string? WeeklyDays { get; set; }
    public int? MonthlyDayOfMonth { get; set; }
    public int? YearlyMonth { get; set; }
    public int? YearlyDayOfMonth { get; set; }
    public string? RawProviderRecurrenceRule { get; set; }
    public UnsupportedRecurrenceStatus UnsupportedRecurrenceStatus { get; set; } = UnsupportedRecurrenceStatus.Supported;
    public string? UnsupportedRecurrenceReason { get; set; }
}

public enum RecurrenceFrequency
{
    Daily = 1,
    Weekly = 2,
    Monthly = 3,
    Yearly = 4,
}

public enum RecurrenceEndMode
{
    Never = 0,
    OnDate = 1,
    AfterCount = 2,
}

public enum UnsupportedRecurrenceStatus
{
    None = 0,
    Supported = 1,
    Unsupported = 2,
}
