using System.Net;
using System.Net.Http.Json;
using System.Text;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Tests.Lists;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class FloorPlanAssetApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task SvgUploadActivationReplacementRollbackAndDerivativeUseSanitizedContent()
    {
        var floor = await CreateFloor("Asset floor");
        var first = await Upload(floor.Id, "first.svg", "<svg viewBox='0 0 100 50' xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script><rect onclick='bad()' width='100' height='50'/></svg>");
        Assert.Equal(FloorPlanAssetState.Validated, first.State);
        Assert.Equal(100, first.CoordinateBasisWidth);

        var activated = await PostAsset($"/api/floors/{floor.Id}/floor-plan-assets/{first.Id}/activate");
        Assert.Equal(FloorPlanAssetState.Active, activated.State);

        var derivative = await _client.GetStringAsync($"/api/floor-plan-assets/{first.Id}/derivative");
        Assert.DoesNotContain("script", derivative, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", derivative, StringComparison.OrdinalIgnoreCase);

        var replacement = await Upload(floor.Id, "second.svg", "<svg viewBox='0 0 200 100' xmlns='http://www.w3.org/2000/svg'><rect width='200' height='100'/></svg>");
        Assert.Equal(first.Id, replacement.ReplacementOfAssetId);
        var activeBeforeReplacement = await _client.GetFromJsonAsync<FloorPlanAssetDto>($"/api/floors/{floor.Id}/floor-plan-assets/active");
        Assert.Equal(first.Id, activeBeforeReplacement!.Id);

        var directReplacement = await _client.PostAsync($"/api/floors/{floor.Id}/floor-plan-assets/{replacement.Id}/activate", null);
        Assert.Equal(HttpStatusCode.BadRequest, directReplacement.StatusCode);
        activeBeforeReplacement = await _client.GetFromJsonAsync<FloorPlanAssetDto>($"/api/floors/{floor.Id}/floor-plan-assets/active");
        Assert.Equal(first.Id, activeBeforeReplacement!.Id);
    }

    [Fact]
    public async Task UnsupportedAndMismatchedUploadsAreRejected()
    {
        var floor = await CreateFloor("Rejected asset floor");
        Assert.Equal(HttpStatusCode.BadRequest, (await UploadRaw(floor.Id, "plan.pdf", "%PDF-1.7")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await UploadRaw(floor.Id, "plan.png", "<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'></svg>")).StatusCode);
    }

    private async Task<FloorDto> CreateFloor(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest(name));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FloorDto>())!;
    }

    private async Task<FloorPlanAssetDto> Upload(Guid floorId, string filename, string body)
    {
        var response = await UploadRaw(floorId, filename, body);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FloorPlanAssetUploadResult>())!.Asset;
    }

    private async Task<HttpResponseMessage> UploadRaw(Guid floorId, string filename, string body)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes(body)), "file", filename);
        return await _client.PostAsync($"/api/floors/{floorId}/floor-plan-assets", form);
    }

    private async Task<FloorPlanAssetDto> PostAsset(string url)
    {
        var response = await _client.PostAsync(url, null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FloorPlanAssetDto>())!;
    }
}
