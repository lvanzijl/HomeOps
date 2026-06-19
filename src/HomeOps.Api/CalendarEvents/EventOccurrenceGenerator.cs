namespace HomeOps.Api.CalendarEvents;

public static class EventOccurrenceGenerator
{
    public static IReadOnlyCollection<EventOccurrence> Generate(EventSeries series, string householdTimeZoneId, DateOnly startsOn, DateOnly endsOn)
    {
        var occurrences = new List<EventOccurrence>();
        var durationDays = series.EndDate.DayNumber - series.StartDate.DayNumber;
        var exceptions = series.Exceptions.ToDictionary(exception => exception.OccurrenceDate);

        for (var occurrenceDate = series.StartDate; occurrenceDate <= endsOn; occurrenceDate = NextOccurrenceDate(series, occurrenceDate))
        {
            if (occurrenceDate < startsOn && series.RecurrenceType == RecurrenceType.None)
            {
                break;
            }

            if (occurrenceDate > endsOn)
            {
                break;
            }

            if (occurrenceDate >= startsOn)
            {
                if (!exceptions.TryGetValue(occurrenceDate, out var exception) || !exception.IsSkipped)
                {
                    occurrences.Add(ToOccurrence(series, exception, occurrenceDate, durationDays, householdTimeZoneId));
                }
            }

            if (series.RecurrenceType == RecurrenceType.None)
            {
                break;
            }
        }

        return occurrences;
    }

    private static DateOnly NextOccurrenceDate(EventSeries series, DateOnly current) => series.RecurrenceType switch
    {
        RecurrenceType.Daily => current.AddDays(1),
        RecurrenceType.Weekly => current.AddDays(7),
        RecurrenceType.Monthly => current.AddMonths(1),
        RecurrenceType.Yearly => current.AddYears(1),
        _ => DateOnly.MaxValue,
    };

    private static EventOccurrence ToOccurrence(EventSeries series, EventException? exception, DateOnly occurrenceDate, int durationDays, string timeZoneId)
    {
        var startDate = exception?.StartDate ?? occurrenceDate;
        var endDate = exception?.EndDate ?? startDate.AddDays(durationDays);
        var title = string.IsNullOrWhiteSpace(exception?.Title) ? series.Title : exception!.Title!;
        var description = exception?.Description ?? series.Description;
        var startTime = series.IsAllDay ? new TimeOnly(0, 0) : exception?.StartTime ?? series.StartTime ?? new TimeOnly(0, 0);
        var endTime = series.IsAllDay ? new TimeOnly(0, 0) : exception?.EndTime ?? series.EndTime ?? startTime;
        var id = exception?.Id ?? (series.RecurrenceType == RecurrenceType.None ? series.Id : DeterministicOccurrenceId(series.Id, occurrenceDate));

        return new EventOccurrence(id, series.Id, series.EventSourceId, title, description, ToLocalOffset(startDate, startTime, timeZoneId), ToLocalOffset(endDate, endTime, timeZoneId), series.IsAllDay, true);
    }

    private static DateTimeOffset ToLocalOffset(DateOnly date, TimeOnly time, string timeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var local = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);
        return new DateTimeOffset(local, zone.GetUtcOffset(local));
    }

    private static Guid DeterministicOccurrenceId(Guid seriesId, DateOnly date)
    {
        Span<byte> bytes = stackalloc byte[16];
        seriesId.TryWriteBytes(bytes);
        var day = date.DayNumber;
        bytes[12] ^= (byte)(day & 0xff);
        bytes[13] ^= (byte)((day >> 8) & 0xff);
        bytes[14] ^= (byte)((day >> 16) & 0xff);
        bytes[15] ^= (byte)((day >> 24) & 0xff);
        return new Guid(bytes);
    }
}
