using System.Text.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Contracts.Events;
using ApiHealthStatus = HomeOps.Api.CalendarEvents.EventSourceHealthStatus;
using ApiPollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarSourceDomainContractsTests
{
    [Fact]
    public void DomainPollIntervalNamesMatchCanonicalValues()
    {
        Assert.Equal(["EveryHour", "Every8Hours", "EveryDay"], Enum.GetNames<ApiPollInterval>());
        Assert.Equal(["EveryHour", "Every8Hours", "EveryDay"], Enum.GetNames<HomeOps.Contracts.Events.EventSourcePollInterval>());
    }

    [Fact]
    public void DisabledIsNotAHealthStatusAndEnabledStateIsSeparate()
    {
        Assert.DoesNotContain("Disabled", Enum.GetNames<ApiHealthStatus>());
        Assert.DoesNotContain("Disabled", Enum.GetNames<HomeOps.Contracts.Events.EventSourceHealthStatus>());

        var source = new HomeOps.Api.CalendarEvents.EventSource
        {
            IsEnabled = false,
            HealthStatus = ApiHealthStatus.Healthy,
        };

        Assert.False(source.IsEnabled);
        Assert.Equal(ApiHealthStatus.Healthy, source.HealthStatus);
    }

    [Fact]
    public void SystemManualSourceInvariantUsesExplicitSystemFlagWithManualType()
    {
        var systemManualSource = new HomeOps.Api.CalendarEvents.EventSource
        {
            SourceType = EventSourceTypes.Manual,
            IsSystem = true,
        };
        var userManualSource = new HomeOps.Api.CalendarEvents.EventSource
        {
            SourceType = EventSourceTypes.Manual,
            IsSystem = false,
        };
        var systemProviderSource = new HomeOps.Api.CalendarEvents.EventSource
        {
            SourceType = EventSourceTypes.ICalFeed,
            IsSystem = true,
        };

        Assert.True(systemManualSource.IsSystemManualSource);
        Assert.False(userManualSource.IsSystemManualSource);
        Assert.False(systemProviderSource.IsSystemManualSource);
    }

    [Fact]
    public void SourceContractSerializesProviderNeutralTerminology()
    {
        var source = new HomeOps.Contracts.Events.EventSource(
            Id: "source-1",
            Name: "School Feed",
            Type: EventSourceType.ICalFeed,
            Enabled: true,
            Capability: EventSourceCapability.ReadOnly,
            Visibility: new EventSourceVisibility(true, "Household"),
            Color: new EventSourceColor("#4f46e5"),
            ProviderSourceId: "provider-calendar-1");

        var json = JsonSerializer.Serialize(source, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.Contains("providerSourceId", json);
        Assert.DoesNotContain("externalSourceId", json);
    }

    [Fact]
    public void NormalizedEventContractSerializesProviderEventIdAndLocation()
    {
        var normalizedEvent = new NormalizedEvent(
            Id: "event-1",
            SourceId: "source-1",
            Title: "Training",
            StartsAt: DateTimeOffset.Parse("2026-07-05T10:00:00Z"),
            EndsAt: DateTimeOffset.Parse("2026-07-05T11:00:00Z"),
            AllDay: false,
            Editable: false,
            ProviderEventId: "provider-event-1",
            Location: "Gym");

        var json = JsonSerializer.Serialize(normalizedEvent, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.Contains("providerEventId", json);
        Assert.Contains("location", json);
        Assert.DoesNotContain("externalEventId", json);
    }

    [Fact]
    public void ProviderConfigurationContractsUseDiscriminatedShapesWithoutSecrets()
    {
        var feed = new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("https://example.test/calendar.ics"));
        var file = new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFile, ICalFile: new ICalFileSourceConfigurationRequest("calendar-files/file.ics", "file.ics", "sha256:abc"));
        var safeFeed = new EventSourceProviderConfigurationDto(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationDto("https://example.test/calendar.ics", ETag: "etag", LastModified: "Sun, 05 Jul 2026 10:00:00 GMT", LastContentHash: "sha256:def"));

        Assert.Equal(EventSourceProviderConfigurationKind.ICalFeed, feed.Kind);
        Assert.Equal(EventSourceProviderConfigurationKind.ICalFile, file.Kind);
        Assert.Equal(EventSourceProviderConfigurationKind.ICalFeed, safeFeed.Kind);

        var json = JsonSerializer.Serialize(safeFeed, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.DoesNotContain("secret", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ProviderConfigurationValidationCoversContractPrimitives()
    {
        Assert.True(EventSourceContractValidation.IsSupportedSourceType(EventSourceType.ICalFeed));
        Assert.True(EventSourceContractValidation.IsSupportedHealthStatus(HomeOps.Contracts.Events.EventSourceHealthStatus.NeverSynced));
        Assert.True(EventSourceContractValidation.IsSupportedPollInterval(HomeOps.Contracts.Events.EventSourcePollInterval.Every8Hours));

        Assert.Empty(EventSourceContractValidation.ValidateProviderConfiguration(EventSourceType.ICalFeed, new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("https://example.test/calendar.ics"))));
        Assert.Empty(EventSourceContractValidation.ValidateProviderConfiguration(EventSourceType.ICalFile, new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFile, ICalFile: new ICalFileSourceConfigurationRequest("calendar-files/file.ics", "file.ics", "sha256:abc"))));
        Assert.Contains(nameof(ICalFeedSourceConfigurationRequest.FeedUrl), EventSourceContractValidation.ValidateProviderConfiguration(EventSourceType.ICalFeed, new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("not-a-url"))).Keys);
        Assert.Contains("configuration", EventSourceContractValidation.ValidateProviderConfiguration(EventSourceType.ICalFeed, null).Keys);
        Assert.Contains("configuration", EventSourceContractValidation.ValidateProviderConfiguration(EventSourceType.Manual, new EventSourceProviderConfigurationRequest(EventSourceProviderConfigurationKind.ICalFeed, ICalFeed: new ICalFeedSourceConfigurationRequest("https://example.test/calendar.ics"))).Keys);
    }
}
