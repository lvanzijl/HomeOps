using HomeOps.Api.EventSources.Birthdays;
using HomeOps.Contracts.Events;

namespace HomeOps.Api.Tests.EventSources;

public sealed class BirthdaySourceAdapterTests
{
    [Fact]
    public void MapsBirthdaySourceMetadataAndWritableSource()
    {
        var adapter = CreateAdapter();

        var source = adapter.GetEventSource();
        var metadata = adapter.GetMetadata();

        Assert.Equal("birthdays", source.Id);
        Assert.Equal(EventSourceType.Birthdays, source.Type);
        Assert.True(source.IsWritable);
        Assert.Equal("Birthdays", source.Visibility.GroupName);
        Assert.Equal("#f97316", source.Color.Hex);
        Assert.Equal(5, metadata.PersonCount);
        Assert.Equal(new DateOnly(2026, 6, 18), metadata.GenerationStartsOn);
        Assert.Equal(new DateOnly(2027, 12, 18), metadata.GenerationEndsBefore);
        Assert.True(metadata.FutureEditingSupported);
    }

    [Fact]
    public void GeneratesAllDayNormalizedBirthdayEventsWithinHorizon()
    {
        var adapter = CreateAdapter();

        var events = adapter.GetEvents();

        Assert.Contains(events, birthday => birthday.ProviderEventId == "avery" && birthday.StartsAt == DateTimeOffset.Parse("2026-06-20T00:00:00Z"));
        Assert.Contains(events, birthday => birthday.ProviderEventId == "riley" && birthday.StartsAt == DateTimeOffset.Parse("2026-11-03T00:00:00Z"));
        Assert.Contains(events, birthday => birthday.ProviderEventId == "casey" && birthday.StartsAt == DateTimeOffset.Parse("2027-01-15T00:00:00Z"));
        Assert.All(events, birthday =>
        {
            Assert.Equal("birthdays", birthday.SourceId);
            Assert.True(birthday.AllDay);
            Assert.False(birthday.Editable);
            Assert.StartsWith("birthdays:", birthday.Id);
            Assert.Equal(birthday.StartsAt.AddDays(1), birthday.EndsAt);
        });
    }

    [Fact]
    public void GeneratesAnnualRecurrencesAndMultipleBirthdaysInSameMonth()
    {
        var adapter = CreateAdapter();

        var events = adapter.GetEvents();

        Assert.Contains(events, birthday => birthday.ProviderEventId == "avery" && birthday.StartsAt.Year == 2026);
        Assert.Contains(events, birthday => birthday.ProviderEventId == "avery" && birthday.StartsAt.Year == 2027);
        Assert.True(events.Count(birthday => birthday.StartsAt.Year == 2026 && birthday.StartsAt.Month == 6) >= 2);
    }

    [Fact]
    public void ObservesLeapDayBirthdaysOnFebruaryTwentyEighthInNonLeapYears()
    {
        var adapter = new BirthdaySourceAdapter(
            new BirthdaySourceConfiguration(
                SourceId: "birthdays",
                DisplayName: "Birthdays",
                Enabled: true,
                GenerationAnchorDate: new DateOnly(2027, 1, 1),
                HorizonMonths: 3,
                ColorHex: "#f97316"),
            new FakeBirthdaySourceProvider());

        var leapBirthday = adapter.GetEvents().Single(birthday => birthday.ProviderEventId == "leap");

        Assert.Equal(DateTimeOffset.Parse("2027-02-28T00:00:00Z"), leapBirthday.StartsAt);
    }

    private static BirthdaySourceAdapter CreateAdapter() => new(
        new BirthdaySourceConfiguration(
            SourceId: "birthdays",
            DisplayName: "Birthdays",
            Enabled: true,
            GenerationAnchorDate: new DateOnly(2026, 6, 18),
            HorizonMonths: 18,
            ColorHex: "#f97316"),
        new FakeBirthdaySourceProvider());
}
