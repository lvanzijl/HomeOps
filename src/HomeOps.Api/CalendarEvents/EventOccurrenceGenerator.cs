using System.Security.Cryptography;
using System.Text;

namespace HomeOps.Api.CalendarEvents;

public static class EventOccurrenceGenerator
{
    public static IReadOnlyCollection<EventOccurrence> Generate(EventSeries series, string householdTimeZoneId, DateOnly startsOn, DateOnly endsOn)
    {
        if (endsOn < startsOn)
        {
            return Array.Empty<EventOccurrence>();
        }

        var rule = series.RecurrenceRule ?? CreateLegacyCompatibilityRule(series);
        if (rule?.UnsupportedRecurrenceStatus == UnsupportedRecurrenceStatus.Unsupported || rule?.EndMode == RecurrenceEndMode.OnDate && rule.UntilDate < series.StartDate)
        {
            return Array.Empty<EventOccurrence>();
        }

        EventRecurrenceRuleValidation.ValidateAndThrow(rule, series.StartDate);

        var durationDays = Math.Max(0, series.EndDate.DayNumber - series.StartDate.DayNumber);
        var searchStartsOn = startsOn.AddDays(-durationDays);
        var exceptions = series.Exceptions
            .Select(exception => NormalizeLegacyException(series, exception))
            .GroupBy(exception => exception.OccurrenceKey)
            .ToDictionary(group => group.Key, group => group.First());

        if (rule is null)
        {
            var key = OccurrenceKey.FromOriginalStart(series.StartDate, series.StartTime);
            exceptions.TryGetValue(key, out var exception);
            if (exception?.ExceptionType == EventExceptionType.Skipped || exception?.IsSkipped == true)
            {
                return Array.Empty<EventOccurrence>();
            }

            var occurrence = ToOccurrence(series, rule, exception, key, durationDays, householdTimeZoneId);
            return OverlapsWindow(occurrence, startsOn, endsOn, householdTimeZoneId) ? [occurrence] : Array.Empty<EventOccurrence>();
        }

        var generationStartsOn = rule.EndMode == RecurrenceEndMode.AfterCount ? series.StartDate : searchStartsOn;
        var keys = GenerateCandidateKeys(series, rule, generationStartsOn, endsOn).ToDictionary(candidate => candidate.Key, candidate => candidate.Ordinal);
        foreach (var exception in exceptions.Values)
        {
            if (!keys.ContainsKey(exception.OccurrenceKey) && IsValidCandidateKey(series, rule, exception.OccurrenceKey, out var ordinal))
            {
                keys[exception.OccurrenceKey] = ordinal;
            }
        }

        var occurrences = new List<EventOccurrence>();
        foreach (var key in keys.Keys.Order())
        {
            exceptions.TryGetValue(key, out var exception);
            if (exception?.ExceptionType == EventExceptionType.Skipped || exception?.IsSkipped == true)
            {
                continue;
            }

            var occurrence = ToOccurrence(series, rule, exception, key, durationDays, householdTimeZoneId);
            if (OverlapsWindow(occurrence, startsOn, endsOn, householdTimeZoneId))
            {
                occurrences.Add(occurrence);
            }
        }

        return occurrences
            .OrderBy(occurrence => occurrence.StartsAt)
            .ThenBy(occurrence => occurrence.OccurrenceKey)
            .ToArray();
    }


    public static bool CanGenerateOccurrence(EventSeries series, OccurrenceKey key) => TryGetGeneratedOccurrenceOrdinal(series, key, out _);

    public static bool TryGetGeneratedOccurrenceOrdinal(EventSeries series, OccurrenceKey key, out int ordinal)
    {
        ordinal = 0;
        var rule = series.RecurrenceRule ?? CreateLegacyCompatibilityRule(series);
        if (rule is null)
        {
            return false;
        }

        EventRecurrenceRuleValidation.ValidateAndThrow(rule, series.StartDate);
        return IsValidCandidateKey(series, rule, key, out ordinal);
    }

