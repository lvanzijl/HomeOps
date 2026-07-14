using System.Net;
using System.Net.Http.Json;
using System.Text;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Tests.Lists;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class FloorPlanAssetHardeningTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private static readonly byte[] ValidPng = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=");
    private static readonly byte[] ValidJpeg = Convert.FromBase64String("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IR//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z");

    [Fact]
    public async Task SanitizerRemovesOrRejectsUnsafeSvgSubset()
    {
        var service = Service();
        var sanitized = service.ValidateDerivativeBytes(Encoding.UTF8.GetBytes("<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg' onload='x()'><script>x()</script><animate attributeName='x'/><rect onclick='x()' width='10' height='10'/></svg>"), "plan.svg");
        var text = Encoding.UTF8.GetString(sanitized.DerivativeBytes);
        Assert.DoesNotContain("script", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onload", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("animate", text, StringComparison.OrdinalIgnoreCase);
        Assert.Throws<InvalidOperationException>(() => service.ValidateDerivativeBytes(Encoding.UTF8.GetBytes("<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'><style>@import url(https://example.test/a.css)</style><rect width='1' height='1'/></svg>"), "plan.svg"));
        Assert.Throws<InvalidOperationException>(() => service.ValidateDerivativeBytes(Encoding.UTF8.GetBytes("<!DOCTYPE svg [ <!ENTITY xxe SYSTEM 'file:///etc/passwd'> ]><svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'><text>&xxe;</text></svg>"), "plan.svg"));
    }

    [Fact]
    public void RasterValidationAcceptsValidImagesAndRejectsTruncatedOrOversizedImages()
    {
        var service = Service(new FloorPlanAssetOptions { MaxRasterWidth = 10, MaxRasterHeight = 10 });
        Assert.Equal("image/png", service.ValidateDerivativeBytes(ValidPng, "plan.png").MediaType);
        Assert.Equal("image/jpeg", service.ValidateDerivativeBytes(ValidJpeg, "plan.jpg").MediaType);
        Assert.Throws<InvalidOperationException>(() => service.ValidateDerivativeBytes(ValidPng[..20], "plan.png"));
        var huge = (byte[])ValidPng.Clone(); huge[16] = 0x00; huge[17] = 0x00; huge[18] = 0x03; huge[19] = 0xE8;
        Assert.Throws<InvalidOperationException>(() => service.ValidateDerivativeBytes(huge, "plan.png"));
    }

    [Fact]
    public async Task UploadWriteFailureDoesNotPersistUsableMetadata()
    {
        var floor = await CreateFloor("Write failure floor");
        var service = new FloorPlanAssetService(Options.Create(new FloorPlanAssetOptions { StorageRoot = "/dev/null/floor-plans" }));
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var uploadBytes = Encoding.UTF8.GetBytes("<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'><rect width='10' height='10'/></svg>");
        var file = new FormFile(new MemoryStream(uploadBytes), 0, uploadBytes.Length, "file", "plan.svg");
        var validated = await service.ValidateAsync(file, CancellationToken.None);
        await Assert.ThrowsAnyAsync<Exception>(() => service.StoreAsync(floor.Id, Guid.NewGuid(), validated, CancellationToken.None));
        Assert.Empty(await db.FloorPlanAssets.Where(asset => asset.FloorId == floor.Id).ToListAsync());
    }

    [Fact]
    public async Task BackupRestoreRehydratesDerivativeAndRejectsTamperedContentWithoutMutation()
    {
        var floor = await CreateFloor("Restore asset floor");
        var asset = await Upload(floor.Id, "restore.svg", "<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'><rect width='10' height='10'/></svg>");
        await PostAsset($"/api/floors/{floor.Id}/floor-plan-assets/{asset.Id}/activate");
        var export = await _client.GetFromJsonAsync<CalendarExportDocument>("/api/calendar/export");
        Assert.NotNull(export?.Calendar.FloorPlanAssets);
        Assert.NotNull(export.Calendar.FloorPlanAssets.Single(a => a.Id == asset.Id).DerivativeContentBase64);

        var restore = await _client.PostAsJsonAsync("/api/calendar/restore", export);
        Assert.Equal(HttpStatusCode.NoContent, restore.StatusCode);
        var derivative = await _client.GetAsync($"/api/floor-plan-assets/{asset.Id}/derivative");
        Assert.Equal(HttpStatusCode.OK, derivative.StatusCode);

        var tampered = export with { Calendar = export.Calendar with { FloorPlanAssets = export.Calendar.FloorPlanAssets.Select(a => a.Id == asset.Id ? a with { DerivativeContentBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes("not an image")) } : a).ToList() } };
        var failed = await _client.PostAsJsonAsync("/api/calendar/restore", tampered);
        Assert.Equal(HttpStatusCode.BadRequest, failed.StatusCode);
        var stillActive = await _client.GetFromJsonAsync<FloorPlanAssetDto>($"/api/floors/{floor.Id}/floor-plan-assets/active");
        Assert.Equal(asset.Id, stillActive!.Id);
    }

    [Fact]
    public async Task MissingDerivativeBackupCannotRestoreActiveAsset()
    {
        var floor = await CreateFloor("Missing derivative restore floor");
        var asset = await Upload(floor.Id, "missing.svg", "<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'><rect width='10' height='10'/></svg>");
        await PostAsset($"/api/floors/{floor.Id}/floor-plan-assets/{asset.Id}/activate");
        var export = await _client.GetFromJsonAsync<CalendarExportDocument>("/api/calendar/export");
        var missing = export! with { Calendar = export.Calendar with { FloorPlanAssets = export.Calendar.FloorPlanAssets!.Select(a => a.Id == asset.Id ? a with { DerivativeContentBase64 = null } : a).ToList() } };
        var failed = await _client.PostAsJsonAsync("/api/calendar/restore", missing);
        Assert.Equal(HttpStatusCode.BadRequest, failed.StatusCode);
    }

    private static FloorPlanAssetService Service(FloorPlanAssetOptions? options = null) => new(Options.Create(options ?? new FloorPlanAssetOptions()));

    private async Task<FloorDto> CreateFloor(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest(name));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FloorDto>())!;
    }

    private async Task<FloorPlanAssetDto> Upload(Guid floorId, string filename, string body)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes(body)), "file", filename);
        var response = await _client.PostAsync($"/api/floors/{floorId}/floor-plan-assets", form);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FloorPlanAssetUploadResult>())!.Asset;
    }

    private async Task<FloorPlanAssetDto> PostAsset(string url)
    {
        var response = await _client.PostAsync(url, null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FloorPlanAssetDto>())!;
    }
}
