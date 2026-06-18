namespace HomeOps.Api.EventSources.Birthdays;

public sealed record BirthdaySourceMetadata(
    string SourceId,
    int PersonCount,
    DateOnly GenerationStartsOn,
    DateOnly GenerationEndsBefore,
    string RecurrenceStrategy,
    string LeapYearStrategy,
    bool FutureEditingSupported);
