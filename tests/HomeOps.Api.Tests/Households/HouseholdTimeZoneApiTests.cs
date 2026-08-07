using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Tests.Lists;
using HomeOps.Contracts.Households;

namespace HomeOps.Api.Tests.Households;

public sealed class HouseholdTimeZoneApiTests
{
    [Fact]
    public async Task Current_zone_and_search_return_server_authoritative_IANA_values()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var current = await client.GetFromJsonAsync<HouseholdTimeZoneDto>("/api/households/current/time-zone");
        var matches = await client.GetFromJsonAsync<SupportedTimeZoneDto[]>("/api/time-zones?query=Amsterdam");

        Assert.NotNull(current);
        Assert.Equal("Europe/Amsterdam", current.TimeZoneId);
        Assert.NotNull(matches);
        Assert.Contains(matches, zone => zone.Id == "Europe/Amsterdam");
        Assert.All(matches, zone => Assert.Contains('/', zone.Id));
        var parisMatches = await client.GetFromJsonAsync<SupportedTimeZoneDto[]>("/api/time-zones?query=Paris");
        Assert.Contains(parisMatches!, zone => zone.Id == "Europe/Paris");
    }

    [Fact]
    public async Task Preview_explains_each_effect_and_update_requires_confirmation_and_expected_zone()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var previewResponse = await client.PostAsJsonAsync("/api/households/current/time-zone/preview", new HouseholdTimeZonePreviewRequest("America/New_York"));
        Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);
        var preview = await previewResponse.Content.ReadFromJsonAsync<HouseholdTimeZonePreviewDto>();
        Assert.NotNull(preview);
        Assert.Equal(4, preview.Explanations.Count);

        var unconfirmed = await client.PutAsJsonAsync("/api/households/current/time-zone", new UpdateHouseholdTimeZoneRequest("America/New_York", "Europe/Amsterdam", false));
        Assert.Equal(HttpStatusCode.BadRequest, unconfirmed.StatusCode);

        var conflict = await client.PutAsJsonAsync("/api/households/current/time-zone", new UpdateHouseholdTimeZoneRequest("America/New_York", "Europe/London", true));
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);

        var update = await client.PutAsJsonAsync("/api/households/current/time-zone", new UpdateHouseholdTimeZoneRequest("America/New_York", "Europe/Amsterdam", true));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        Assert.Equal("America/New_York", (await client.GetFromJsonAsync<HouseholdTimeZoneDto>("/api/households/current/time-zone"))?.TimeZoneId);
    }

    [Fact]
    public async Task Invalid_or_non_IANA_zone_is_rejected()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var response = await factory.CreateClient().PostAsJsonAsync("/api/households/current/time-zone/preview", new HouseholdTimeZonePreviewRequest("Pacific Standard Time"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
