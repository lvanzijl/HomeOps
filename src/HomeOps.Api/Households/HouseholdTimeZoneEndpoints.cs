using HomeOps.Api.Data;
using HomeOps.Contracts.Households;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace HomeOps.Api.Households;

public static class HouseholdTimeZoneEndpoints
{
    private static readonly Lazy<IReadOnlyList<SupportedTimeZoneDto>> SupportedTimeZones = new(BuildSupportedIanaTimeZones, LazyThreadSafetyMode.ExecutionAndPublication);

    public static IEndpointRouteBuilder MapHouseholdTimeZoneEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/households/current/time-zone", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var household = await dbContext.Households.AsNoTracking().SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
            return Results.Ok(new HouseholdTimeZoneDto(household.TimeZoneId, household.UpdatedUtc));
        }).WithName("GetCurrentHouseholdTimeZone").Produces<HouseholdTimeZoneDto>();

        app.MapGet("/api/time-zones", (string? query) =>
        {
            var match = query?.Trim() ?? string.Empty;
            var zones = GetSupportedIanaTimeZones(match)
                .Where(zone => match.Length == 0 || zone.Id.Contains(match, StringComparison.OrdinalIgnoreCase) || zone.DisplayName.Contains(match, StringComparison.OrdinalIgnoreCase))
                .OrderBy(zone => zone.Id)
                .Take(100)
                .ToList();
            return Results.Ok(zones);
        }).WithName("ListSupportedTimeZones").Produces<IReadOnlyCollection<SupportedTimeZoneDto>>();

        app.MapPost("/api/households/current/time-zone/preview", async (HouseholdTimeZonePreviewRequest request, HomeOpsDbContext dbContext, HouseholdTimeZoneChangeService service, CancellationToken cancellationToken) =>
        {
            var errors = ValidateTimeZone(request.TimeZoneId);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            var household = await dbContext.Households.AsNoTracking().SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
            var impact = await service.GetImpactAsync(household.Id, cancellationToken);
            return Results.Ok(new HouseholdTimeZonePreviewDto(household.TimeZoneId, request.TimeZoneId, impact, Explanations));
        }).WithName("PreviewHouseholdTimeZoneChange").Produces<HouseholdTimeZonePreviewDto>().ProducesValidationProblem();

        app.MapPut("/api/households/current/time-zone", async (UpdateHouseholdTimeZoneRequest request, HouseholdTimeZoneChangeService service, CancellationToken cancellationToken) =>
        {
            var errors = ValidateTimeZone(request.TimeZoneId);
            if (string.IsNullOrWhiteSpace(request.ExpectedCurrentTimeZoneId)) errors[nameof(request.ExpectedCurrentTimeZoneId)] = ["De verwachte huidige tijdzone is verplicht."];
            if (!request.Confirmed) errors[nameof(request.Confirmed)] = ["Bevestig de gevolgen voordat je de tijdzone wijzigt."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            var result = await service.ChangeAsync(request, cancellationToken);
            var dto = new HouseholdTimeZoneUpdateDto(result.Status == HouseholdTimeZoneChangeStatus.Success, result.TimeZoneId, result.Impact, result.SourceFailures);
            return result.Status == HouseholdTimeZoneChangeStatus.Success ? Results.Ok(dto) : Results.Conflict(dto);
        }).WithName("UpdateHouseholdTimeZone").Produces<HouseholdTimeZoneUpdateDto>().Produces<HouseholdTimeZoneUpdateDto>(StatusCodes.Status409Conflict).ProducesValidationProblem();

        return app;
    }

    private static readonly string[] Explanations =
    [
        "Handmatige afspraken houden hun datum en kloktijd; het geprojecteerde moment kan veranderen.",
        "Datums van handmatige afspraken die de hele dag duren blijven ongewijzigd.",
        "Ingeschakelde iCal-bronnen worden vooraf volledig opgehaald en opnieuw genormaliseerd.",
        "Uitgeschakelde bronnen blijven verborgen en moeten eerst worden ververst voordat ze opnieuw kunnen worden ingeschakeld."
    ];

    private static Dictionary<string, string[]> ValidateTimeZone(string? timeZoneId) => HouseholdTimeZone.IsSupportedIanaTimeZone(timeZoneId)
        ? []
        : new Dictionary<string, string[]> { [nameof(HouseholdTimeZonePreviewRequest.TimeZoneId)] = ["Kies een ondersteunde IANA-tijdzone."] };

    private static string FormatOffset(TimeSpan offset) => $"UTC{(offset < TimeSpan.Zero ? "-" : "+")}{offset.Duration():hh\\:mm}";

    private static IEnumerable<SupportedTimeZoneDto> GetSupportedIanaTimeZones(string query)
    {
        var supported = SupportedTimeZones.Value;
        if (HouseholdTimeZone.IsSupportedIanaTimeZone(query) && supported.All(zone => !string.Equals(zone.Id, query, StringComparison.Ordinal)))
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(query);
            return supported.Append(new SupportedTimeZoneDto(query, zone.DisplayName, FormatOffset(zone.BaseUtcOffset)));
        }

        return supported;
    }

    private static IReadOnlyList<SupportedTimeZoneDto> BuildSupportedIanaTimeZones()
    {
        var identifiers = new HashSet<string>(StringComparer.Ordinal);
        var territories = CultureInfo.GetCultures(CultureTypes.SpecificCultures)
            .Select(culture =>
            {
                try { return new RegionInfo(culture.Name).TwoLetterISORegionName; }
                catch (ArgumentException) { return null; }
            })
            .Where(code => code is not null)
            .Append("001")
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        foreach (var systemZone in TimeZoneInfo.GetSystemTimeZones())
        {
            if (systemZone.Id.Contains('/'))
            {
                identifiers.Add(systemZone.Id);
            }
            else
            {
                foreach (var territory in territories)
                {
                    if (TimeZoneInfo.TryConvertWindowsIdToIanaId(systemZone.Id, territory, out var ianaId) && ianaId.Contains('/'))
                    {
                        identifiers.Add(ianaId);
                    }
                }
            }
        }

        identifiers.Add(HouseholdTimeZone.DefaultTimeZoneId);
        var result = new List<SupportedTimeZoneDto>();
        foreach (var identifier in identifiers)
        {
            TimeZoneInfo zone;
            try { zone = TimeZoneInfo.FindSystemTimeZoneById(identifier); }
            catch (Exception exception) when (exception is TimeZoneNotFoundException or InvalidTimeZoneException) { continue; }
            result.Add(new SupportedTimeZoneDto(identifier, zone.DisplayName, FormatOffset(zone.BaseUtcOffset)));
        }

        return result;
    }
}
