using HomeOps.Contracts.Events;

namespace HomeOps.Api.Tests.Events;

public sealed class EventFrameworkModelTests
{
    [Fact]
    public void WritableEventSourceReportsWritableCapability()
    {
        var source = new EventSource(
            Id: "manual-events",
            Name: "HomeOps Calendar",
            Type: EventSourceType.Manual,
            Enabled: true,
            Capability: EventSourceCapability.Writable,
            Visibility: new EventSourceVisibility(VisibleByDefault: true, GroupName: "Household"),
            Color: new EventSourceColor("#4f46e5"));

        Assert.True(source.IsWritable);
        Assert.False(source.IsReadOnly);
    }

    [Fact]
    public void NormalizedEventReferencesOwningSource()
    {
        var startsAt = DateTimeOffset.Parse("2026-06-18T09:00:00Z");

        var normalizedEvent = new NormalizedEvent(
            Id: "event-1",
            SourceId: "manual-events",
            Title: "Example household event",
            StartsAt: startsAt,
            EndsAt: null,
            AllDay: false,
            Editable: true,
            ProviderEventId: "external-event-1");

        Assert.Equal("manual-events", normalizedEvent.SourceId);
        Assert.True(normalizedEvent.Editable);
        Assert.Equal("external-event-1", normalizedEvent.ProviderEventId);
    }
}