    private static EventRecurrenceRule? CreateLegacyCompatibilityRule(EventSeries series) => series.RecurrenceType switch
    {
        RecurrenceType.Daily => new EventRecurrenceRule
        {
            Frequency = RecurrenceFrequency.Daily,
            Interval = 1,
            EndMode = RecurrenceEndMode.Never,
        },
        RecurrenceType.Weekly => new EventRecurrenceRule
        {
            Frequency = RecurrenceFrequency.Weekly,
            Interval = 1,
            EndMode = RecurrenceEndMode.Never,
            WeeklyDays = WeeklyDays.Serialize([series.StartDate.DayOfWeek]),
        },
        RecurrenceType.Monthly => new EventRecurrenceRule
        {
            Frequency = RecurrenceFrequency.Monthly,
            Interval = 1,
            EndMode = RecurrenceEndMode.Never,
            MonthlyDayOfMonth = series.StartDate.Day,
        },
        RecurrenceType.Yearly => new EventRecurrenceRule
        {
            Frequency = RecurrenceFrequency.Yearly,
            Interval = 1,
            EndMode = RecurrenceEndMode.Never,
            YearlyMonth = series.StartDate.Month,
            YearlyDayOfMonth = series.StartDate.Day,
        },
        _ => null,
    };

    private static EventException NormalizeLegacyException(EventSeries series, EventException exception)
    {
        if (exception.OccurrenceKey != default)
        {
            return exception;
        }

        exception.OccurrenceKey = OccurrenceKey.FromOriginalStart(exception.OccurrenceDate, series.StartTime);
        exception.ExceptionType = exception.IsSkipped ? EventExceptionType.Skipped : EventExceptionType.Modified;
        return exception;
    }

    private static IEnumerable<CandidateKey> GenerateCandidateKeys(EventSeries series, EventRecurrenceRule rule, DateOnly startsOn, DateOnly endsOn)
    {
        var ordinal = 0;
        foreach (var key in GenerateCandidateKeySequence(series, rule, startsOn, endsOn))
        {
            ordinal++;
            if (!AllowsCandidate(rule, key.Date, ordinal))
            {
                if (rule.EndMode == RecurrenceEndMode.AfterCount && ordinal >= rule.Count)
                {
                    yield break;
                }

                continue;
            }

            yield return new CandidateKey(key, ordinal);

            if (rule.EndMode == RecurrenceEndMode.AfterCount && ordinal >= rule.Count)
            {
                yield break;
            }
        }
    }

    private static IEnumerable<OccurrenceKey> GenerateCandidateKeySequence(EventSeries series, EventRecurrenceRule rule, DateOnly startsOn, DateOnly endsOn)
    {
        return rule.Frequency switch
        {
            RecurrenceFrequency.Daily => GenerateDailyKeys(series, rule, startsOn, endsOn),
            RecurrenceFrequency.Weekly => GenerateWeeklyKeys(series, rule, startsOn, endsOn),
            RecurrenceFrequency.Monthly => GenerateMonthlyKeys(series, rule, startsOn, endsOn),
            RecurrenceFrequency.Yearly => GenerateYearlyKeys(series, rule, startsOn, endsOn),
            _ => throw new InvalidOperationException("Unsupported recurrence frequency."),
        };
    }

    private static IEnumerable<OccurrenceKey> GenerateDailyKeys(EventSeries series, EventRecurrenceRule rule, DateOnly startsOn, DateOnly endsOn)
    {
        var startIndex = Math.Max(0, (startsOn.DayNumber - series.StartDate.DayNumber) / rule.Interval - 1);
        for (var index = startIndex; ; index++)
        {
            var date = series.StartDate.AddDays(index * rule.Interval);
            if (date > endsOn || IsPastEndDate(rule, date))
            {
                yield break;
            }

            if (date < series.StartDate)
            {
                continue;
            }

            yield return OccurrenceKey.FromOriginalStart(date, series.StartTime);
        }
    }

