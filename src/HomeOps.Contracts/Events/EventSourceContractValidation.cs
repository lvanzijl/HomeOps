namespace HomeOps.Contracts.Events;

public static class EventSourceContractValidation
{
    private static readonly HashSet<EventSourceType> SupportedSourceTypes =
    [
        EventSourceType.Manual,
        EventSourceType.ICalFeed,
        EventSourceType.ICalFile,
        EventSourceType.GoogleCalendar,
        EventSourceType.CalDav,
        EventSourceType.Exchange,
        EventSourceType.SchoolHolidays,
        EventSourceType.TvSeries,
        EventSourceType.Provider,
        EventSourceType.Birthdays
    ];

    public static bool IsSupportedSourceType(EventSourceType sourceType) => SupportedSourceTypes.Contains(sourceType);

    public static bool IsSupportedHealthStatus(EventSourceHealthStatus healthStatus) => Enum.IsDefined(healthStatus);

    public static bool IsSupportedPollInterval(EventSourcePollInterval pollInterval) => pollInterval is EventSourcePollInterval.EveryHour or EventSourcePollInterval.Every8Hours or EventSourcePollInterval.EveryDay;

    public static IReadOnlyDictionary<string, string[]> ValidateProviderConfiguration(EventSourceType sourceType, EventSourceProviderConfigurationRequest? configuration)
    {
        var errors = new Dictionary<string, string[]>();

        if (sourceType == EventSourceType.Manual)
        {
            if (configuration is not null)
            {
                errors[nameof(configuration)] = ["Manual sources must not include provider configuration."];
            }

            return errors;
        }

        if (configuration is null)
        {
            errors[nameof(configuration)] = ["Provider configuration is required for non-manual sources."];
            return errors;
        }

        switch (sourceType)
        {
            case EventSourceType.ICalFeed:
                if (configuration.Kind != EventSourceProviderConfigurationKind.ICalFeed || configuration.ICalFeed is null)
                {
                    errors[nameof(configuration)] = ["iCal Feed configuration is required for iCal Feed sources."];
                    break;
                }

                if (string.IsNullOrWhiteSpace(configuration.ICalFeed.FeedUrl))
                {
                    errors[nameof(ICalFeedSourceConfigurationRequest.FeedUrl)] = ["Feed URL is required."];
                }
                else if (!Uri.TryCreate(configuration.ICalFeed.FeedUrl, UriKind.Absolute, out var uri) || uri.Scheme != "https")
                {
                    errors[nameof(ICalFeedSourceConfigurationRequest.FeedUrl)] = ["Feed URL must be an absolute HTTPS URL."];
                }
                break;

            case EventSourceType.ICalFile:
                errors[nameof(configuration)] = ["Use the multipart iCal file endpoint; managed file references are server-internal."];
                break;

            default:
                errors[nameof(configuration)] = ["Provider configuration type does not match the source type."];
                break;
        }

        return errors;
    }
}
