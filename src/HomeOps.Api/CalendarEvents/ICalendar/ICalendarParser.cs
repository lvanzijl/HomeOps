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
        "SEQUENCE", "STATUS", "TRANSP", "RRULE", "EXDATE", "RECURRENCE-ID", "DTSTAMP", "BEGIN", "END",
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

        var eventBlocks = ExtractEventBlocks(content);
        var detachedBlocks = eventBlocks.Where(block => block.RecurrenceId is not null).GroupBy(block => block.Uid, StringComparer.Ordinal).ToDictionary(group => group.Key, group => group.ToList(), StringComparer.Ordinal);

        foreach (var calendarEvent in calendar.Events.Where(candidate => GetPropertyValue(candidate, "RECURRENCE-ID") is null))
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

            var block = eventBlocks.FirstOrDefault(candidate => string.Equals(candidate.Uid, uid, StringComparison.Ordinal) && candidate.RecurrenceId is null);
            var recurrenceRule = MapRecurrenceRule(calendarEvent, block, uid, startDate, startTime, diagnostics, out var recurrenceType, out var rawRecurrenceRule);
            var exceptions = MapExceptions(uid, calendar, block, detachedBlocks.TryGetValue(uid, out var uidDetachedBlocks) ? uidDetachedBlocks : [], recurrenceRule, startTime, diagnostics);
            var createdUtc = ToUtcDateTime(calendarEvent.Created, uid, diagnostics, "CREATED");
            var lastModifiedUtc = ToUtcDateTime(calendarEvent.LastModified, uid, diagnostics, "LAST-MODIFIED");
            var title = string.IsNullOrWhiteSpace(calendarEvent.Summary) ? "Untitled event" : calendarEvent.Summary.Trim();
            var description = NormalizeOptionalText(calendarEvent.Description);
            var location = NormalizeOptionalText(calendarEvent.Location);
            var providerRevision = BuildProviderRevision(calendarEvent.Sequence, lastModifiedUtc);
            var status = NormalizeOptionalText(calendarEvent.Status);
            var transparency = NormalizeOptionalText(calendarEvent.Transparency);
            var fingerprint = BuildContentFingerprint(uid, title, description, location, startDate, startTime, endDate, endTime, isAllDay, recurrenceType, rawRecurrenceRule, status, transparency, string.Join("|", exceptions.Select(exception => $"{exception.OccurrenceKey.Serialize()}:{exception.ExceptionType}:{exception.DetachedContentFingerprint}:{exception.RawProviderRecurrenceId}")));

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
                RawRecurrenceRule: rawRecurrenceRule,
                RecurrenceRule: recurrenceRule,
                Exceptions: exceptions));
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

    private static EventRecurrenceRule? MapRecurrenceRule(CalendarEvent calendarEvent, ParsedEventBlock? block, string uid, DateOnly firstDate, TimeOnly? firstTime, List<ICalendarParseDiagnostic> diagnostics, out RecurrenceType recurrenceType, out string? rawRecurrenceRule)
    {
        recurrenceType = RecurrenceType.None;
        rawRecurrenceRule = block?.RRule ?? calendarEvent.Properties.FirstOrDefault(property => string.Equals(property.Name, "RRULE", StringComparison.OrdinalIgnoreCase))?.Value?.ToString();
        if (string.IsNullOrWhiteSpace(rawRecurrenceRule))
        {
            return null;
        }

        var tokens = ParsePropertyTokens(rawRecurrenceRule);
        var unsupported = new List<string>();
        if (!tokens.TryGetValue("FREQ", out var frequencyValue))
        {
            unsupported.Add("missing FREQ");
        }

        var rule = new EventRecurrenceRule { RawProviderRecurrenceRule = rawRecurrenceRule };
        switch (frequencyValue?.ToUpperInvariant())
        {
            case "DAILY":
                rule.Frequency = RecurrenceFrequency.Daily;
                recurrenceType = RecurrenceType.Daily;
                break;
            case "WEEKLY":
                rule.Frequency = RecurrenceFrequency.Weekly;
                recurrenceType = RecurrenceType.Weekly;
                break;
            case "MONTHLY":
                rule.Frequency = RecurrenceFrequency.Monthly;
                recurrenceType = RecurrenceType.Monthly;
                break;
            case "YEARLY":
                rule.Frequency = RecurrenceFrequency.Yearly;
                recurrenceType = RecurrenceType.Yearly;
                break;
            default:
                unsupported.Add("unsupported FREQ");
                break;
        }

        rule.Interval = tokens.TryGetValue("INTERVAL", out var intervalValue) && int.TryParse(intervalValue, CultureInfo.InvariantCulture, out var interval) ? interval : 1;
        if (rule.Interval <= 0)
        {
            unsupported.Add("non-positive INTERVAL");
        }

        if (tokens.ContainsKey("COUNT") && tokens.ContainsKey("UNTIL"))
        {
            unsupported.Add("COUNT and UNTIL together");
        }
        else if (tokens.TryGetValue("COUNT", out var countValue))
        {
            if (int.TryParse(countValue, CultureInfo.InvariantCulture, out var count) && count > 0)
            {
                rule.EndMode = RecurrenceEndMode.AfterCount;
                rule.Count = count;
            }
            else
            {
                unsupported.Add("invalid COUNT");
            }
        }
        else if (tokens.TryGetValue("UNTIL", out var untilValue))
        {
            if (TryParseIcalendarDate(untilValue, out var untilDate))
            {
                rule.EndMode = RecurrenceEndMode.OnDate;
                rule.UntilDate = untilDate;
            }
            else
            {
                unsupported.Add("invalid UNTIL");
            }
        }

        foreach (var key in tokens.Keys)
        {
            if (key is not ("FREQ" or "INTERVAL" or "COUNT" or "UNTIL" or "BYDAY" or "BYMONTHDAY" or "BYMONTH"))
            {
                unsupported.Add($"unsupported {key}");
            }
        }

        ApplyByRuleFields(rule, tokens, firstDate, unsupported);
        var validation = EventRecurrenceRuleValidation.Validate(rule, firstDate);
        if (!validation.IsValid)
        {
            unsupported.AddRange(validation.Errors);
        }

        if (unsupported.Count > 0)
        {
            recurrenceType = RecurrenceType.None;
            diagnostics.Add(Warning("UnsupportedRecurrence", $"VEVENT RRULE is not representable by HomeOps Recurrence V2: {string.Join(", ", unsupported.Distinct(StringComparer.Ordinal))}.", uid, "RRULE"));
            return new EventRecurrenceRule
            {
                RawProviderRecurrenceRule = rawRecurrenceRule,
                UnsupportedRecurrenceStatus = UnsupportedRecurrenceStatus.Unsupported,
                UnsupportedRecurrenceReason = string.Join("; ", unsupported.Distinct(StringComparer.Ordinal)),
            };
        }

        rule.UnsupportedRecurrenceStatus = UnsupportedRecurrenceStatus.Supported;
        return rule;
    }

    private static void ApplyByRuleFields(EventRecurrenceRule rule, Dictionary<string, string> tokens, DateOnly firstDate, List<string> unsupported)
    {
        if (tokens.TryGetValue("BYDAY", out var byDay))
        {
            var values = byDay.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (rule.Frequency != RecurrenceFrequency.Weekly || values.Length == 0 || values.Any(value => value.Any(char.IsDigit)))
            {
                unsupported.Add("unsupported BYDAY");
            }
            else
            {
                try
                {
                    rule.WeeklyDays = WeeklyDays.Serialize(values.Select(ParseWeekday));
                }
                catch (ArgumentException exception)
                {
                    unsupported.Add(exception.Message);
                }
            }
        }

        if (tokens.TryGetValue("BYMONTHDAY", out var byMonthDay))
        {
            var values = byMonthDay.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (values.Length != 1 || !int.TryParse(values[0], CultureInfo.InvariantCulture, out var day) || day <= 0)
            {
                unsupported.Add("unsupported BYMONTHDAY");
            }
            else if (rule.Frequency == RecurrenceFrequency.Monthly)
            {
                rule.MonthlyDayOfMonth = day;
            }
            else if (rule.Frequency == RecurrenceFrequency.Yearly)
            {
                rule.YearlyDayOfMonth = day;
            }
            else
            {
                unsupported.Add("BYMONTHDAY unsupported for frequency");
            }
        }

        if (tokens.TryGetValue("BYMONTH", out var byMonth))
        {
            var values = byMonth.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (rule.Frequency != RecurrenceFrequency.Yearly || values.Length != 1 || !int.TryParse(values[0], CultureInfo.InvariantCulture, out var month))
            {
                unsupported.Add("unsupported BYMONTH");
            }
            else
            {
                rule.YearlyMonth = month;
            }
        }

        if (rule.Frequency == RecurrenceFrequency.Weekly && string.IsNullOrWhiteSpace(rule.WeeklyDays))
        {
            rule.WeeklyDays = WeeklyDays.Serialize([firstDate.DayOfWeek]);
        }

        if (rule.Frequency == RecurrenceFrequency.Monthly && rule.MonthlyDayOfMonth is null)
        {
            rule.MonthlyDayOfMonth = firstDate.Day;
        }

        if (rule.Frequency == RecurrenceFrequency.Yearly)
        {
            rule.YearlyMonth ??= firstDate.Month;
            rule.YearlyDayOfMonth ??= firstDate.Day;
        }
    }

    private static IReadOnlyList<NormalizedICalendarEventException> MapExceptions(string uid, IcalCalendar calendar, ParsedEventBlock? masterBlock, IReadOnlyList<ParsedEventBlock> detachedBlocks, EventRecurrenceRule? recurrenceRule, TimeOnly? masterStartTime, List<ICalendarParseDiagnostic> diagnostics)
    {
        if (recurrenceRule is null || recurrenceRule.UnsupportedRecurrenceStatus == UnsupportedRecurrenceStatus.Unsupported)
        {
            return [];
        }

        var exceptions = new List<NormalizedICalendarEventException>();
        foreach (var exdate in masterBlock?.ExDates ?? [])
        {
            if (!TryParseIcalendarDate(exdate, out var exdateDate, out var exdateTime))
            {
                diagnostics.Add(Warning("UnsupportedExDate", "VEVENT EXDATE could not be mapped safely.", uid, "EXDATE"));
                continue;
            }

            var key = OccurrenceKey.FromOriginalStart(exdateDate, exdateTime ?? masterStartTime);
            exceptions.Add(new NormalizedICalendarEventException(key, EventExceptionType.Skipped, RawProviderRecurrenceId: exdate, NormalizedProviderRecurrenceId: key.Serialize()));
        }

        foreach (var detachedBlock in detachedBlocks)
        {
            var detachedSummary = GetRawBlockValue(detachedBlock.Raw, "SUMMARY");
            var detachedEvent = calendar.Events.FirstOrDefault(candidate => string.Equals(candidate.Uid, uid, StringComparison.Ordinal) && GetPropertyValue(candidate, "RECURRENCE-ID") is not null && (detachedSummary is null || string.Equals(NormalizeOptionalText(candidate.Summary), detachedSummary, StringComparison.Ordinal)));
            if (!TryParseIcalendarDate(detachedBlock.RecurrenceId!, out var recurrenceDate, out var recurrenceTime))
            {
                diagnostics.Add(Warning("UnsupportedRecurrenceId", "Detached VEVENT RECURRENCE-ID could not be mapped safely.", uid, "RECURRENCE-ID"));
                continue;
            }

            var key = OccurrenceKey.FromOriginalStart(recurrenceDate, recurrenceTime ?? masterStartTime);
            var isCancelled = string.Equals(detachedBlock.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase);
            if (isCancelled || detachedEvent is null)
            {
                exceptions.Add(new NormalizedICalendarEventException(key, EventExceptionType.Skipped, RawProviderRecurrenceId: detachedBlock.RecurrenceId, NormalizedProviderRecurrenceId: key.Serialize(), DetachedProviderEventId: uid, RawDetachedRecurrenceMetadata: detachedBlock.Raw));
                continue;
            }

            if (!TryReadDateRange(detachedEvent, uid, diagnostics, out var startDate, out var startTime, out var endDate, out var endTime, out var isAllDay))
            {
                continue;
            }

            var title = string.IsNullOrWhiteSpace(detachedEvent.Summary) ? null : detachedEvent.Summary.Trim();
            var description = NormalizeOptionalText(detachedEvent.Description);
            var location = NormalizeOptionalText(detachedEvent.Location);
            var lastModifiedUtc = ToUtcDateTime(detachedEvent.LastModified, uid, diagnostics, "LAST-MODIFIED");
            var providerRevision = BuildProviderRevision(detachedEvent.Sequence, lastModifiedUtc);
            var fingerprint = BuildContentFingerprint(uid, detachedBlock.RecurrenceId, title, description, location, startDate, startTime, endDate, endTime, isAllDay, detachedBlock.Status);
            exceptions.Add(new NormalizedICalendarEventException(key, EventExceptionType.Modified, title, description, location, isAllDay, startDate, startTime, endDate, endTime, detachedBlock.RecurrenceId, key.Serialize(), uid, providerRevision, fingerprint, detachedBlock.Raw));
        }

        return exceptions.GroupBy(exception => exception.OccurrenceKey).Select(group => group.Last()).ToArray();
    }

    private static Dictionary<string, string> ParsePropertyTokens(string value)
    {
        var tokens = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var normalized = value.StartsWith("RRULE:", StringComparison.OrdinalIgnoreCase) ? value[6..] : value;
        foreach (var part in normalized.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var pair = part.Split('=', 2);
            if (pair.Length == 2)
            {
                tokens[pair[0].Trim().ToUpperInvariant()] = pair[1].Trim();
            }
        }

        return tokens;
    }

    private static bool TryParseIcalendarDate(string value, out DateOnly date) => TryParseIcalendarDate(value, out date, out _);

    private static bool TryParseIcalendarDate(string value, out DateOnly date, out TimeOnly? time)
    {
        date = default;
        time = null;
        var normalized = value.Trim().TrimEnd('Z');
        if (DateTime.TryParseExact(normalized, "yyyyMMdd'T'HHmmss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateTime))
        {
            date = DateOnly.FromDateTime(dateTime);
            time = TimeOnly.FromDateTime(dateTime);
            return true;
        }

        if (DateTime.TryParseExact(normalized, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dateTime))
        {
            date = DateOnly.FromDateTime(dateTime);
            return true;
        }

        return false;
    }

    private static DayOfWeek ParseWeekday(string value) => value.ToUpperInvariant() switch
    {
        "MO" => DayOfWeek.Monday,
        "TU" => DayOfWeek.Tuesday,
        "WE" => DayOfWeek.Wednesday,
        "TH" => DayOfWeek.Thursday,
        "FR" => DayOfWeek.Friday,
        "SA" => DayOfWeek.Saturday,
        "SU" => DayOfWeek.Sunday,
        _ => throw new ArgumentException($"Unsupported weekday '{value}'."),
    };

    private static IReadOnlyList<ParsedEventBlock> ExtractEventBlocks(string content)
    {
        var blocks = new List<ParsedEventBlock>();
        var current = new List<string>();
        var inEvent = false;
        foreach (var rawLine in UnfoldLines(content))
        {
            if (rawLine.Equals("BEGIN:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                inEvent = true;
                current = [rawLine];
                continue;
            }

            if (!inEvent)
            {
                continue;
            }

            current.Add(rawLine);
            if (rawLine.Equals("END:VEVENT", StringComparison.OrdinalIgnoreCase))
            {
                blocks.Add(ParseEventBlock(current));
                inEvent = false;
            }
        }

        return blocks;
    }

    private static IEnumerable<string> UnfoldLines(string content)
    {
        string? previous = null;
        using var reader = new StringReader(content);
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            if ((line.StartsWith(' ') || line.StartsWith('\t')) && previous is not null)
            {
                previous += line[1..];
                continue;
            }

            if (previous is not null)
            {
                yield return previous;
            }

            previous = line;
        }

        if (previous is not null)
        {
            yield return previous;
        }
    }

    private static ParsedEventBlock ParseEventBlock(IReadOnlyList<string> lines)
    {
        string? uid = null;
        string? recurrenceId = null;
        string? rrule = null;
        string? status = null;
        var exdates = new List<string>();
        foreach (var line in lines)
        {
            var separatorIndex = line.IndexOf(':', StringComparison.Ordinal);
            if (separatorIndex < 0)
            {
                continue;
            }

            var name = line[..separatorIndex].Split(';', 2)[0];
            var value = line[(separatorIndex + 1)..].Trim();
            if (name.Equals("UID", StringComparison.OrdinalIgnoreCase)) uid = value;
            else if (name.Equals("RECURRENCE-ID", StringComparison.OrdinalIgnoreCase)) recurrenceId = value;
            else if (name.Equals("RRULE", StringComparison.OrdinalIgnoreCase)) rrule = value;
            else if (name.Equals("EXDATE", StringComparison.OrdinalIgnoreCase)) exdates.AddRange(value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            else if (name.Equals("STATUS", StringComparison.OrdinalIgnoreCase)) status = value;
        }

        return new ParsedEventBlock(uid ?? string.Empty, recurrenceId, rrule, exdates, status, string.Join(Environment.NewLine, lines));
    }

    private sealed record ParsedEventBlock(string Uid, string? RecurrenceId, string? RRule, IReadOnlyList<string> ExDates, string? Status, string Raw);

    private static string? GetPropertyValue(CalendarEvent calendarEvent, string propertyName) =>
        calendarEvent.Properties.FirstOrDefault(property => string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))?.Value?.ToString();

    private static string? GetRawBlockValue(string rawBlock, string propertyName)
    {
        foreach (var line in rawBlock.Split(Environment.NewLine))
        {
            var separatorIndex = line.IndexOf(':', StringComparison.Ordinal);
            if (separatorIndex < 0)
            {
                continue;
            }

            var name = line[..separatorIndex].Split(';', 2)[0];
            if (name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                return NormalizeOptionalText(line[(separatorIndex + 1)..]);
            }
        }

        return null;
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
