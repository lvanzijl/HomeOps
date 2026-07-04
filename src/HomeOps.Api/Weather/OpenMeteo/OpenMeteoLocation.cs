namespace HomeOps.Api.Weather.OpenMeteo;

public sealed record OpenMeteoLocation(
    Guid HouseholdId,
    decimal Latitude,
    decimal Longitude);
