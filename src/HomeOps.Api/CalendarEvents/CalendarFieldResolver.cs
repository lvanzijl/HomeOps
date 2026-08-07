namespace HomeOps.Api.CalendarEvents;

public sealed record CalendarFieldSet(
    DateOnly StartDate,
    TimeOnly? StartTime,
    DateOnly EndDate,
    TimeOnly? EndTime,
    bool IsAllDay);

public static class CalendarFieldResolver
{
    public static bool TryValidate(
        CalendarFieldSet fields,
        string timeZoneId,
        Dictionary<string, string[]> errors,
        string prefix = "")
    {
        var startDateKey = Key(prefix, "startDate");
        var startTimeKey = Key(prefix, "startTime");
        var endDateKey = Key(prefix, "endDate");
        var endTimeKey = Key(prefix, "endTime");

        if (fields.StartDate == default) errors[startDateKey] = ["Start date is required."];
        if (fields.EndDate == default) errors[endDateKey] = ["End date is required."];

        if (fields.IsAllDay)
        {
            if (fields.StartTime is not null) errors[startTimeKey] = ["Start time must be null for an all-day event."];
            if (fields.EndTime is not null) errors[endTimeKey] = ["End time must be null for an all-day event."];
        }
        else
        {
            if (fields.StartTime is null) errors[startTimeKey] = ["Start time is required for a timed event."];
            if (fields.EndTime is null) errors[endTimeKey] = ["End time is required for a timed event."];
        }

        if (errors.Count > 0)
        {
            return false;
        }

        if (fields.EndDate < fields.StartDate ||
            !fields.IsAllDay && fields.EndDate == fields.StartDate && fields.EndTime < fields.StartTime)
        {
            errors[endDateKey] = ["Event end must be on or after event start."];
            return false;
        }

        if (!fields.IsAllDay)
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            ValidateWallTime(fields.StartDate, fields.StartTime!.Value, zone, startTimeKey, errors);
            ValidateWallTime(fields.EndDate, fields.EndTime!.Value, zone, endTimeKey, errors);
        }

        return errors.Count == 0;
    }

    public static DateTimeOffset Resolve(DateOnly date, TimeOnly time, string timeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var local = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);
        if (zone.IsInvalidTime(local))
        {
            throw new ArgumentException($"{time:HH\\:mm} does not occur in {timeZoneId} on {date:yyyy-MM-dd} because clocks move forward.");
        }

        var offset = zone.IsAmbiguousTime(local)
            ? zone.GetAmbiguousTimeOffsets(local).Max()
            : zone.GetUtcOffset(local);
        return new DateTimeOffset(local, offset);
    }

    public static CalendarFieldSet FromLegacy(DateTimeOffset startUtc, DateTimeOffset? endUtc, bool isAllDay)
    {
        var effectiveEnd = endUtc ?? startUtc;
        return new CalendarFieldSet(
            DateOnly.FromDateTime(startUtc.UtcDateTime),
            isAllDay ? null : TimeOnly.FromDateTime(startUtc.UtcDateTime),
            DateOnly.FromDateTime(effectiveEnd.UtcDateTime),
            isAllDay ? null : TimeOnly.FromDateTime(effectiveEnd.UtcDateTime),
            isAllDay);
    }

    private static void ValidateWallTime(DateOnly date, TimeOnly time, TimeZoneInfo zone, string key, Dictionary<string, string[]> errors)
    {
        var local = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);
        if (zone.IsInvalidTime(local))
        {
            errors[key] = [$"{time:HH\\:mm} does not occur in {zone.Id} on {date:yyyy-MM-dd} because clocks move forward."];
        }
    }

    private static string Key(string prefix, string field) => string.IsNullOrEmpty(prefix) ? field : $"{prefix}.{field}";
}
