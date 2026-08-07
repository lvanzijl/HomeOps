using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.Data;
using HomeOps.Api.Tests.Lists;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.AgendaLayerSettings;

public sealed class AgendaLayerSettingsApiTests
{
    [Fact]
    public async Task GetSettingsReturnsEmptySettingsForNewDevice()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        AddDeviceHeaders(client, "device-a");

        var settings = await client.GetFromJsonAsync<AgendaLayerSettingsDto>("/api/agenda/layer-settings");

        Assert.NotNull(settings);
        Assert.Empty(settings.Week);
        Assert.Empty(settings.Months);
    }

    [Fact]
    public async Task SaveSettingsCreatesAndUpdatesDeviceSettings()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        AddDeviceHeaders(client, "device-a");
        var request = new SaveAgendaLayerSettingsRequest(
            new Dictionary<string, bool> { ["manual-source"] = false, ["birthdays"] = true },
            new Dictionary<string, bool> { ["manual-source"] = true, ["birthdays"] = false });

        var response = await client.PutAsJsonAsync("/api/agenda/layer-settings", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = await response.Content.ReadFromJsonAsync<AgendaLayerSettingsDto>();
        Assert.NotNull(saved);
        Assert.False(saved.Week["manual-source"]);
        Assert.True(saved.Months["manual-source"]);

        var update = new SaveAgendaLayerSettingsRequest(
            new Dictionary<string, bool> { ["manual-source"] = true },
            new Dictionary<string, bool> { ["manual-source"] = false });
        await client.PutAsJsonAsync("/api/agenda/layer-settings", update);
        var loaded = await client.GetFromJsonAsync<AgendaLayerSettingsDto>("/api/agenda/layer-settings");

        Assert.NotNull(loaded);
        Assert.True(loaded.Week["manual-source"]);
        Assert.False(loaded.Months["manual-source"]);
        Assert.DoesNotContain("birthdays", loaded.Week.Keys);
    }

    [Fact]
    public async Task SettingsAreIsolatedByDeviceKey()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var deviceA = factory.CreateClient();
        AddDeviceHeaders(deviceA, "device-a");
        var deviceB = factory.CreateClient();
        AddDeviceHeaders(deviceB, "device-b");

        await deviceA.PutAsJsonAsync("/api/agenda/layer-settings", new SaveAgendaLayerSettingsRequest(
            new Dictionary<string, bool> { ["manual-source"] = false },
            new Dictionary<string, bool> { ["manual-source"] = true }));

        var deviceBSettings = await deviceB.GetFromJsonAsync<AgendaLayerSettingsDto>("/api/agenda/layer-settings");

        Assert.NotNull(deviceBSettings);
        Assert.Empty(deviceBSettings.Week);
        Assert.Empty(deviceBSettings.Months);
    }

    [Fact]
    public async Task UnknownSourceIdsCanBeStoredForForwardCompatibleSettings()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        AddDeviceHeaders(client, "device-a");

        var response = await client.PutAsJsonAsync("/api/agenda/layer-settings", new SaveAgendaLayerSettingsRequest(
            new Dictionary<string, bool> { ["future-source"] = false },
            new Dictionary<string, bool>()));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var loaded = await client.GetFromJsonAsync<AgendaLayerSettingsDto>("/api/agenda/layer-settings");
        Assert.NotNull(loaded);
        Assert.False(loaded.Week["future-source"]);
    }

    [Fact]
    public async Task MissingDeviceKeyIsRejected()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/agenda/layer-settings");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("device-a", null)]
    [InlineData("device-a", "2")]
    [InlineData("invalid device", "1")]
    [InlineData("", "1")]
    public async Task Missing_or_invalid_device_headers_are_rejected(string deviceId, string? version)
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        if (deviceId.Length > 0) client.DefaultRequestHeaders.Add("X-HomeOps-Device-Key", deviceId);
        if (version is not null) client.DefaultRequestHeaders.Add("X-HomeOps-Device-Version", version);

        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/agenda/layer-settings")).StatusCode);
    }

    [Fact]
    public async Task Reads_and_writes_upsert_identity_and_touch_last_seen()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        AddDeviceHeaders(client, "device-touch");
        await client.GetAsync("/api/agenda/layer-settings");
        DateTimeOffset original;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var identity = await db.DeviceSettingsIdentities.SingleAsync(item => item.DeviceId == "device-touch");
            original = identity.LastSeenUtc.AddDays(-1);
            identity.LastSeenUtc = original;
            await db.SaveChangesAsync();
        }

        await client.PutAsJsonAsync("/api/agenda/layer-settings", new SaveAgendaLayerSettingsRequest(
            new Dictionary<string, bool> { ["manual-source"] = false },
            new Dictionary<string, bool>()));

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var identity = await db.DeviceSettingsIdentities.AsNoTracking().SingleAsync(item => item.DeviceId == "device-touch");
            Assert.Equal(1, identity.SchemaVersion);
            Assert.True(identity.LastSeenUtc > original);
        }
    }

    [Fact]
    public async Task Reset_deletes_current_identity_and_settings_then_get_recreates_defaults()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        AddDeviceHeaders(client, "device-reset");
        await client.PutAsJsonAsync("/api/agenda/layer-settings", new SaveAgendaLayerSettingsRequest(
            new Dictionary<string, bool> { ["manual-source"] = false },
            new Dictionary<string, bool> { ["manual-source"] = false }));

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/api/agenda/layer-settings/device")).StatusCode);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            Assert.False(await db.DeviceSettingsIdentities.AnyAsync(item => item.DeviceId == "device-reset"));
            Assert.False(await db.AgendaLayerSettings.AnyAsync(item => item.DeviceId == "device-reset"));
        }

        var defaults = await client.GetFromJsonAsync<AgendaLayerSettingsDto>("/api/agenda/layer-settings");
        Assert.NotNull(defaults);
        Assert.Empty(defaults.Week);
        Assert.Empty(defaults.Months);
    }

    private static void AddDeviceHeaders(HttpClient client, string deviceId)
    {
        client.DefaultRequestHeaders.Add("X-HomeOps-Device-Key", deviceId);
        client.DefaultRequestHeaders.Add("X-HomeOps-Device-Version", "1");
    }
}
