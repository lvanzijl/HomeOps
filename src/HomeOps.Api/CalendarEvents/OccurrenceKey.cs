using System.Globalization;

namespace HomeOps.Api.CalendarEvents;

public readonly record struct OccurrenceKey(DateOnly Date, TimeOnly? Time) : IComparable<OccurrenceKey>
{
    private const string DateFormat = "yyyy-MM-dd";
    private const string DateTimeSeparator = "T";
    private const string TimeFormat = "HH:mm:ss";

    public static OccurrenceKey FromOriginalStart(DateOnly date, TimeOnly? time = null) => new(date, time);

    public static OccurrenceKey Parse(string value)
    {
        if (!TryParse(value, out var key))
        {
            throw new FormatException("OccurrenceKey must be formatted as yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss.");
        }

        return key;
    }

    public static bool TryParse(string? value, out OccurrenceKey key)
    {
        key = default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var parts = value.Split(DateTimeSeparator, 2, StringSplitOptions.None);
        if (!DateOnly.TryParseExact(parts[0], DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            return false;
        }

        if (parts.Length == 1)
        {
            key = new OccurrenceKey(date, null);
            return true;
        }

        if (!TimeOnly.TryParseExact(parts[1], TimeFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
        {
            return false;
        }

        key = new OccurrenceKey(date, time);
        return true;
    }

    public string Serialize() => ToString();

    public int CompareTo(OccurrenceKey other)
    {
        var dateComparison = Date.CompareTo(other.Date);
        if (dateComparison != 0)
        {
            return dateComparison;
        }

        return Nullable.Compare(Time, other.Time);
    }

    public override string ToString() => Time is null
        ? Date.ToString(DateFormat, CultureInfo.InvariantCulture)
        : $"{Date.ToString(DateFormat, CultureInfo.InvariantCulture)}{DateTimeSeparator}{Time.Value.ToString(TimeFormat, CultureInfo.InvariantCulture)}";
}
