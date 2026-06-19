namespace HomeOps.Api.Households;

public static class HouseholdTimeZone
{
    public const string DefaultTimeZoneId = "Europe/Amsterdam";

    public static string DeriveInitialTimeZoneId()
    {
        var configuredTimeZone = Environment.GetEnvironmentVariable("TZ");
        if (IsSupportedIanaTimeZone(configuredTimeZone) && configuredTimeZone != "Etc/UTC" && configuredTimeZone != "UTC")
        {
            return configuredTimeZone!;
        }

        var localTimeZone = TimeZoneInfo.Local.Id;
        return IsSupportedIanaTimeZone(localTimeZone) && localTimeZone != "Etc/UTC" && localTimeZone != "UTC"
            ? localTimeZone
            : DefaultTimeZoneId;
    }

    private static bool IsSupportedIanaTimeZone(string? timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            return false;
        }

        try
        {
            _ = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            return timeZoneId.Contains('/');
        }
        catch (TimeZoneNotFoundException)
        {
            return false;
        }
        catch (InvalidTimeZoneException)
        {
            return false;
        }
    }
}
