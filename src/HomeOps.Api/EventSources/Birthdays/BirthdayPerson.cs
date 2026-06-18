namespace HomeOps.Api.EventSources.Birthdays;

public sealed record BirthdayPerson(
    string Id,
    string DisplayName,
    int Month,
    int Day,
    int? BirthYear = null);
