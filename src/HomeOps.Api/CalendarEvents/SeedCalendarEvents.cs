namespace HomeOps.Api.CalendarEvents;

public static class SeedCalendarEvents
{
    public static readonly DateTimeOffset SeededUtc = new(2026, 6, 19, 0, 0, 0, TimeSpan.Zero);

    public static readonly Guid EventSourceId = Guid.Parse("12121212-1212-1212-1212-121212121212");
    public static readonly Guid DentistAppointmentId = Guid.Parse("13131313-1313-1313-1313-131313131313");
    public static readonly Guid ParentEveningId = Guid.Parse("14141414-1414-1414-1414-141414141414");
    public static readonly Guid VacationId = Guid.Parse("15151515-1515-1515-1515-151515151515");
    public static readonly Guid PutBinsOutsideId = Guid.Parse("16161616-1616-1616-1616-161616161616");
}