    private static IEnumerable<OccurrenceKey> GenerateWeeklyKeys(EventSeries series, EventRecurrenceRule rule, DateOnly startsOn, DateOnly endsOn)
    {
        var weeklyDays = WeeklyDays.Parse(rule.WeeklyDays!);
        var seriesWeekStart = StartOfWeek(series.StartDate);
        var firstWindowWeek = StartOfWeek(startsOn);
        var weekDiff = (firstWindowWeek.DayNumber - seriesWeekStart.DayNumber) / 7;
        var firstWeekIndex = Math.Max(0, weekDiff - rule.Interval);

        for (var weekIndex = firstWeekIndex; ; weekIndex += rule.Interval)
        {
            var weekStart = seriesWeekStart.AddDays(weekIndex * 7);
            if (weekStart > endsOn.AddDays(6))
            {
                yield break;
            }

            foreach (var day in weeklyDays)
            {
                var date = weekStart.AddDays(DayOffset(day));
                if (date < series.StartDate || date < startsOn)
                {
                    continue;
                }

                if (date > endsOn || IsPastEndDate(rule, date))
                {
                    continue;
                }

                yield return OccurrenceKey.FromOriginalStart(date, series.StartTime);
            }
        }
    }

    private static IEnumerable<OccurrenceKey> GenerateMonthlyKeys(EventSeries series, EventRecurrenceRule rule, DateOnly startsOn, DateOnly endsOn)
    {
        var monthDiff = ((startsOn.Year - series.StartDate.Year) * 12) + startsOn.Month - series.StartDate.Month;
        var startIndex = Math.Max(0, monthDiff / rule.Interval - 1);
        for (var index = startIndex; ; index++)
        {
            var monthDate = series.StartDate.AddMonths(index * rule.Interval);
            if (monthDate > endsOn.AddMonths(1))
            {
                yield break;
            }

            var day = rule.MonthlyDayOfMonth!.Value;
            if (day > DateTime.DaysInMonth(monthDate.Year, monthDate.Month))
            {
                continue;
            }

            var date = new DateOnly(monthDate.Year, monthDate.Month, day);
            if (date < series.StartDate || date > endsOn || IsPastEndDate(rule, date))
            {
                continue;
            }

            yield return OccurrenceKey.FromOriginalStart(date, series.StartTime);
        }
    }

    private static IEnumerable<OccurrenceKey> GenerateYearlyKeys(EventSeries series, EventRecurrenceRule rule, DateOnly startsOn, DateOnly endsOn)
    {
        var yearDiff = startsOn.Year - series.StartDate.Year;
        var startIndex = Math.Max(0, yearDiff / rule.Interval - 1);
        for (var index = startIndex; ; index++)
        {
            var year = series.StartDate.Year + (index * rule.Interval);
            if (year > endsOn.Year + 1)
            {
                yield break;
            }

            var month = rule.YearlyMonth!.Value;
            var day = rule.YearlyDayOfMonth!.Value;
            if (day > DateTime.DaysInMonth(year, month))
            {
                continue;
            }

            var date = new DateOnly(year, month, day);
            if (date < series.StartDate || date > endsOn || IsPastEndDate(rule, date))
            {
                continue;
            }

            yield return OccurrenceKey.FromOriginalStart(date, series.StartTime);
        }
    }

    private static bool IsValidCandidateKey(EventSeries series, EventRecurrenceRule rule, OccurrenceKey key, out int ordinal)
    {
        ordinal = 0;
        if (key.Date < series.StartDate || IsPastEndDate(rule, key.Date))
        {
            return false;
        }

        foreach (var candidate in GenerateCandidateKeySequence(series, rule, series.StartDate, key.Date))
        {
            ordinal++;
            if (!AllowsCandidate(rule, candidate.Date, ordinal))
            {
                return false;
            }

            if (candidate.Equals(key))
            {
                return true;
            }
        }

        return false;
    }

