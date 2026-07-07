namespace HomeOps.Api.CalendarEvents;

public static class WeeklyDays
{
    private static readonly DayOfWeek[] CanonicalOrder =
    [
        DayOfWeek.Monday,
        DayOfWeek.Tuesday,
        DayOfWeek.Wednesday,
        DayOfWeek.Thursday,
        DayOfWeek.Friday,
        DayOfWeek.Saturday,
        DayOfWeek.Sunday,
    ];

    private static readonly IReadOnlyDictionary<string, DayOfWeek> SupportedValues = CanonicalOrder
        .Concat([DayOfWeek.Sunday])
        .Distinct()
        .ToDictionary(day => day.ToString(), day => day, StringComparer.OrdinalIgnoreCase);

    public static string Serialize(IEnumerable<DayOfWeek> days)
    {
        var daySet = new HashSet<DayOfWeek>();
        foreach (var day in days)
        {
            if (!daySet.Add(day))
            {
                throw new ArgumentException($"Duplicate weekday '{day}' is not allowed.", nameof(days));
            }
        }

        if (daySet.Count == 0)
        {
            throw new ArgumentException("At least one weekday is required.", nameof(days));
        }

        return string.Join(',', CanonicalOrder.Where(daySet.Contains).Select(day => day.ToString()));
    }

    public static IReadOnlyList<DayOfWeek> Parse(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("At least one weekday is required.", nameof(value));
        }

        var parsed = new List<DayOfWeek>();
        var seen = new HashSet<DayOfWeek>();
        foreach (var token in value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
        {
            if (!SupportedValues.TryGetValue(token, out var day))
            {
                throw new ArgumentException($"Unsupported weekday '{token}'.", nameof(value));
            }

            if (!seen.Add(day))
            {
                throw new ArgumentException($"Duplicate weekday '{day.ToString()}' is not allowed.", nameof(value));
            }

            parsed.Add(day);
        }

        if (parsed.Count == 0)
        {
            throw new ArgumentException("At least one weekday is required.", nameof(value));
        }

        return CanonicalOrder.Where(seen.Contains).ToArray();
    }

    public static string Canonicalize(string value) => Serialize(Parse(value));
}
