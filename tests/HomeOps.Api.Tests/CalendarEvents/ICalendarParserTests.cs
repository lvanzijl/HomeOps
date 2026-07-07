using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class ICalendarParserTests
{
    [Fact]
    public void ParsesSingleTimedVEvent()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:event-1
SUMMARY:Dentist
DESCRIPTION:Bring insurance card
LOCATION:Clinic
DTSTART:20260706T090000
DTEND:20260706T100000
END:VEVENT
"""));

        var calendarEvent = Assert.Single(result.Events);
        Assert.Empty(result.Diagnostics);
        Assert.Equal("event-1", calendarEvent.ProviderEventId);
        Assert.Equal("Dentist", calendarEvent.Title);
        Assert.Equal("Bring insurance card", calendarEvent.Description);
        Assert.Equal("Clinic", calendarEvent.Location);
        Assert.Equal(new DateOnly(2026, 7, 6), calendarEvent.StartDate);
        Assert.Equal(new TimeOnly(9, 0), calendarEvent.StartTime);
        Assert.Equal(new DateOnly(2026, 7, 6), calendarEvent.EndDate);
        Assert.Equal(new TimeOnly(10, 0), calendarEvent.EndTime);
        Assert.False(calendarEvent.IsAllDay);
    }

    [Fact]
    public void ParsesMultipleVEvents()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:event-1
SUMMARY:First
DTSTART:20260706T090000
DTEND:20260706T100000
END:VEVENT
BEGIN:VEVENT
UID:event-2
SUMMARY:Second
DTSTART:20260707T090000
DTEND:20260707T100000
END:VEVENT
"""));

        Assert.Collection(result.Events,
            first => Assert.Equal("event-1", first.ProviderEventId),
            second => Assert.Equal("event-2", second.ProviderEventId));
        Assert.Empty(result.Diagnostics);
    }

    [Fact]
    public void ParsesAllDayEvent()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:all-day-1
SUMMARY:School holiday
DTSTART;VALUE=DATE:20260706
DTEND;VALUE=DATE:20260707
END:VEVENT
"""));

        var calendarEvent = Assert.Single(result.Events);
        Assert.True(calendarEvent.IsAllDay);
        Assert.Equal(new DateOnly(2026, 7, 6), calendarEvent.StartDate);
        Assert.Null(calendarEvent.StartTime);
        Assert.Equal(new DateOnly(2026, 7, 7), calendarEvent.EndDate);
        Assert.Null(calendarEvent.EndTime);
    }

    [Fact]
    public void ParsesUtcFloatingAndTzidDates()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:utc-event
SUMMARY:UTC
DTSTART:20260706T130000Z
DTEND:20260706T140000Z
END:VEVENT
BEGIN:VEVENT
UID:floating-event
SUMMARY:Floating
DTSTART:20260706T090000
DTEND:20260706T100000
END:VEVENT
BEGIN:VEVENT
UID:tzid-event
SUMMARY:Time Zone
DTSTART;TZID=America/New_York:20260706T090000
DTEND;TZID=America/New_York:20260706T100000
END:VEVENT
"""));

        Assert.Equal(3, result.Events.Count);
        Assert.Empty(result.Diagnostics);
        Assert.All(result.Events, parsed => Assert.Equal(new DateOnly(2026, 7, 6), parsed.StartDate));
        Assert.All(result.Events, parsed => Assert.Equal(new TimeOnly(parsed.ProviderEventId == "utc-event" ? 13 : 9, 0), parsed.StartTime));
    }

    [Fact]
    public void ParsesMetadataAndProviderRevision()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:metadata-1
