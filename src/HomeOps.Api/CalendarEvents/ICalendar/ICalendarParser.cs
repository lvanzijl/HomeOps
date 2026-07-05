using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using IcalCalendar = Ical.Net.Calendar;
using Ical.Net;
using Ical.Net.CalendarComponents;
using Ical.Net.DataTypes;

namespace HomeOps.Api.CalendarEvents.ICalendar;

public static class ICalendarParser
{
    private static readonly HashSet<string> SupportedEventProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "UID", "SUMMARY", "DESCRIPTION", "LOCATION", "DTSTART", "DTEND", "DURATION", "LAST-MODIFIED", "CREATED",
        "SEQUENCE", "STATUS", "TRANSP", "RRULE", "DTSTAMP", "BEGIN", "END",
    };

    public static ICalendarParseResult Parse(string? content)
    {
        var diagnostics = new List<ICalendarParseDiagnostic>();
        var events = new List<NormalizedICalendarEvent>();

        if (string.IsNullOrWhiteSpace(content))
        {
            diagnostics.Add(Error("MalformedCalendar", "iCalendar content is empty."));
            return new ICalendarParseResult(events, diagnostics);
        }

        var explicitUids = ExtractExplicitUids(content);
        var invalidEventUids = AddMalformedPropertyDiagnostics(content, diagnostics);

        IcalCalendar? calendar;
        try
        {
            calendar = IcalCalendar.Load(content);
        }
        catch (Exception exception) when (exception is FormatException or ArgumentException or InvalidOperationException or System.Runtime.Serialization.SerializationException)
        {
            diagnostics.Add(Error("MalformedCalendar", "iCalendar content could not be parsed."));
            return new ICalendarParseResult(events, diagnostics);
        }

        if (calendar is null)
        {
            diagnostics.Add(Error("MalformedCalendar", "iCalendar content could not be parsed."));
            return new ICalendarParseResult(events, diagnostics);
        }

        foreach (var calendarEvent in calendar.Events)
        {
            AddUnsupportedPropertyDiagnostics(calendarEvent, diagnostics);

            var uidProperty = calendarEvent.Properties.FirstOrDefault(property => string.Equals(property.Name, "UID", StringComparison.OrdinalIgnoreCase));
            var uid = uidProperty?.Value?.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(uid) || !explicitUids.Contains(uid))
            {
                diagnostics.Add(Error("MissingUid", "VEVENT is missing a required UID property.", propertyName: "UID"));
                continue;
            }

            if (invalidEventUids.Contains(uid))
            {
                continue;
            }

            if (!TryReadDateRange(calendarEvent, uid, diagnostics, out var startDate, out var startTime, out var endDate, out var endTime, out var isAllDay))
            {
                continue;
            }

            var recurrenceType = MapRecurrence(calendarEvent, uid, diagnostics, out var rawRecurrenceRule);
            var createdUtc = ToUtcDateTime(calendarEvent.Created, uid, diagnostics, "CREATED");
            var lastModifiedUtc = ToUtcDateTime(calendarEvent.LastModified, uid, diagnostics, "LAST-MODIFIED");
            var title = string.IsNullOrWhiteSpace(calendarEvent.Summary) ? "Untitled event" : calendarEvent.Summary.Trim();
            var description = NormalizeOptionalText(calendarEvent.Description);
            var location = NormalizeOptionalText(calendarEvent.Location);
            var providerRevision = BuildProviderRevision(calendarEvent.Sequence, lastModifiedUtc);
            var status = NormalizeOptionalText(calendarEvent.Status);
            var transparency = NormalizeOptionalText(calendarEvent.Transparency);
            var fingerprint = BuildContentFingerprint(uid, title, description, location, startDate, startTime, endDate, endTime, isAllDay, recurrenceType, rawRecurrenceRule, status, transparency);

            events.Add(new NormalizedICalendarEvent(
                ProviderEventId: uid,
                ProviderRevision: providerRevision,
                ContentFingerprint: fingerprint,
                Title: title,
                Description: description,
                Location: location,
                StartDate: startDate,
                StartTime: startTime,
                EndDate: endDate,
                EndTime: endTime,
                IsAllDay: isAllDay,
                CreatedUtc: createdUtc,
                LastModifiedUtc: lastModifiedUtc,
                Sequence: calendarEvent.Sequence,
                Status: status,
                Transparency: transparency,
                RecurrenceType: recurrenceType,
                RawRecurrenceRule: rawRecurrenceRule));
        }

        return new ICalendarParseResult(events, diagnostics);
    }



    private static HashSet<string> AddMalformedPropertyDiagnostics(string content, List<ICalendarParseDiagnostic> diagnostics)
    {
        var invalidUids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var inEvent = false;
        var currentUid = string.Empty;
        var currentInvalid = false;

        using var reader = new StringReader(content);
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            if (line.Equals("BEGIN:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                inEvent = true;
                currentUid = string.Empty;
                currentInvalid = false;
                continue;
            }

            if (line.Equals("END:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                if (currentInvalid && !string.IsNullOrWhiteSpace(currentUid))
                {
                    invalidUids.Add(currentUid);
                }

                inEvent = false;
                continue;
            }

            if (!inEvent)
            {
                continue;
            }

            var separatorIndex = line.IndexOf(':', StringComparison.Ordinal);
            if (separatorIndex < 0)
            {
                continue;
            }

            var propertyName = line[..separatorIndex].Split(';', 2)[0];
            var value = line[(separatorIndex + 1)..].Trim();
            if (propertyName.Equals("UID", StringComparison.OrdinalIgnoreCase))
            {
                currentUid = value;
            }
            else if (propertyName.Equals("DTSTART", StringComparison.OrdinalIgnoreCase) && !LooksLikeIcalendarDate(value))
            {
                currentInvalid = true;
                diagnostics.Add(Error("InvalidDTSTART", "VEVENT has an invalid DTSTART value.", propertyName: "DTSTART"));
            }
            else if (propertyName.Equals("DTEND", StringComparison.OrdinalIgnoreCase) && !LooksLikeIcalendarDate(value))
            {
                currentInvalid = true;
                diagnostics.Add(Error("InvalidDTEND", "VEVENT has an invalid DTEND value.", propertyName: "DTEND"));
            }
            else if (propertyName.Equals("DURATION", StringComparison.OrdinalIgnoreCase) && !LooksLikeIcalendarDuration(value))
            {
                currentInvalid = true;
                diagnostics.Add(Error("InvalidDuration", "VEVENT has an invalid DURATION value.", propertyName: "DURATION"));
            }
        }

        return invalidUids;
    }

    private static bool LooksLikeIcalendarDate(string value)
    {
        var normalized = value.TrimEnd('Z');
        return DateTime.TryParseExact(normalized, ["yyyyMMdd", "yyyyMMdd'T'HHmmss"], CultureInfo.InvariantCulture, DateTimeStyles.None, out _);
    }

    private static bool LooksLikeIcalendarDuration(string value)
    {
        return value.Length > 1 && (value[0] == 'P' || value.StartsWith("-P", StringComparison.Ordinal));
    }

    private static HashSet<string> ExtractExplicitUids(string content)
    {
        var uids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using var reader = new StringReader(content);
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            if (!line.StartsWith("UID", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var separatorIndex = line.IndexOf(':', StringComparison.Ordinal);
            if (separatorIndex < 0)
            {
                continue;
            }

            var value = line[(separatorIndex + 1)..].Trim();
            if (!string.IsNullOrWhiteSpace(value))
            {
                uids.Add(value);
            }
        }

        return uids;
    }

    private static bool TryReadDateRange(
        CalendarEvent calendarEvent,
        string uid,
        List<ICalendarParseDiagnostic> diagnostics,
        out DateOnly startDate,
        out TimeOnly? startTime,
        out DateOnly endDate,
        out TimeOnly? endTime,
        out bool isAllDay)
    {
        startDate = default;
        startTime = null;
        endDate = default;
        endTime = null;
        isAllDay = false;

        if (!TryReadEventDateTime(calendarEvent.DtStart, uid, diagnostics, "DTSTART", required: true, out startDate, out startTime, out var startComparable))
        {
            return false;
        }

        var endValue = calendarEvent.DtEnd ?? calendarEvent.End;
        if (!TryReadEventDateTime(endValue, uid, diagnostics, "DTEND", required: false, out endDate, out endTime, out var endComparable))
        {
            return false;
        }

        if (endValue is null)
        {
            endDate = startDate;
            endTime = startTime;
            endComparable = startComparable;
        }

        isAllDay = calendarEvent.DtStart is not null && (!calendarEvent.DtStart.HasTime || calendarEvent.IsAllDay);
        if (isAllDay)
        {
            startTime = null;
            endTime = null;
        }

        if (endComparable < startComparable)
        {
            diagnostics.Add(Error("InvalidDateRange", "VEVENT DTEND must not be earlier than DTSTART.", uid, "DTEND"));
            return false;
        }

        return true;
    }

    private static bool TryReadEventDateTime(CalDateTime? value, string uid, List<ICalendarParseDiagnostic> diagnostics, string propertyName, bool required, out DateOnly date, out TimeOnly? time, out DateTime comparable)
    {
        date = default;
        time = null;
        comparable = default;

        if (value is null || value.Year <= 1)
        {
            if (required)
            {
                diagnostics.Add(Error($"Invalid{propertyName}", $"VEVENT has an invalid or missing {propertyName} property.", uid, propertyName));
            }
            return !required;
        }

        if (!ValidateTimezone(value, uid, diagnostics, propertyName))
        {
            return false;
        }

        try
        {
            date = value.Date;
            time = value.HasTime ? value.Time : null;
            comparable = value.HasTime ? new DateTime(value.Year, value.Month, value.Day, value.Hour, value.Minute, value.Second) : value.Date.ToDateTime(TimeOnly.MinValue);
            return true;
        }
        catch (ArgumentOutOfRangeException)
        {
            diagnostics.Add(Error($"Invalid{propertyName}", $"VEVENT has an invalid {propertyName} value.", uid, propertyName));
            return false;
        }
    }

    private static bool ValidateTimezone(CalDateTime value, string uid, List<ICalendarParseDiagnostic> diagnostics, string propertyName)
    {
        if (value.IsUtc || value.IsFloating || string.IsNullOrWhiteSpace(value.TzId))
        {
            return true;
        }

        try
        {
            _ = TimeZoneInfo.FindSystemTimeZoneById(value.TzId);
            return true;
        }
        catch (TimeZoneNotFoundException)
        {
            diagnostics.Add(Error("UnsupportedTimezone", $"VEVENT uses unsupported time zone '{value.TzId}'.", uid, propertyName));
            return false;
        }
        catch (InvalidTimeZoneException)
        {
            diagnostics.Add(Error("UnsupportedTimezone", $"VEVENT uses invalid time zone '{value.TzId}'.", uid, propertyName));
            return false;
        }
    }

    private static DateTime? ToUtcDateTime(CalDateTime? value, string uid, List<ICalendarParseDiagnostic> diagnostics, string propertyName)
    {
        if (value is null || value.Year <= 1)
        {
            return null;
        }

        if (!ValidateTimezone(value, uid, diagnostics, propertyName))
        {
            return null;
        }

        if (value.IsUtc)
        {
            return DateTime.SpecifyKind(value.AsUtc, DateTimeKind.Utc);
        }

        if (!string.IsNullOrWhiteSpace(value.TzId) && !value.IsFloating)
        {
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(value.TzId);
            var local = new DateTime(value.Year, value.Month, value.Day, value.Hour, value.Minute, value.Second, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(local, timeZone);
        }

        return DateTime.SpecifyKind(new DateTime(value.Year, value.Month, value.Day, value.Hour, value.Minute, value.Second), DateTimeKind.Unspecified);
    }

    private static RecurrenceType MapRecurrence(CalendarEvent calendarEvent, string uid, List<ICalendarParseDiagnostic> diagnostics, out string? rawRecurrenceRule)
    {
        rawRecurrenceRule = calendarEvent.Properties.FirstOrDefault(property => string.Equals(property.Name, "RRULE", StringComparison.OrdinalIgnoreCase))?.Value?.ToString();
        var rule = calendarEvent.RecurrenceRule;
        if (rule is null)
        {
            return RecurrenceType.None;
        }

        if (rule.Interval != 1 || rule.Count is not null || rule.Until is not null ||
            rule.BySecond.Count > 0 || rule.ByMinute.Count > 0 || rule.ByHour.Count > 0 || rule.ByDay.Count > 0 ||
            rule.ByMonthDay.Count > 0 || rule.ByYearDay.Count > 0 || rule.ByWeekNo.Count > 0 || rule.ByMonth.Count > 0 || rule.BySetPosition.Count > 0)
        {
            diagnostics.Add(Warning("UnsupportedRecurrence", "VEVENT RRULE is not representable by the current HomeOps recurrence model.", uid, "RRULE"));
            return RecurrenceType.None;
        }

        return rule.Frequency switch
        {
            FrequencyType.Daily => RecurrenceType.Daily,
            FrequencyType.Weekly => RecurrenceType.Weekly,
            FrequencyType.Monthly => RecurrenceType.Monthly,
            FrequencyType.Yearly => RecurrenceType.Yearly,
            _ => UnsupportedRecurrence(uid, diagnostics),
        };
    }

    private static RecurrenceType UnsupportedRecurrence(string uid, List<ICalendarParseDiagnostic> diagnostics)
    {
        diagnostics.Add(Warning("UnsupportedRecurrence", "VEVENT RRULE frequency is not representable by the current HomeOps recurrence model.", uid, "RRULE"));
        return RecurrenceType.None;
    }

    private static void AddUnsupportedPropertyDiagnostics(CalendarEvent calendarEvent, List<ICalendarParseDiagnostic> diagnostics)
    {
        foreach (var propertyName in calendarEvent.Properties.Select(property => property.Name).Where(name => !SupportedEventProperties.Contains(name)).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            diagnostics.Add(Warning("UnsupportedProperty", $"VEVENT property '{propertyName}' is not normalized by HomeOps.", calendarEvent.Uid, propertyName));
        }
    }

    private static string? BuildProviderRevision(int sequence, DateTime? lastModifiedUtc)
    {
        if (lastModifiedUtc is not null)
        {
            return $"LAST-MODIFIED:{lastModifiedUtc.Value.ToString("O", CultureInfo.InvariantCulture)};SEQUENCE:{sequence}";
        }

        return sequence > 0 ? $"SEQUENCE:{sequence}" : null;
    }

    private static string BuildContentFingerprint(params object?[] values)
    {
        var normalized = string.Join('\u001f', values.Select(value => value?.ToString() ?? string.Empty));
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string? NormalizeOptionalText(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ICalendarParseDiagnostic Error(string code, string message, string? providerEventId = null, string? propertyName = null) =>
        new(ICalendarParseDiagnosticSeverity.Error, code, message, providerEventId, propertyName);

    private static ICalendarParseDiagnostic Warning(string code, string message, string? providerEventId = null, string? propertyName = null) =>
        new(ICalendarParseDiagnosticSeverity.Warning, code, message, providerEventId, propertyName);
}
