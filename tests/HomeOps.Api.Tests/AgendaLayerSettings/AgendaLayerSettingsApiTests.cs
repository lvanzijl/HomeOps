using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.Tests.Lists;

namespace HomeOps.Api.Tests.AgendaLayerSettings;

public sealed class AgendaLayerSettingsApiTests
{
    [Fact]
    public async Task GetSettingsReturnsEmptySettingsForNewDevice()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-HomeOps-Device-Key", "device-a");

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
        client.DefaultRequestHeaders.Add("X-HomeOps-Device-Key", "device-a");
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
        deviceA.DefaultRequestHeaders.Add("X-HomeOps-Device-Key", "device-a");
        var deviceB = factory.CreateClient();
        deviceB.DefaultRequestHeaders.Add("X-HomeOps-Device-Key", "device-b");

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
        client.DefaultRequestHeaders.Add("X-HomeOps-Device-Key", "device-a");

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
}