SUMMARY:Practice
DTSTART:20260706T090000Z
DTEND:20260706T100000Z
CREATED:20260701T120000Z
LAST-MODIFIED:20260702T123000Z
SEQUENCE:4
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
"""));

        var calendarEvent = Assert.Single(result.Events);
        Assert.Equal(new DateTime(2026, 7, 1, 12, 0, 0, DateTimeKind.Utc), calendarEvent.CreatedUtc);
        Assert.Equal(new DateTime(2026, 7, 2, 12, 30, 0, DateTimeKind.Utc), calendarEvent.LastModifiedUtc);
        Assert.Equal(4, calendarEvent.Sequence);
        Assert.Equal("CONFIRMED", calendarEvent.Status);
        Assert.Equal("OPAQUE", calendarEvent.Transparency);
        Assert.Equal("LAST-MODIFIED:2026-07-02T12:30:00.0000000Z;SEQUENCE:4", calendarEvent.ProviderRevision);
        Assert.Matches("^[a-f0-9]{64}$", calendarEvent.ContentFingerprint);
    }

    [Fact]
    public void MissingUidReturnsDiagnosticAndSkipsEvent()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
SUMMARY:No UID
DTSTART:20260706T090000
DTEND:20260706T100000
END:VEVENT
"""));

        Assert.Empty(result.Events);
        var diagnostic = Assert.Single(result.Diagnostics);
        Assert.Equal(ICalendarParseDiagnosticSeverity.Error, diagnostic.Severity);
        Assert.Equal("MissingUid", diagnostic.Code);
    }

    [Fact]
    public void InvalidDateRangeReturnsDiagnosticAndSkipsEvent()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:bad-range
SUMMARY:Bad Range
DTSTART:20260706T100000
DTEND:20260706T090000
END:VEVENT
"""));

        Assert.Empty(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidDateRange" && diagnostic.ProviderEventId == "bad-range");
    }

    [Fact]
    public void MalformedCalendarReturnsDiagnostic()
    {
        var result = ICalendarParser.Parse("not a calendar");

        Assert.Empty(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "MalformedCalendar");
    }


    [Fact]
    public void InvalidDtStartReturnsStructuredDiagnostic()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:invalid-start
SUMMARY:Invalid Start
DTSTART:not-a-date
DTEND:20260706T100000
END:VEVENT
"""));

        Assert.Empty(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidDTSTART" && diagnostic.PropertyName == "DTSTART");
    }

    [Fact]
    public void InvalidDtEndReturnsStructuredDiagnostic()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:invalid-end
SUMMARY:Invalid End
DTSTART:20260706T090000
DTEND:not-a-date
END:VEVENT
"""));

        Assert.Empty(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidDTEND" && diagnostic.PropertyName == "DTEND");
    }

    [Fact]
    public void InvalidDurationReturnsStructuredDiagnostic()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:invalid-duration
SUMMARY:Invalid Duration
DTSTART:20260706T090000
DURATION:not-a-duration
END:VEVENT
"""));

        Assert.Empty(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidDuration" && diagnostic.PropertyName == "DURATION");
    }

    [Fact]
    public void SupportedRecurrenceMapsToHomeOpsRecurrenceType()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:daily-1
SUMMARY:Daily standup
DTSTART:20260706T090000
DTEND:20260706T091500
RRULE:FREQ=DAILY
END:VEVENT
"""));

        var calendarEvent = Assert.Single(result.Events);
        Assert.Equal(RecurrenceType.Daily, calendarEvent.RecurrenceType);
        Assert.Equal("FREQ=DAILY", calendarEvent.RawRecurrenceRule);
        Assert.Empty(result.Diagnostics);
    }

    [Fact]
    public void UnsupportedRecurrenceReturnsDiagnosticWithoutThrowing()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:complex-recurrence
SUMMARY:Complex
DTSTART:20260706T090000
DTEND:20260706T100000
RRULE:FREQ=MONTHLY;BYDAY=1MO
END:VEVENT
"""));

        var calendarEvent = Assert.Single(result.Events);
        Assert.Equal(RecurrenceType.None, calendarEvent.RecurrenceType);
        Assert.Equal("FREQ=MONTHLY;BYDAY=1MO", calendarEvent.RawRecurrenceRule);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "UnsupportedRecurrence" && diagnostic.ProviderEventId == "complex-recurrence");
    }


    [Fact]
    public void MapsRecurrenceV2RuleAndExceptions()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:recurring-1
