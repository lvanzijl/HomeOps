namespace HomeOps.Api.EventSources.Birthdays;

public sealed class FakeBirthdaySourceProvider : IBirthdaySourceProvider
{
    public IReadOnlyList<BirthdayPerson> GetBirthdays() =>
    [
        new BirthdayPerson(Id: "avery", DisplayName: "Avery", Month: 6, Day: 20, BirthYear: 2014),
        new BirthdayPerson(Id: "morgan", DisplayName: "Morgan", Month: 6, Day: 25),
        new BirthdayPerson(Id: "riley", DisplayName: "Riley", Month: 11, Day: 3, BirthYear: 1988),
        new BirthdayPerson(Id: "casey", DisplayName: "Casey", Month: 1, Day: 15),
        new BirthdayPerson(Id: "leap", DisplayName: "Leap Day Friend", Month: 2, Day: 29)
    ];
}
