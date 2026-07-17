using System.Net;
using System.Text;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class HomeAssistantClimateProviderTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 17, 12, 0, 0, TimeSpan.Zero);
    private const string Token = "super-secret-ha-token";

    [Fact]
    public async Task HttpClientAppliesBearerTokenNormalizesBaseUrlAndMapsFailuresSafely()
    {
        using var env = new EnvToken(Token);
        await using var db = Db(); var fx = Seed(db, ClimateSourceRole.ComfortTemperature, "https://ha.local:8123/root/");
        var handler = new QueueHandler(
            req => Json(HttpStatusCode.OK, Entity("sensor.room", "21.5", Attr(("unit_of_measurement", "°C")))),
            req => new HttpResponseMessage(HttpStatusCode.Unauthorized) { Content = new StringContent("raw auth body " + Token) },
            req => new HttpResponseMessage(HttpStatusCode.Forbidden),
            req => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable) { Content = new StringContent("raw unavailable body") },
            req => throw new HttpRequestException("dns leaked host secret"),
            req => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{not json") },
            req => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("") },
            req => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(new string('x', 70000)) },
            req => new HttpResponseMessage((HttpStatusCode)418));
        var provider = Provider(db, handler);

        var valid = await provider.ValidateMappingAsync(fx.Mapping.Id, default);
        Assert.True(valid.IsValid);
        var first = Assert.Single(handler.Requests);
        Assert.Equal(new Uri("https://ha.local:8123/api/states/sensor.room"), first.RequestUri);
        Assert.Equal("Bearer", first.Headers.Authorization!.Scheme);
        Assert.Equal(Token, first.Headers.Authorization!.Parameter);
        Assert.Equal(TimeSpan.FromSeconds(10), handler.Client!.Timeout);

        foreach (var expected in new[] { "AuthenticationFailed", "AuthenticationFailed", "ProviderUnavailable", "ProviderUnreachable", "ProviderUnreachable", "ProviderUnreachable", "ProviderUnreachable", "ProviderUnavailable" })
        {
            var result = await provider.ValidateMappingAsync(fx.Mapping.Id, default);
            Assert.False(result.IsValid);
            Assert.Equal(expected, result.Code);
            Assert.DoesNotContain(Token, result.Message);
            Assert.DoesNotContain("raw", result.Message, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("dns leaked", result.Message, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Theory]
    [InlineData("http://homeassistant.local:8123", true)]
    [InlineData("https://homeassistant.local/", true)]
    [InlineData("homeassistant.local:8123", false)]
    [InlineData("ftp://homeassistant.local", false)]
    [InlineData("http://user:pass@homeassistant.local", false)]
    [InlineData("http://[", false)]
    public async Task UrlValidationAcceptsOnlyExplicitSafePolicy(string url, bool valid)
    {
        using var env = new EnvToken(Token);
        await using var db = Db(); var fx = Seed(db, ClimateSourceRole.ComfortTemperature, url);
        var provider = Provider(db, new QueueHandler(_ => Json(HttpStatusCode.OK, Entity("sensor.room", "20", Attr(("unit_of_measurement", "°C"))))));
        var result = await provider.ValidateMappingAsync(fx.Mapping.Id, default);
        Assert.Equal(valid, result.IsValid);
        if (!valid) Assert.Equal("InvalidConfiguration", result.Code);
    }

    [Fact]
    public async Task MissingAndFallbackTokenHandlingIsSafeAndDoesNotPersistCredentials()
    {
        Environment.SetEnvironmentVariable("HomeAssistant__AccessToken", null);
        Environment.SetEnvironmentVariable("HOMEASSISTANT__ACCESSTOKEN", null);
        await using var db = Db(); var fx = Seed(db, ClimateSourceRole.ComfortTemperature);
        var provider = Provider(db, new QueueHandler(_ => throw new InvalidOperationException("should not call")));
        var missing = await provider.ValidateMappingAsync(fx.Mapping.Id, default);
        Assert.Equal("MissingCredential", missing.Code);
        Assert.DoesNotContain(Token, fx.Provider.DiagnosticMetadata ?? string.Empty);

        using var env = new EnvToken(Token);
        var ok = await Provider(db, new QueueHandler(_ => Json(HttpStatusCode.OK, Entity("sensor.room", "20", Attr(("unit_of_measurement", "°C")))))).ValidateMappingAsync(fx.Mapping.Id, default);
        Assert.True(ok.IsValid);
        Assert.Null((await db.ClimateProviders.SingleAsync()).DiagnosticMetadata);
    }

    [Theory]
    [InlineData(ClimateSourceRole.ComfortTemperature, "sensor.temp", "68", "°F", true, "Healthy")]
    [InlineData(ClimateSourceRole.ComfortTemperature, "climate.room", "heat", "°C", true, "Healthy")]
    [InlineData(ClimateSourceRole.ComfortTemperature, "light.room", "20", "°C", false, "RoleMismatch")]
    [InlineData(ClimateSourceRole.ComfortTemperature, "sensor.temp", "bad", "°C", false, "RoleMismatch")]
    [InlineData(ClimateSourceRole.ComfortTemperature, "sensor.temp", "20", "K", false, "RoleMismatch")]
    [InlineData(ClimateSourceRole.Humidity, "sensor.humidity", "45", "%", true, "Healthy")]
    [InlineData(ClimateSourceRole.Humidity, "sensor.humidity", "101", "%", false, "RoleMismatch")]
    [InlineData(ClimateSourceRole.Humidity, "sensor.humidity", "-1", "%", false, "RoleMismatch")]
    [InlineData(ClimateSourceRole.Humidity, "sensor.humidity", "bad", "%", false, "RoleMismatch")]
    [InlineData(ClimateSourceRole.HeatingTargetTemperature, "climate.room", "heat", "°C", true, "Healthy")]
    [InlineData(ClimateSourceRole.HeatingStatus, "climate.room", "heat", "°C", true, "Healthy")]
    [InlineData(ClimateSourceRole.HeatingControl, "climate.room", "heat", "°C", true, "Healthy")]
    [InlineData(ClimateSourceRole.HeatingControl, "sensor.temp", "20", "°C", false, "MissingAttribute")]
    public async Task MappingValidationCoversSupportedRolesAndMismatches(ClimateSourceRole role, string entityId, string state, string unit, bool valid, string code)
    {
        using var env = new EnvToken(Token);
        await using var db = Db(); var fx = Seed(db, role);
        var attrs = role == ClimateSourceRole.Humidity ? Attr(("unit_of_measurement", unit)) : Attr(("unit_of_measurement", unit), ("temperature_unit", unit), ("current_temperature", "20"), ("temperature", "21"), ("min_temp", "15"), ("max_temp", "25"), ("target_temp_step", "0.5"), ("hvac_action", "heating"));
        var provider = Provider(db, new QueueHandler(_ => Json(HttpStatusCode.OK, Entity(entityId, state, attrs))));
        var result = await provider.ValidateMappingAsync(fx.Mapping.Id, default);
        Assert.Equal(valid, result.IsValid);
        Assert.Equal(code, result.Code);
    }

    [Fact]
    public async Task ObservationNormalizationRefreshesPartialValuesAndNeverInfersHeating()
    {
        using var env = new EnvToken(Token);
        await using var db = Db();
        var temp = Seed(db, ClimateSourceRole.ComfortTemperature, externalId: "sensor.temp");
        var humidity = AddMapping(db, temp, ClimateSourceRole.Humidity, "sensor.humidity");
        var target = AddMapping(db, temp, ClimateSourceRole.HeatingTargetTemperature, "climate.target");
        var status = AddMapping(db, temp, ClimateSourceRole.HeatingStatus, "climate.status");
        var handler = new QueueHandler(
            _ => Json(HttpStatusCode.OK, Entity("sensor.temp", "68", Attr(("unit_of_measurement", "°F")))),
            _ => Json(HttpStatusCode.OK, Entity("sensor.humidity", "45", Attr(("unit_of_measurement", "%")))),
            _ => Json(HttpStatusCode.OK, Entity("climate.target", "heat", Attr(("temperature", "21"), ("temperature_unit", "°C")))),
            _ => Json(HttpStatusCode.OK, Entity("climate.status", "heat", Attr(("temperature", "25"), ("current_temperature", "18"), ("temperature_unit", "°C"), ("hvac_action", "idle")))));
        var provider = Provider(db, handler);

        var result = await provider.RefreshProviderAsync(temp.Provider.Id, default);

        Assert.Equal(4, result.SubmittedCount);
        var obs = await db.RoomClimateObservations.OrderBy(o => o.SourceReference).ToListAsync();
        Assert.Contains(obs, o => o.SourceMappingId == temp.Mapping.Id && o.TemperatureCelsius == 20m && o.OperatingState == RoomClimateOperatingState.Unknown);
        Assert.Contains(obs, o => o.SourceMappingId == humidity.Id && o.RelativeHumidity == 45m);
        Assert.Contains(obs, o => o.SourceMappingId == target.Id && o.TargetTemperatureCelsius == 21m);
        Assert.Contains(obs, o => o.SourceMappingId == status.Id && o.OperatingState == RoomClimateOperatingState.Idle);
        Assert.All(obs, o => { Assert.DoesNotContain("{", o.StatusDetail ?? string.Empty); Assert.DoesNotContain(Token, o.StatusDetail ?? string.Empty); });
    }

    [Fact]
    public async Task RefreshIsolationAndHealthTransitionsKeepValidObservationsFactual()
    {
        using var env = new EnvToken(Token);
        await using var db = Db(); var a = Seed(db, ClimateSourceRole.ComfortTemperature, externalId: "sensor.good"); var bad = AddMapping(db, a, ClimateSourceRole.ComfortTemperature, "sensor.missing");
        var other = Seed(db, ClimateSourceRole.ComfortTemperature, externalId: "sensor.other", roomName: "Other");
        var provider = Provider(db, new QueueHandler(
            _ => Json(HttpStatusCode.OK, Entity("sensor.good", "20", Attr(("unit_of_measurement", "°C")))),
            _ => new HttpResponseMessage(HttpStatusCode.NotFound),
            _ => Json(HttpStatusCode.OK, Entity("sensor.other", "22", Attr(("unit_of_measurement", "°C"))))));

        var result = await provider.RefreshProviderAsync(a.Provider.Id, default);

        Assert.Equal(1, result.SubmittedCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal(MappingHealth.Healthy, (await db.RoomClimateSourceMappings.FindAsync(a.Mapping.Id))!.Health);
        Assert.Equal(MappingHealth.Missing, (await db.RoomClimateSourceMappings.FindAsync(bad.Id))!.Health);
        Assert.Equal(MappingHealth.Healthy, (await db.RoomClimateSourceMappings.FindAsync(other.Mapping.Id))!.Health);
        Assert.Equal(1, await db.RoomClimateObservations.CountAsync());
    }

    [Fact]
    public async Task HeatingCapabilityCommandsAndResumeUseSafeProviderNeutralLifecycle()
    {
        using var env = new EnvToken(Token);
        await using var db = Db(); var fx = Seed(db, ClimateSourceRole.HeatingControl, externalId: "climate.room", metadata: "ha-resume:script:turn_on:script.resume");
        db.RoomClimateObservations.Add(new RoomClimateObservation { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceMappingId = fx.Mapping.Id, ObservedUtc = Now.AddMinutes(-1), ReceivedUtc = Now.AddMinutes(-1), TemperatureCelsius = 20, TargetTemperatureCelsius = 20, OperatingState = RoomClimateOperatingState.Idle, IsProviderAvailable = true, CreatedUtc = Now, UpdatedUtc = Now });
        await db.SaveChangesAsync();
        var handler = new QueueHandler(
            _ => Json(HttpStatusCode.OK, Entity("climate.room", "heat", Attr(("temperature", "20"), ("current_temperature", "20"), ("temperature_unit", "°C"), ("min_temp", "18"), ("max_temp", "24"), ("target_temp_step", "0.5")))),
            _ => Json(HttpStatusCode.OK, Entity("climate.room", "heat", Attr(("temperature", "20"), ("current_temperature", "20"), ("temperature_unit", "°C"), ("min_temp", "18"), ("max_temp", "24"), ("target_temp_step", "0.5")))),
            _ => Json(HttpStatusCode.OK, "[]"),
            _ => Json(HttpStatusCode.OK, Entity("climate.room", "heat", Attr(("temperature", "20"), ("current_temperature", "20"), ("temperature_unit", "°C"), ("min_temp", "18"), ("max_temp", "24"), ("target_temp_step", "0.5")))),
            _ => Json(HttpStatusCode.OK, "[]"));
        var adapter = Provider(db, handler);
        var service = new RoomHeatingControlService(db, new FixedClock(Now), adapter);

        var cap = await service.GetCapability(fx.Room.Id, default);
        Assert.True(cap!.IsControllable);
        Assert.Contains(RoomHeatingCommandAction.TemporaryWarmer, cap.SupportedActions);
        Assert.Contains(RoomHeatingCommandAction.TemporaryCooler, cap.SupportedActions);
        Assert.Equal(18, cap.TargetRange!.Minimum);
        Assert.Equal(22, cap.TargetRange.Maximum);

        var (response, status, _) = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "same"), null, default);
        Assert.Equal(200, status);
        Assert.Equal(RoomHeatingCommandStatus.Accepted, response!.Command.Status);
        Assert.StartsWith("ha:", (await db.RoomHeatingCommands.SingleAsync()).ProviderCommandReference);
        Assert.Single(db.RoomClimateObservations);
        var duplicate = await service.Temporary(fx.Room.Id, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "same"), null, default);
        Assert.Equal(response.Command.CommandId, duplicate.response!.Command.CommandId);
        Assert.Equal(3, handler.Requests.Count); // capability, command capability, service dispatch; replay does not dispatch.
        var post = handler.Requests.Last();
        Assert.Equal(HttpMethod.Post, post.Method);
        Assert.EndsWith("/api/services/climate/set_temperature", post.RequestUri!.ToString());
        Assert.Contains("\"entity_id\":\"climate.room\"", handler.Bodies.Last());
        Assert.Contains("\"temperature\":21", handler.Bodies.Last());
        Assert.DoesNotContain(Token, (await db.RoomHeatingCommands.SingleAsync()).ProviderCommandReference ?? string.Empty);

        var resume = await service.Resume(fx.Room.Id, new("resume"), null, default);
        Assert.Equal(RoomHeatingCommandStatus.Accepted, resume.response!.Command.Status);
        Assert.EndsWith("/api/services/script/turn_on", handler.Requests.Last().RequestUri!.ToString());
        Assert.Contains("script.resume", handler.Bodies.Last());
    }

    [Fact]
    public async Task ReconciliationConfirmsAcceptedHomeAssistantCommandOnlyFromLaterMatchingObservation()
    {
        using var env = new EnvToken(Token);
        await using var db = Db(); var fx = Seed(db, ClimateSourceRole.HeatingControl, externalId: "climate.room");
        var cmd = new RoomHeatingCommand { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceMappingId = fx.Mapping.Id, Action = RoomHeatingCommandAction.TemporaryWarmer, Status = RoomHeatingCommandStatus.Accepted, RequestedTargetTemperatureCelsius = 21, DurationMinutes = 30, EffectiveUntilUtc = Now.AddMinutes(30), RequestedUtc = Now.AddMinutes(-5), AcceptedUtc = Now.AddMinutes(-4), UpdatedUtc = Now.AddMinutes(-4), IdempotencyKey = "k", RequestFingerprint = "k", ProviderCommandReference = "ha:opaque" };
        db.RoomHeatingCommands.Add(cmd); await db.SaveChangesAsync();
        db.RoomClimateObservations.Add(new RoomClimateObservation { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceMappingId = fx.Mapping.Id, ObservedUtc = Now, ReceivedUtc = Now, TargetTemperatureCelsius = 21.05m, IsProviderAvailable = true, OperatingState = RoomClimateOperatingState.Heating, CreatedUtc = Now, UpdatedUtc = Now }); await db.SaveChangesAsync();

        await new RoomHeatingControlReconciliationService(db, new FixedClock(Now), Provider(db, new QueueHandler())).ReconcileAsync(Now, default);

        var stored = await db.RoomHeatingCommands.SingleAsync();
        Assert.Equal(RoomHeatingCommandStatus.Succeeded, stored.Status);
        Assert.Equal(21.05m, stored.ConfirmedTargetTemperatureCelsius);
    }

    [Fact]
    public async Task PortabilityAndPersistenceExcludeSecretsAndOperationalProviderPayloads()
    {
        using var env = new EnvToken(Token);
        await using var db = Db(); var fx = Seed(db, ClimateSourceRole.HeatingControl, metadata: "ha-resume:script:turn_on:script.resume");
        db.RoomClimateObservations.Add(new RoomClimateObservation { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceMappingId = fx.Mapping.Id, ObservedUtc = Now, ReceivedUtc = Now, IsProviderAvailable = true, OperatingState = RoomClimateOperatingState.Idle, CreatedUtc = Now, UpdatedUtc = Now, StatusDetail = "safe" });
        db.RoomHeatingCommands.Add(new RoomHeatingCommand { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceMappingId = fx.Mapping.Id, Action = RoomHeatingCommandAction.TemporaryWarmer, Status = RoomHeatingCommandStatus.Accepted, RequestedUtc = Now, UpdatedUtc = Now, IdempotencyKey = "k", RequestFingerprint = "k", ProviderCommandReference = "ha:opaque" });
        await db.SaveChangesAsync();
        var export = await CalendarPortabilityService.ExportAsync(db);
        var json = System.Text.Json.JsonSerializer.Serialize(export);

        Assert.Contains("http://ha.local:8123", json);
        Assert.Contains("ha-resume:script:turn_on:script.resume", json);
        Assert.DoesNotContain(Token, json);
        Assert.DoesNotContain("Authorization", json);
        Assert.DoesNotContain("ha:opaque", json);
        Assert.DoesNotContain("RoomClimateObservations", json);
        Assert.DoesNotContain("RoomHeatingCommands", json);
    }

    private static HomeAssistantClimateProvider Provider(HomeOpsDbContext db, QueueHandler handler)
    {
        var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(10) }; handler.Client = client; return new(db, new Factory(client), new FixedClock(Now));
    }

    private static HomeOpsDbContext Db() => new(new DbContextOptionsBuilder<HomeOpsDbContext>().UseInMemoryDatabase($"ha-{Guid.NewGuid()}").Options);

    private static Fixture Seed(HomeOpsDbContext db, ClimateSourceRole role, string baseUrl = "http://ha.local:8123/", string externalId = "sensor.room", string? metadata = null, string roomName = "Room")
    {
        if (!db.Households.Any(h => h.Id == SeedHousehold.Id)) db.Households.Add(new Household { Id = SeedHousehold.Id, Name = "Home", TimeZoneId = "UTC", CreatedUtc = Now, UpdatedUtc = Now });
        var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = "Floor", SortOrder = 0, CreatedUtc = Now, UpdatedUtc = Now };
        var room = new Room { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, Name = roomName, RoomType = RoomType.LivingRoom, SortOrder = 0, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now };
        var config = new RoomClimateConfiguration { RoomId = room.Id, HouseholdId = SeedHousehold.Id, IsClimateEnabled = true, MinimumPreferredTemperatureCelsius = 18, MaximumPreferredTemperatureCelsius = 22, MinimumPreferredRelativeHumidity = 35, MaximumPreferredRelativeHumidity = 65, HeatingPolicyIntent = HeatingPolicyIntent.BoundedControl, CreatedUtc = Now, UpdatedUtc = Now };
        var provider = new ClimateProvider { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, ProviderType = ProviderType.HomeAssistant, DisplayName = "HA", ExternalInstanceReference = baseUrl, DiagnosticMetadata = metadata, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now };
        var mapping = new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceRole = role, ExternalSourceId = externalId, Priority = 0, IsEnabled = true, Health = MappingHealth.Healthy, CreatedUtc = Now, UpdatedUtc = Now };
        db.AddRange(floor, room, config, provider, mapping); db.SaveChanges(); return new(floor, room, config, provider, mapping);
    }
    private static RoomClimateSourceMapping AddMapping(HomeOpsDbContext db, Fixture fx, ClimateSourceRole role, string externalId)
    { var m = new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceRole = role, ExternalSourceId = externalId, Priority = db.RoomClimateSourceMappings.Count(x => x.RoomId == fx.Room.Id && x.SourceRole == role), IsEnabled = true, Health = MappingHealth.Healthy, CreatedUtc = Now, UpdatedUtc = Now }; db.RoomClimateSourceMappings.Add(m); db.SaveChanges(); return m; }

    private static Dictionary<string, object> Attr(params (string Key, object Value)[] values) => values.ToDictionary(x => x.Key, x => x.Value);
    private static string Entity(string id, string state, Dictionary<string, object> attrs) => System.Text.Json.JsonSerializer.Serialize(new { entity_id = id, state, attributes = attrs });
    private static HttpResponseMessage Json(HttpStatusCode code, string json) => new(code) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    private sealed record Fixture(Floor Floor, Room Room, RoomClimateConfiguration Config, ClimateProvider Provider, RoomClimateSourceMapping Mapping);
    private sealed class FixedClock(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
    private sealed class Factory(HttpClient client) : IHttpClientFactory { public HttpClient CreateClient(string name) => client; }
    private sealed class EnvToken : IDisposable
    {
        private readonly string? lower = Environment.GetEnvironmentVariable("HomeAssistant__AccessToken");
        private readonly string? upper = Environment.GetEnvironmentVariable("HOMEASSISTANT__ACCESSTOKEN");
        public EnvToken(string token, bool upperOnly = false) { Environment.SetEnvironmentVariable("HomeAssistant__AccessToken", upperOnly ? null : token); Environment.SetEnvironmentVariable("HOMEASSISTANT__ACCESSTOKEN", upperOnly ? token : null); }
        public void Dispose() { Environment.SetEnvironmentVariable("HomeAssistant__AccessToken", lower); Environment.SetEnvironmentVariable("HOMEASSISTANT__ACCESSTOKEN", upper); }
    }
    private sealed class QueueHandler(params Func<HttpRequestMessage, HttpResponseMessage>[] responses) : HttpMessageHandler
    {
        private readonly Queue<Func<HttpRequestMessage, HttpResponseMessage>> queue = new(responses);
        public List<HttpRequestMessage> Requests { get; } = [];
        public List<string> Bodies { get; } = [];
        public HttpClient? Client { get; set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            if (request.Content is not null) Bodies.Add(await request.Content.ReadAsStringAsync(cancellationToken));
            cancellationToken.ThrowIfCancellationRequested();
            return queue.Count == 0 ? Json(HttpStatusCode.OK, Entity("sensor.default", "20", Attr(("unit_of_measurement", "°C")))) : queue.Dequeue()(request);
        }
    }
}