SUMMARY:Training
DTSTART:20260706T090000
DTEND:20260706T100000
RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=5;BYDAY=MO,WE
EXDATE:20260708T090000,20260720T090000
END:VEVENT
BEGIN:VEVENT
UID:recurring-1
RECURRENCE-ID:20260722T090000
SUMMARY:Moved Training
DESCRIPTION:Bring shoes
LOCATION:Gym B
DTSTART:20260723T110000
DTEND:20260723T120000
SEQUENCE:2
END:VEVENT
BEGIN:VEVENT
UID:recurring-1
RECURRENCE-ID:20260803T090000
STATUS:CANCELLED
DTSTART:20260803T090000
DTEND:20260803T100000
END:VEVENT
"""));

        var calendarEvent = Assert.Single(result.Events);
        Assert.Empty(result.Diagnostics);
        Assert.Equal(RecurrenceType.Weekly, calendarEvent.RecurrenceType);
        Assert.NotNull(calendarEvent.RecurrenceRule);
        Assert.Equal(RecurrenceFrequency.Weekly, calendarEvent.RecurrenceRule.Frequency);
        Assert.Equal(2, calendarEvent.RecurrenceRule.Interval);
        Assert.Equal(RecurrenceEndMode.AfterCount, calendarEvent.RecurrenceRule.EndMode);
        Assert.Equal(5, calendarEvent.RecurrenceRule.Count);
        Assert.Equal("Monday,Wednesday", calendarEvent.RecurrenceRule.WeeklyDays);
        Assert.NotNull(calendarEvent.Exceptions);
        Assert.Equal(4, calendarEvent.Exceptions.Count);
        Assert.Contains(calendarEvent.Exceptions, exception => exception.ExceptionType == EventExceptionType.Skipped && exception.OccurrenceKey.Serialize() == "2026-07-08T09:00:00");
        Assert.Contains(calendarEvent.Exceptions, exception => exception.ExceptionType == EventExceptionType.Modified && exception.OccurrenceKey.Serialize() == "2026-07-22T09:00:00" && exception.Title == "Moved Training" && exception.Location == "Gym B");
        Assert.Contains(calendarEvent.Exceptions, exception => exception.ExceptionType == EventExceptionType.Skipped && exception.OccurrenceKey.Serialize() == "2026-08-03T09:00:00" && exception.DetachedProviderEventId == "recurring-1");
    }


    [Fact]
    public void RecurrenceWithoutByRuleFieldsUsesDtStartDefaults()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:weekly-default
SUMMARY:Weekly default
DTSTART:20260708T090000
DTEND:20260708T100000
RRULE:FREQ=WEEKLY
END:VEVENT
BEGIN:VEVENT
UID:monthly-default
SUMMARY:Monthly default
DTSTART:20260708T090000
DTEND:20260708T100000
RRULE:FREQ=MONTHLY
END:VEVENT
BEGIN:VEVENT
UID:yearly-default
SUMMARY:Yearly default
DTSTART:20260708T090000
DTEND:20260708T100000
RRULE:FREQ=YEARLY
END:VEVENT
"""));

        Assert.Empty(result.Diagnostics);
        var weekly = Assert.Single(result.Events, candidate => candidate.ProviderEventId == "weekly-default");
        Assert.Equal("Wednesday", weekly.RecurrenceRule?.WeeklyDays);
        var monthly = Assert.Single(result.Events, candidate => candidate.ProviderEventId == "monthly-default");
        Assert.Equal(8, monthly.RecurrenceRule?.MonthlyDayOfMonth);
        var yearly = Assert.Single(result.Events, candidate => candidate.ProviderEventId == "yearly-default");
        Assert.Equal(7, yearly.RecurrenceRule?.YearlyMonth);
        Assert.Equal(8, yearly.RecurrenceRule?.YearlyDayOfMonth);
    }

    [Fact]
    public void UnsupportedPropertyReturnsDiagnosticWithoutSkippingEvent()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:unsupported-property
SUMMARY:Attachment
DTSTART:20260706T090000
DTEND:20260706T100000
ATTACH:https://example.test/file.pdf
END:VEVENT
"""));

        Assert.Single(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "UnsupportedProperty" && diagnostic.PropertyName == "ATTACH");
    }

    [Fact]
    public void UnsupportedTimezoneReturnsDiagnosticAndSkipsEvent()
    {
        var result = ICalendarParser.Parse(CalendarWith("""
BEGIN:VEVENT
UID:unknown-zone
SUMMARY:Unknown Zone
DTSTART;TZID=Unknown/Zone:20260706T090000
DTEND;TZID=Unknown/Zone:20260706T100000
END:VEVENT
"""));

        Assert.Empty(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "UnsupportedTimezone" && diagnostic.ProviderEventId == "unknown-zone");
    }

    private static string CalendarWith(string events) => $$"""
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HomeOps Tests//Calendar Parser//EN
{{events}}
END:VCALENDAR
""";
}
