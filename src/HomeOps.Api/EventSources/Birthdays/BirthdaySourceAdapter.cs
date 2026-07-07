using HomeOps.Api.EventSources;
using HomeOps.Contracts.Events;

namespace HomeOps.Api.EventSources.Birthdays;

public sealed class BirthdaySourceAdapter : IEventSourceAdapter
{
    private const string RecurrenceStrategy = "Generate annual all-day events within the configured horizon.";
    private const string LeapYearStrategy = "Feb 29 birthdays are observed on Feb 28 in non-leap years.";

    private readonly BirthdaySourceConfiguration configuration;
    private readonly IBirthdaySourceProvider provider;

    public BirthdaySourceAdapter(BirthdaySourceConfiguration configuration, IBirthdaySourceProvider provider)
    {
        this.configuration = configuration;
        this.provider = provider;
    }

    public EventSource GetEventSource() => new(
        Id: configuration.SourceId,
        Name: configuration.DisplayName,
        Type: EventSourceType.Birthdays,
        Enabled: configuration.Enabled,
        Capability: EventSourceCapability.Writable,
        Visibility: new EventSourceVisibility(VisibleByDefault: true, GroupName: "Birthdays"),
        Color: new EventSourceColor(configuration.ColorHex),
        ProviderSourceId: null);

    public BirthdaySourceMetadata GetMetadata()
    {
        var birthdays = provider.GetBirthdays();
        return new BirthdaySourceMetadata(
            SourceId: configuration.SourceId,
            PersonCount: birthdays.Count,
            GenerationStartsOn: configuration.GenerationAnchorDate,
            GenerationEndsBefore: GetGenerationEndDate(),
            RecurrenceStrategy: RecurrenceStrategy,
            LeapYearStrategy: LeapYearStrategy,
            FutureEditingSupported: true);
    }

    public IReadOnlyList<NormalizedEvent> GetEvents()
    {
        var startsOn = configuration.GenerationAnchorDate;
        var endsBefore = GetGenerationEndDate();

        return provider.GetBirthdays()
            .SelectMany(person => GenerateOccurrences(person, startsOn, endsBefore))
            .OrderBy(normalizedEvent => normalizedEvent.StartsAt)
            .ThenBy(normalizedEvent => normalizedEvent.Title)
            .ToArray();
    }

    private IEnumerable<NormalizedEvent> GenerateOccurrences(BirthdayPerson person, DateOnly startsOn, DateOnly endsBefore)
    {
        for (var year = startsOn.Year; year <= endsBefore.Year; year++)
        {
            var occurrenceDate = GetOccurrenceDate(person, year);
            if (occurrenceDate < startsOn || occurrenceDate >= endsBefore)
            {
                continue;
            }

            yield return new NormalizedEvent(
                Id: $"{configuration.SourceId}:{person.Id}:{occurrenceDate:yyyyMMdd}",
                EventSeriesId: $"{configuration.SourceId}:{person.Id}",
                SourceId: configuration.SourceId,
                Title: $"{person.DisplayName} birthday",
                StartsAt: new DateTimeOffset(occurrenceDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero),
                EndsAt: new DateTimeOffset(occurrenceDate.AddDays(1).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero),
                AllDay: true,
                Editable: false,
                ProviderEventId: person.Id,
                Description: person.BirthYear is null ? null : $"Born in {person.BirthYear}",
                Location: null);
        }
    }

    private DateOnly GetGenerationEndDate() => configuration.GenerationAnchorDate.AddMonths(configuration.HorizonMonths);

    private static DateOnly GetOccurrenceDate(BirthdayPerson person, int year)
    {
        if (person.Month == 2 && person.Day == 29 && !DateTime.IsLeapYear(year))
        {
            return new DateOnly(year, 2, 28);
        }

        return new DateOnly(year, person.Month, person.Day);
    }
}
