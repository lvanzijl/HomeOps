namespace HomeOps.Api.CalendarEvents;

public sealed record RecurrenceValidationResult(bool IsValid, IReadOnlyList<string> Errors)
{
    public static RecurrenceValidationResult Valid { get; } = new(true, Array.Empty<string>());
}

public static class EventRecurrenceRuleValidation
{
    public static RecurrenceValidationResult Validate(EventRecurrenceRule? rule, DateOnly? firstOccurrenceDate = null)
    {
        if (rule is null)
        {
            return RecurrenceValidationResult.Valid;
        }

        var errors = new List<string>();
        ValidateInterval(rule, errors);
        ValidateEndMode(rule, firstOccurrenceDate, errors);
        ValidateFrequencyFields(rule, errors);
        return errors.Count == 0 ? RecurrenceValidationResult.Valid : new RecurrenceValidationResult(false, errors);
    }

    public static void ValidateAndThrow(EventRecurrenceRule? rule, DateOnly? firstOccurrenceDate = null)
    {
        var result = Validate(rule, firstOccurrenceDate);
        if (!result.IsValid)
        {
            throw new InvalidOperationException(string.Join(" ", result.Errors));
        }
    }

    private static void ValidateInterval(EventRecurrenceRule rule, List<string> errors)
    {
        if (rule.Interval <= 0)
        {
            errors.Add("Interval must be a positive integer.");
        }
    }

    private static void ValidateEndMode(EventRecurrenceRule rule, DateOnly? firstOccurrenceDate, List<string> errors)
    {
        switch (rule.EndMode)
        {
            case RecurrenceEndMode.Never:
                if (rule.UntilDate is not null)
                {
                    errors.Add("UntilDate must not be set when EndMode is Never.");
                }
                if (rule.Count is not null)
                {
                    errors.Add("Count must not be set when EndMode is Never.");
                }
                break;
            case RecurrenceEndMode.OnDate:
                if (rule.UntilDate is null)
                {
                    errors.Add("UntilDate is required when EndMode is OnDate.");
                }
                if (rule.Count is not null)
                {
                    errors.Add("Count must not be set when EndMode is OnDate.");
                }
                if (rule.UntilDate is { } untilDate && firstOccurrenceDate is { } firstDate && untilDate < firstDate)
                {
                    errors.Add("UntilDate must not be before the first recurrence candidate date.");
                }
                break;
            case RecurrenceEndMode.AfterCount:
                if (rule.Count is null)
                {
                    errors.Add("Count is required when EndMode is AfterCount.");
                }
                if (rule.Count <= 0)
                {
                    errors.Add("Count must be a positive integer.");
                }
                if (rule.UntilDate is not null)
                {
                    errors.Add("UntilDate must not be set when EndMode is AfterCount.");
                }
                break;
            default:
                errors.Add("EndMode must be Never, OnDate, or AfterCount.");
                break;
        }
    }

    private static void ValidateFrequencyFields(EventRecurrenceRule rule, List<string> errors)
    {
        switch (rule.Frequency)
        {
            case RecurrenceFrequency.Daily:
                RequireNoWeeklyDays(rule, errors);
                RequireNoMonthlyDay(rule, errors);
                RequireNoYearlyDate(rule, errors);
                break;
            case RecurrenceFrequency.Weekly:
                ValidateWeeklyDays(rule, errors);
                RequireNoMonthlyDay(rule, errors);
                RequireNoYearlyDate(rule, errors);
                break;
            case RecurrenceFrequency.Monthly:
                RequireNoWeeklyDays(rule, errors);
                ValidateMonthlyDay(rule, errors);
                RequireNoYearlyDate(rule, errors);
                break;
            case RecurrenceFrequency.Yearly:
                RequireNoWeeklyDays(rule, errors);
                RequireNoMonthlyDay(rule, errors);
                ValidateYearlyDate(rule, errors);
                break;
            default:
                errors.Add("Frequency must be Daily, Weekly, Monthly, or Yearly.");
                break;
        }
    }

    private static void ValidateWeeklyDays(EventRecurrenceRule rule, List<string> errors)
    {
        try
        {
            if (rule.WeeklyDays is null)
            {
                errors.Add("WeeklyDays is required for weekly recurrence.");
                return;
            }

            var canonical = WeeklyDays.Canonicalize(rule.WeeklyDays);
            if (!StringComparer.Ordinal.Equals(rule.WeeklyDays, canonical))
            {
                errors.Add("WeeklyDays must be in canonical weekday order without duplicates.");
            }
        }
        catch (ArgumentException exception)
        {
            errors.Add(exception.Message);
        }
    }

    private static void ValidateMonthlyDay(EventRecurrenceRule rule, List<string> errors)
    {
        if (rule.MonthlyDayOfMonth is null)
        {
            errors.Add("MonthlyDayOfMonth is required for monthly recurrence.");
            return;
        }

        if (rule.MonthlyDayOfMonth is < 1 or > 31)
        {
            errors.Add("MonthlyDayOfMonth must be between 1 and 31.");
        }
    }

    private static void ValidateYearlyDate(EventRecurrenceRule rule, List<string> errors)
    {
        if (rule.YearlyMonth is null)
        {
            errors.Add("YearlyMonth is required for yearly recurrence.");
        }

        if (rule.YearlyDayOfMonth is null)
        {
            errors.Add("YearlyDayOfMonth is required for yearly recurrence.");
        }

        if (rule.YearlyMonth is < 1 or > 12)
        {
            errors.Add("YearlyMonth must be between 1 and 12.");
        }

        if (rule.YearlyDayOfMonth is < 1 or > 31)
        {
            errors.Add("YearlyDayOfMonth must be between 1 and 31.");
        }

        if (rule.YearlyMonth is { } month && rule.YearlyDayOfMonth is { } day && !IsValidInAnySupportedYear(month, day))
        {
            errors.Add("YearlyMonth and YearlyDayOfMonth must form a valid date in at least one year.");
        }
    }

    private static bool IsValidInAnySupportedYear(int month, int day)
    {
        if (month is < 1 or > 12 || day is < 1 or > 31)
        {
            return false;
        }

        return day <= DateTime.DaysInMonth(2024, month);
    }

    private static void RequireNoWeeklyDays(EventRecurrenceRule rule, List<string> errors)
    {
        if (!string.IsNullOrWhiteSpace(rule.WeeklyDays))
        {
            errors.Add("WeeklyDays must be set only for weekly recurrence.");
        }
    }

    private static void RequireNoMonthlyDay(EventRecurrenceRule rule, List<string> errors)
    {
        if (rule.MonthlyDayOfMonth is not null)
        {
            errors.Add("MonthlyDayOfMonth must be set only for monthly recurrence.");
        }
    }

    private static void RequireNoYearlyDate(EventRecurrenceRule rule, List<string> errors)
    {
        if (rule.YearlyMonth is not null || rule.YearlyDayOfMonth is not null)
        {
            errors.Add("YearlyMonth and YearlyDayOfMonth must be set only for yearly recurrence.");
        }
    }
}
