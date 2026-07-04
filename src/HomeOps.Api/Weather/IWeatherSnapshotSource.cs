namespace HomeOps.Api.Weather;

public interface IWeatherSnapshotSource
{
    Task<FamilyBoardWeatherSnapshot> GetSnapshotAsync(Guid householdId, CancellationToken cancellationToken = default);
}