    private static bool AllowsCandidate(EventRecurrenceRule rule, DateOnly date, int ordinal) => rule.EndMode switch
    {
        RecurrenceEndMode.Never => true,
        RecurrenceEndMode.OnDate => date <= rule.UntilDate,
        RecurrenceEndMode.AfterCount => ordinal <= rule.Count,
        _ => false,
    };

    private static bool IsPastEndDate(EventRecurrenceRule rule, DateOnly date) => rule.EndMode == RecurrenceEndMode.OnDate && date > rule.UntilDate;

    private static EventOccurrence ToOccurrence(EventSeries series, EventRecurrenceRule? rule, EventException? exception, OccurrenceKey key, int durationDays, string timeZoneId)
    {
        var isModified = exception?.ExceptionType == EventExceptionType.Modified && !exception.IsSkipped;
        var allDay = isModified ? exception?.IsAllDay ?? series.IsAllDay : series.IsAllDay;
        var startDate = isModified ? exception?.StartDate ?? key.Date : key.Date;
        var endDate = isModified ? exception?.EndDate ?? startDate.AddDays(durationDays) : startDate.AddDays(durationDays);
        var title = isModified && !string.IsNullOrWhiteSpace(exception?.Title) ? exception!.Title! : series.Title;
        var description = isModified ? exception?.Description ?? series.Description : series.Description;
        var location = isModified ? exception?.Location ?? series.Location : series.Location;
        var startTime = allDay ? new TimeOnly(0, 0) : isModified ? exception?.StartTime ?? series.StartTime ?? new TimeOnly(0, 0) : series.StartTime ?? new TimeOnly(0, 0);
        var endTime = allDay ? new TimeOnly(0, 0) : isModified ? exception?.EndTime ?? series.EndTime ?? startTime : series.EndTime ?? startTime;
        var id = rule is null ? series.Id : DeterministicOccurrenceId(series.Id, key);

        return new EventOccurrence(
            id,
            series.Id,
            series.EventSourceId,
            title,
            description,
            ToLocalOffset(startDate, startTime, timeZoneId),
            ToLocalOffset(endDate, endTime, timeZoneId),
            allDay,
            series.EventSource?.IsWritable ?? true,
            series.ProviderEventId,
            location,
            key.Serialize(),
            rule is not null,
            isModified);
    }

    private static bool OverlapsWindow(EventOccurrence occurrence, DateOnly startsOn, DateOnly endsOn, string timeZoneId)
    {
        var windowStart = ToLocalOffset(startsOn, new TimeOnly(0, 0), timeZoneId);
        var windowEndExclusive = ToLocalOffset(endsOn.AddDays(1), new TimeOnly(0, 0), timeZoneId);
        var occurrenceEnd = occurrence.EndsAt ?? occurrence.StartsAt;
        return occurrence.StartsAt < windowEndExclusive && occurrenceEnd >= windowStart;
    }

    private static DateTimeOffset ToLocalOffset(DateOnly date, TimeOnly time, string timeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var local = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);
        while (zone.IsInvalidTime(local))
        {
            local = local.AddMinutes(1);
        }

        return new DateTimeOffset(local, zone.GetUtcOffset(local));
    }

    private static DateOnly StartOfWeek(DateOnly date) => date.AddDays(-DayOffset(date.DayOfWeek));

    private static int DayOffset(DayOfWeek day) => day == DayOfWeek.Sunday ? 6 : (int)day - 1;

    private static Guid DeterministicOccurrenceId(Guid seriesId, OccurrenceKey key)
    {
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes($"{seriesId:N}|{key.Serialize()}"));
        return new Guid(bytes);
    }

    private sealed record CandidateKey(OccurrenceKey Key, int Ordinal);
}
