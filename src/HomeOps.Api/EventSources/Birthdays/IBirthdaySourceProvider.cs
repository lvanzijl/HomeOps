namespace HomeOps.Api.EventSources.Birthdays;

public interface IBirthdaySourceProvider
{
    IReadOnlyList<BirthdayPerson> GetBirthdays();
}
