using HomeOps.Api.EventSources.GoogleCalendar;
using HomeOps.Contracts.Events;

namespace HomeOps.Api.Tests.EventSources;

public sealed class GoogleCalendarAdapterTests
{
    [Fact]
    public void MapsGoogleCalendarSourceAsReadOnlyEventSource()
    {
        var adapter = CreateAdapter();

        var source = adapter.GetEventSource();

        Assert.Equal("google-family", source.Id);
        Assert.Equal("Family Google Calendar", source.Name);
        Assert.Equal(EventSourceType.GoogleCalendar, source.Type);
        Assert.True(source.Enabled);
        Assert.True(source.IsReadOnly);
        Assert.False(source.IsWritable);
        Assert.Equal("family@example.com", source.ExternalSourceId);
        Assert.Equal("#4285f4", source.Color.Hex);
        Assert.Equal("Google Calendar", source.Visibility.GroupName);
    }

    [Fact]
    public void ExposesGoogleCalendarSourceMetadataWithoutCredentials()
    {
        var adapter = CreateAdapter();

        var metadata = adapter.GetMetadata();

        Assert.Equal("family@example.com", metadata.CalendarId);
        Assert.Equal("America/New_York", metadata.TimeZone);
        Assert.Equal("reader", metadata.AccessRole);
    }

    [Fact]
    public void NormalizesAllDayGoogleEvent()
    {
        var adapter = CreateAdapter();

        var normalizedEvent = adapter.GetEvents().Single(e => e.ExternalEventId == "google-all-day-1");

        Assert.Equal("google-family", normalizedEvent.SourceId);
        Assert.Equal("google-family:google-all-day-1", normalizedEvent.Id);
        Assert.Equal("School closure", normalizedEvent.Title);
        Assert.True(normalizedEvent.AllDay);
        Assert.False(normalizedEvent.Editable);
        Assert.Equal(DateTimeOffset.Parse("2026-06-18T00:00:00Z"), normalizedEvent.StartsAt);
        Assert.Equal(DateTimeOffset.Parse("2026-06-19T00:00:00Z"), normalizedEvent.EndsAt);
    }

    [Fact]
    public void NormalizesTimedGoogleEvent()
    {
        var adapter = CreateAdapter();

        var normalizedEvent = adapter.GetEvents().Single(e => e.ExternalEventId == "google-timed-1");

        Assert.Equal("google-family", normalizedEvent.SourceId);
        Assert.Equal("google-family:google-timed-1", normalizedEvent.Id);
        Assert.Equal("Dentist appointment", normalizedEvent.Title);
        Assert.False(normalizedEvent.AllDay);
        Assert.False(normalizedEvent.Editable);
        Assert.Equal(DateTimeOffset.Parse("2026-06-19T14:30:00-04:00"), normalizedEvent.StartsAt);
        Assert.Equal(DateTimeOffset.Parse("2026-06-19T15:15:00-04:00"), normalizedEvent.EndsAt);
        Assert.Equal("Downtown Dental", normalizedEvent.Location);
    }

    private static GoogleCalendarAdapter CreateAdapter() => new(
        new GoogleCalendarSourceConfiguration(
            SourceId: "google-family",
            CalendarId: "family@example.com",
            DisplayName: "Family Google Calendar",
            Enabled: true,
            ColorHex: "#4285f4"),
        new FakeGoogleCalendarEventProvider());
}
