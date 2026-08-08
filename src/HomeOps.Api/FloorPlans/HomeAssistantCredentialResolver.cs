namespace HomeOps.Api.FloorPlans;

internal static class HomeAssistantCredentialResolver
{
    public const string ConfigurationKey = "HOMEASSISTANT__ACCESSTOKEN";
    private const string CompatibilityKey = "HomeAssistant__AccessToken";

    public static string? GetAccessToken()
    {
        var token = Environment.GetEnvironmentVariable(ConfigurationKey)
            ?? Environment.GetEnvironmentVariable(CompatibilityKey);
        return string.IsNullOrWhiteSpace(token) ? null : token;
    }

    public static HomeAssistantCredentialStatusDto GetStatus() =>
        new(ConfigurationKey, GetAccessToken() is not null);
}
