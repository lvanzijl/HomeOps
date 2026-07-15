using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomClimateReadModelHardeningTests
{
    private readonly DateTimeOffset _now = new(2026, 7, 15, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task ObservationIngestionAcceptsReplacesAndPreservesCurrentForOlderOrInvalidSubmissions()
    {
        await using var db = CreateDb();
        var clock = new TestClock(_now);
        var ctx = SeedClimateRoom(db);
        var service = new RoomClimateReadModelService(db, clock);

        var first = await service.Submit(ctx.Room.Id, Request(ctx.Mapping.Id, _now.AddMinutes(-5), received: _now.AddMinutes(-4), temperature: 20.5m, humidity: null, target: null, state: RoomClimateOperatingState.Idle), default);
        Assert.True(first.ok);
        Assert.Equal(RoomClimateObservationStatus.Accepted, first.response!.Status);
        var stored = await db.RoomClimateObservations.SingleAsync();
        Assert.Equal(20.5m, stored.TemperatureCelsius);
        Assert.Null(stored.RelativeHumidity);
        Assert.Null(stored.TargetTemperatureCelsius);
        Assert.Equal(_now.AddMinutes(-5), stored.ObservedUtc);
        Assert.Equal(_now.AddMinutes(-4), stored.ReceivedUtc);

        var newer = await service.Submit(ctx.Room.Id, Request(ctx.Mapping.Id, _now.AddMinutes(-1), temperature: 21, humidity: 45, target: 20, state: RoomClimateOperatingState.Heating, source: "safe-source", detail: "normalized"), default);
        Assert.True(newer.ok);
        stored = await db.RoomClimateObservations.SingleAsync();
        Assert.Equal(21, stored.TemperatureCelsius);
        Assert.Equal(45, stored.RelativeHumidity);
        Assert.Equal(20, stored.TargetTemperatureCelsius);
        Assert.Equal(RoomClimateOperatingState.Heating, stored.OperatingState);
        Assert.Equal("safe-source", stored.SourceReference);
        Assert.Equal("normalized", stored.StatusDetail);

        var equal = await service.Submit(ctx.Room.Id, Request(ctx.Mapping.Id, _now.AddMinutes(-1), temperature: 22, humidity: 50, target: 21, state: RoomClimateOperatingState.Cooling), default);
        Assert.True(equal.ok);
        stored = await db.RoomClimateObservations.SingleAsync();
        Assert.Equal(22, stored.TemperatureCelsius);
        Assert.Equal(RoomClimateOperatingState.Cooling, stored.OperatingState);

        var snapshot = Snapshot(stored);
        var older = await service.Submit(ctx.Room.Id, Request(ctx.Mapping.Id, _now.AddMinutes(-2), temperature: 10, humidity: 10, target: 20, state: RoomClimateOperatingState.Unavailable), default);
        Assert.True(older.ok);
        Assert.Equal(RoomClimateObservationStatus.IgnoredOlderObservation, older.response!.Status);
        Assert.Equal(snapshot, Snapshot(await db.RoomClimateObservations.SingleAsync()));

        foreach (var invalid in new[]
        {
            Request(ctx.Mapping.Id, _now, temperature: -51),
            Request(ctx.Mapping.Id, _now, temperature: 81),
            Request(ctx.Mapping.Id, _now, humidity: -1),
            Request(ctx.Mapping.Id, _now, humidity: 101),
            Request(ctx.Mapping.Id, _now, target: 4),
            Request(ctx.Mapping.Id, _now, target: 36),
            Request(ctx.Mapping.Id, _now.AddMinutes(6)),
            Request(ctx.Mapping.Id, _now, state: (RoomClimateOperatingState)999),
            Request(Guid.NewGuid(), _now),
        })
        {
            var rejected = await service.Submit(ctx.Room.Id, invalid, default);
            Assert.False(rejected.ok);
            Assert.Equal(snapshot, Snapshot(await db.RoomClimateObservations.SingleAsync()));
        }

        var unavailable = await service.Submit(ctx.Room.Id, Request(ctx.Mapping.Id, _now.AddMinutes(1), state: RoomClimateOperatingState.Idle, available: false), default);
        Assert.True(unavailable.ok);
        Assert.Equal(RoomClimateOperatingState.Unavailable, (await db.RoomClimateObservations.SingleAsync()).OperatingState);
    }

    [Fact]
    public async Task IngestionRejectsInactiveConfigurationMappingAndCrossHouseholdWithoutMutation()
    {
        await using var db = CreateDb();
        var service = new RoomClimateReadModelService(db, new TestClock(_now));
        var ctx = SeedClimateRoom(db);
        await service.Submit(ctx.Room.Id, Request(ctx.Mapping.Id, _now.AddMinutes(-1), temperature: 20), default);
        var snapshot = Snapshot(await db.RoomClimateObservations.SingleAsync());

        async Task AssertRejected(Func<Task> mutate, Guid roomId, Guid mappingId)
        {
            await mutate();
            var rejected = await service.Submit(roomId, Request(mappingId, _now, temperature: 21), default);
            Assert.False(rejected.ok);
            Assert.Equal(snapshot, Snapshot(await db.RoomClimateObservations.SingleAsync()));
        }

        await AssertRejected(() => { ctx.Room.IsEnabled = false; return db.SaveChangesAsync(); }, ctx.Room.Id, ctx.Mapping.Id);
        ctx.Room.IsEnabled = true; await db.SaveChangesAsync();
        await AssertRejected(() => { ctx.Room.IsArchived = true; return db.SaveChangesAsync(); }, ctx.Room.Id, ctx.Mapping.Id);
        ctx.Room.IsArchived = false; await db.SaveChangesAsync();
        await AssertRejected(() => { ctx.Configuration.IsClimateEnabled = false; return db.SaveChangesAsync(); }, ctx.Room.Id, ctx.Mapping.Id);
        ctx.Configuration.IsClimateEnabled = true; await db.SaveChangesAsync();
        await AssertRejected(() => { ctx.Mapping.IsEnabled = false; return db.SaveChangesAsync(); }, ctx.Room.Id, ctx.Mapping.Id);
        ctx.Mapping.IsEnabled = true; await db.SaveChangesAsync();
        await AssertRejected(() => { ctx.Mapping.Health = MappingHealth.Missing; return db.SaveChangesAsync(); }, ctx.Room.Id, ctx.Mapping.Id);
        ctx.Mapping.Health = MappingHealth.Healthy; await db.SaveChangesAsync();

        var other = SeedClimateRoom(db, householdId: Guid.Parse("22222222-2222-2222-2222-222222222222"));
        var crossMapping = await service.Submit(ctx.Room.Id, Request(other.Mapping.Id, _now, temperature: 21), default);
        Assert.False(crossMapping.ok);
        var crossRoom = await service.Submit(other.Room.Id, Request(ctx.Mapping.Id, _now, temperature: 21), default);
        Assert.False(crossRoom.ok);
        Assert.Equal(snapshot, Snapshot(await db.RoomClimateObservations.SingleAsync()));
    }

    [Fact]
    public void FreshnessPolicyIsDeterministicAtBoundaries()
    {
        RoomClimateObservation Observation(TimeSpan age, DateTimeOffset? received = null, bool available = true, RoomClimateOperatingState state = RoomClimateOperatingState.Idle)
            => new() { ObservedUtc = _now - age, ReceivedUtc = received ?? _now - age, IsProviderAvailable = available, OperatingState = state };

        Assert.Equal(RoomClimateFreshness.Unavailable, RoomClimateReadModelService.ClassifyFreshness(null, _now));
        Assert.Equal(RoomClimateFreshness.Unavailable, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromMinutes(1), available: false), _now));
        Assert.Equal(RoomClimateFreshness.Unavailable, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromMinutes(1), state: RoomClimateOperatingState.Unavailable), _now));
        Assert.Equal(RoomClimateFreshness.Fresh, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromMinutes(19).Add(TimeSpan.FromSeconds(59))), _now));
        Assert.Equal(RoomClimateFreshness.Fresh, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromMinutes(20)), _now));
        Assert.Equal(RoomClimateFreshness.Aging, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromMinutes(20).Add(TimeSpan.FromSeconds(1))), _now));
        Assert.Equal(RoomClimateFreshness.Aging, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromHours(2)), _now));
        Assert.Equal(RoomClimateFreshness.Stale, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromHours(2).Add(TimeSpan.FromSeconds(1))), _now));
        Assert.Equal(RoomClimateFreshness.Fresh, RoomClimateReadModelService.ClassifyFreshness(Observation(TimeSpan.FromMinutes(30), received: _now.AddMinutes(4)), _now));
    }

    [Fact]
    public async Task RoomFloorAndHouseholdReadModelsHandleMixedDataAndSpatialStates()
    {
        await using var db = CreateDb();
        var clock = new TestClock(_now);
        var service = new RoomClimateReadModelService(db, clock);
        var fresh = SeedClimateRoom(db, roomName: "A fresh", sortOrder: 0);
        var aging = SeedClimateRoom(db, floor: fresh.Floor, roomName: "B aging", sortOrder: 1);
        var stale = SeedClimateRoom(db, floor: fresh.Floor, roomName: "C stale", sortOrder: 2);
        var unavailable = SeedClimateRoom(db, floor: fresh.Floor, roomName: "D unavailable", sortOrder: 3);
        var noConfig = SeedRoomOnly(db, fresh.Floor, "E no config", 4);
        noConfig.IsArchived = true;
        var asset = AddAsset(db, fresh.Floor, FloorPlanAssetState.Active);
        AddOverlay(db, fresh.Floor, fresh.Room, asset, RoomOverlayState.Trusted, "[[0,0]]");
        AddOverlay(db, fresh.Floor, aging.Room, asset, RoomOverlayState.NeedsReview, "[[1,1]]");
        var replaced = AddAsset(db, fresh.Floor, FloorPlanAssetState.Replaced);
        AddOverlay(db, fresh.Floor, stale.Room, replaced, RoomOverlayState.Trusted, "[[2,2]]");
        AddReview(db, fresh.Floor, unavailable.Room, asset, RoomReplacementDisposition.IntentionallyNotDrawn);
        await db.SaveChangesAsync();

        await service.Submit(fresh.Room.Id, Request(fresh.Mapping.Id, _now.AddMinutes(-5), temperature: 20, humidity: null, target: null, state: RoomClimateOperatingState.Heating, source: "diagnostic-safe", detail: "no raw payload"), default);
        await service.Submit(aging.Room.Id, Request(aging.Mapping.Id, _now.AddMinutes(-21), received: _now.AddMinutes(-21), temperature: null, humidity: 40, target: 20, state: RoomClimateOperatingState.Cooling), default);
        await service.Submit(stale.Room.Id, Request(stale.Mapping.Id, _now.AddHours(-3), received: _now.AddHours(-3), temperature: 18, humidity: 45, target: null, state: RoomClimateOperatingState.Unknown), default);
        await service.Submit(unavailable.Room.Id, Request(unavailable.Mapping.Id, _now.AddMinutes(-1), state: RoomClimateOperatingState.Idle, available: false), default);

        var room = await service.GetRoom(fresh.Room.Id, default);
        Assert.NotNull(room);
        Assert.Equal(fresh.Room.Id, room!.RoomId);
        Assert.Equal(fresh.Floor.Id, room.FloorId);
        Assert.Equal(RoomType.LivingRoom, room.RoomType);
        Assert.True(room.Configuration.IsConfigured);
        Assert.Equal(20, room.CurrentObservation!.TemperatureCelsius);
        Assert.Null(room.CurrentObservation.RelativeHumidity);
        Assert.Null(room.CurrentObservation.TargetTemperatureCelsius);
        Assert.Equal(RoomClimateOperatingState.Heating, room.OperatingState);
        Assert.Equal(RoomClimateFreshness.Fresh, room.Freshness);
        Assert.True(room.IsProviderAvailable);
        Assert.Equal(RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable, room.SpatialDisplayStatus);
        Assert.NotNull(room.TrustedOverlayId);
        Assert.Equal("diagnostic-safe", room.CurrentObservation.SourceReference);
        Assert.DoesNotContain("Polygon", room.GetType().GetProperties().Select(p => p.Name));

        var floor = await service.GetFloor(fresh.Floor.Id, default);
        Assert.NotNull(floor);
        Assert.Equal(new[] { fresh.Room.Id, aging.Room.Id, stale.Room.Id, unavailable.Room.Id }, floor!.Rooms.Select(r => r.RoomId));
        Assert.Equal(1, floor.Counts.FreshRooms);
        Assert.Equal(1, floor.Counts.AgingRooms);
        Assert.Equal(1, floor.Counts.StaleRooms);
        Assert.Equal(1, floor.Counts.UnavailableRooms);
        Assert.Equal(1, floor.Counts.TrustedOverlayRooms);
        Assert.Equal(3, floor.Counts.FallbackRooms);
        Assert.Equal(asset.Id, floor.ActiveAsset!.Id);
        Assert.Equal(_now.AddMinutes(-1), floor.ObservedSummaryUtc);
        Assert.Equal(RoomClimateFreshness.Fresh, floor.OverallAvailability);
        Assert.Equal(RoomClimateSpatialDisplayStatus.OverlayNeedsReview, floor.Rooms.Single(r => r.RoomId == aging.Room.Id).SpatialDisplayStatus);
        Assert.Equal(RoomClimateSpatialDisplayStatus.RoomListFallback, floor.Rooms.Single(r => r.RoomId == stale.Room.Id).SpatialDisplayStatus);
        Assert.Equal(RoomClimateSpatialDisplayStatus.IntentionallyNotDrawn, floor.Rooms.Single(r => r.RoomId == unavailable.Room.Id).SpatialDisplayStatus);
        Assert.DoesNotContain(floor.Rooms, r => r.RoomId == noConfig.Id);

        var household = await service.GetHousehold(SeedHousehold.Id, default);
        Assert.Equal(fresh.Floor.Id, Assert.Single(household.Floors).FloorId);
        Assert.Equal(floor.Counts, household.Floors.Single().Counts);

        var floorWithoutAsset = SeedFloor(db, "No asset", 99);
        var fallback = SeedClimateRoom(db, floor: floorWithoutAsset, roomName: "No plan room");
        await service.Submit(fallback.Room.Id, Request(fallback.Mapping.Id, _now, temperature: 20), default);
        var noAsset = await service.GetFloor(floorWithoutAsset.Id, default);
        Assert.Equal(RoomClimateSpatialDisplayStatus.NoActiveFloorPlan, Assert.Single(noAsset!.Rooms).SpatialDisplayStatus);
    }

    [Fact]
    public async Task PersistenceModelContractsAndPortabilityRemainHardened()
    {
        await using var db = CreateDb();
        var entity = db.Model.FindEntityType(typeof(RoomClimateObservation));
        Assert.NotNull(entity);
        Assert.Equal("RoomClimateObservations", entity!.GetTableName());
        Assert.NotNull(entity.FindPrimaryKey());
        Assert.Contains(entity.GetIndexes(), i => i.IsUnique && i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomClimateObservation.RoomId), nameof(RoomClimateObservation.SourceMappingId)]));
        Assert.Contains(entity.GetIndexes(), i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomClimateObservation.HouseholdId), nameof(RoomClimateObservation.RoomId)]));
        Assert.Contains(entity.GetIndexes(), i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomClimateObservation.HouseholdId), nameof(RoomClimateObservation.ReceivedUtc)]));
        Assert.All(entity.GetForeignKeys(), fk => Assert.Equal(DeleteBehavior.Restrict, fk.DeleteBehavior));
        Assert.Equal(typeof(string), entity.FindProperty(nameof(RoomClimateObservation.OperatingState))!.GetProviderClrType());
        Assert.True(entity.FindProperty(nameof(RoomClimateObservation.RelativeHumidity))!.IsNullable);
        Assert.True(entity.FindProperty(nameof(RoomClimateObservation.TargetTemperatureCelsius))!.IsNullable);

        var ctx = SeedClimateRoom(db);
        var service = new RoomClimateReadModelService(db, new TestClock(_now));
        await service.Submit(ctx.Room.Id, Request(ctx.Mapping.Id, _now, temperature: 20), default);
        var export = await CalendarPortabilityService.ExportAsync(db);
        var serialized = System.Text.Json.JsonSerializer.Serialize(export);
        Assert.DoesNotContain("RoomClimateObservations", serialized);
        Assert.Contains("RoomClimateConfigurations", serialized);
        Assert.Contains("ClimateProviders", serialized);
    }

    [Fact]
    public async Task OpenApiAndGeneratedClientExposeTypedClimateContracts()
    {
        var openApi = JsonNode.Parse(await File.ReadAllTextAsync(FindRepositoryFile("src/HomeOps.Contracts/openapi.json")))!;
        AssertJsonReference(openApi, "/api/rooms/{roomId}/climate-state", "get", "200", "#/components/schemas/RoomClimateStateDto");
        AssertJsonReference(openApi, "/api/rooms/{roomId}/climate-observations/current", "put", "200", "#/components/schemas/SubmitRoomClimateObservationResponse");
        AssertRequestReference(openApi, "/api/rooms/{roomId}/climate-observations/current", "put", "#/components/schemas/SubmitRoomClimateObservationRequest");
        AssertJsonReference(openApi, "/api/floors/{floorId}/climate-state", "get", "200", "#/components/schemas/FloorClimateStateDto");
        AssertJsonReference(openApi, "/api/households/{householdId}/climate-summary", "get", "200", "#/components/schemas/HouseholdClimateSummaryDto");
        AssertEnumNames(openApi, "RoomClimateFreshness", ["Fresh", "Aging", "Stale", "Unavailable"]);
        AssertEnumNames(openApi, "RoomClimateOperatingState", ["Unknown", "Idle", "Heating", "Cooling", "Unavailable"]);
        var roomSchema = openApi["components"]!["schemas"]!["FloorClimateStateDto"]!;
        Assert.Equal("array", roomSchema["properties"]!["rooms"]!["type"]!.GetValue<string>());
        Assert.Equal("#/components/schemas/RoomClimateStateDto", roomSchema["properties"]!["rooms"]!["items"]!["$ref"]!.GetValue<string>());
        var client = await File.ReadAllTextAsync(FindRepositoryFile("src/HomeOps.Client/src/api/homeOpsApiClient.ts"));
        Assert.Contains("getRoomClimateState(roomId: string): Promise<RoomClimateStateDto>", client);
        Assert.Contains("getFloorClimateState(floorId: string): Promise<FloorClimateStateDto>", client);
        Assert.Contains("getHouseholdClimateSummary(householdId: string): Promise<HouseholdClimateSummaryDto>", client);
        Assert.Contains("submitRoomClimateObservation(roomId: string, request: SubmitRoomClimateObservationRequest): Promise<SubmitRoomClimateObservationResponse>", client);
        Assert.Contains("export enum RoomClimateFreshness", client);
        Assert.Contains("export enum RoomClimateOperatingState", client);
    }

    [Fact]
    public async Task ReadEndpointsRejectCrossHouseholdRoomsAndFloors()
    {
        await using var db = CreateDb();
        var service = new RoomClimateReadModelService(db, new TestClock(_now));
        var other = SeedClimateRoom(db, householdId: Guid.Parse("33333333-3333-3333-3333-333333333333"));
        Assert.Null(await service.GetRoom(other.Room.Id, default));
        Assert.Null(await service.GetFloor(other.Floor.Id, default));
    }

    private static HomeOpsDbContext CreateDb()
    {
        var db = new HomeOpsDbContext(new DbContextOptionsBuilder<HomeOpsDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        db.Households.Add(new Household { Id = SeedHousehold.Id, Name = SeedHousehold.Name, TimeZoneId = SeedHousehold.TimeZoneId, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow });
        return db;
    }

    private ClimateContext SeedClimateRoom(HomeOpsDbContext db, Guid? householdId = null, Floor? floor = null, string roomName = "Room", int sortOrder = 0)
    {
        var household = householdId ?? SeedHousehold.Id;
        if (household != SeedHousehold.Id && !db.Households.Any(h => h.Id == household)) db.Households.Add(new Household { Id = household, Name = "Other", TimeZoneId = "UTC", CreatedUtc = _now, UpdatedUtc = _now });
        floor ??= SeedFloor(db, $"Floor {Guid.NewGuid():N}", sortOrder, household);
        var room = SeedRoomOnly(db, floor, roomName, sortOrder, household);
        var config = new RoomClimateConfiguration { RoomId = room.Id, HouseholdId = household, Room = room, IsClimateEnabled = true, MinimumPreferredTemperatureCelsius = 18, MaximumPreferredTemperatureCelsius = 23, MinimumPreferredRelativeHumidity = 35, MaximumPreferredRelativeHumidity = 65, HeatingPolicyIntent = HeatingPolicyIntent.ReadOnlyStatus, CreatedUtc = _now, UpdatedUtc = _now };
        var provider = new ClimateProvider { Id = Guid.NewGuid(), HouseholdId = household, DisplayName = $"Provider {Guid.NewGuid():N}", ProviderType = ProviderType.HomeAssistant, IsEnabled = true, CreatedUtc = _now, UpdatedUtc = _now };
        var mapping = new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = household, RoomId = room.Id, Room = room, ProviderId = provider.Id, Provider = provider, SourceRole = ClimateSourceRole.ComfortTemperature, ExternalSourceId = $"sensor.{Guid.NewGuid():N}", Priority = 0, IsEnabled = true, Health = MappingHealth.Healthy, CreatedUtc = _now, UpdatedUtc = _now };
        db.RoomClimateConfigurations.Add(config); db.ClimateProviders.Add(provider); db.RoomClimateSourceMappings.Add(mapping); db.SaveChanges();
        return new(floor, room, config, provider, mapping);
    }

    private Floor SeedFloor(HomeOpsDbContext db, string name, int sortOrder, Guid? householdId = null)
    {
        var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = householdId ?? SeedHousehold.Id, Name = name, SortOrder = sortOrder, IsEnabled = true, CreatedUtc = _now, UpdatedUtc = _now };
        db.Floors.Add(floor); db.SaveChanges(); return floor;
    }

    private Room SeedRoomOnly(HomeOpsDbContext db, Floor floor, string name, int sortOrder, Guid? householdId = null)
    {
        var room = new Room { Id = Guid.NewGuid(), HouseholdId = householdId ?? floor.HouseholdId, FloorId = floor.Id, Floor = floor, Name = name, RoomType = RoomType.LivingRoom, SortOrder = sortOrder, IsEnabled = true, CreatedUtc = _now, UpdatedUtc = _now };
        db.Rooms.Add(room); db.SaveChanges(); return room;
    }

    private FloorPlanAsset AddAsset(HomeOpsDbContext db, Floor floor, FloorPlanAssetState state)
    {
        var asset = new FloorPlanAsset { Id = Guid.NewGuid(), HouseholdId = floor.HouseholdId, FloorId = floor.Id, OriginalFilename = "plan.svg", DetectedMediaType = "image/svg+xml", ContentHash = Guid.NewGuid().ToString("N"), SourceContentReference = "source", DerivativeContentReference = "derivative", CoordinateBasisWidth = 100, CoordinateBasisHeight = 100, AspectRatio = 1, State = state, UploadedUtc = _now, CreatedUtc = _now, UpdatedUtc = _now };
        db.FloorPlanAssets.Add(asset); return asset;
    }

    private RoomOverlay AddOverlay(HomeOpsDbContext db, Floor floor, Room room, FloorPlanAsset asset, RoomOverlayState state, string polygon)
    {
        var overlay = new RoomOverlay { Id = Guid.NewGuid(), HouseholdId = floor.HouseholdId, FloorId = floor.Id, RoomId = room.Id, FloorPlanAssetId = asset.Id, State = state, PolygonJson = polygon, CreatedUtc = _now, UpdatedUtc = _now };
        db.RoomOverlays.Add(overlay); return overlay;
    }

    private void AddReview(HomeOpsDbContext db, Floor floor, Room room, FloorPlanAsset asset, RoomReplacementDisposition disposition)
    {
        var replacement = AddAsset(db, floor, FloorPlanAssetState.Validated);
        var review = new FloorPlanReplacementReview { Id = Guid.NewGuid(), HouseholdId = floor.HouseholdId, FloorId = floor.Id, CurrentAssetId = asset.Id, ReplacementAssetId = replacement.Id, Status = FloorPlanReplacementReviewStatus.InReview, CreatedUtc = _now, UpdatedUtc = _now };
        db.FloorPlanReplacementReviews.Add(review);
        db.FloorPlanReplacementReviewItems.Add(new FloorPlanReplacementReviewItem { Id = Guid.NewGuid(), HouseholdId = floor.HouseholdId, FloorId = floor.Id, RoomId = room.Id, ReviewId = review.Id, Review = review, Disposition = disposition, CreatedUtc = _now, UpdatedUtc = _now });
    }

    private static SubmitRoomClimateObservationRequest Request(Guid mappingId, DateTimeOffset observed, DateTimeOffset? received = null, decimal? temperature = null, decimal? humidity = null, decimal? target = null, RoomClimateOperatingState state = RoomClimateOperatingState.Idle, bool available = true, string? source = null, string? detail = null)
        => new(mappingId, observed, received, temperature, humidity, target, state, available, source, detail);

    private static ObservationSnapshot Snapshot(RoomClimateObservation o) => new(o.ObservedUtc, o.ReceivedUtc, o.TemperatureCelsius, o.RelativeHumidity, o.TargetTemperatureCelsius, o.OperatingState, o.IsProviderAvailable, o.SourceReference, o.StatusDetail);
    private sealed record ObservationSnapshot(DateTimeOffset ObservedUtc, DateTimeOffset ReceivedUtc, decimal? Temperature, decimal? Humidity, decimal? Target, RoomClimateOperatingState State, bool Available, string? Source, string? Detail);
    private sealed record ClimateContext(Floor Floor, Room Room, RoomClimateConfiguration Configuration, ClimateProvider Provider, RoomClimateSourceMapping Mapping);

    private sealed class TestClock(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }

    private static string FindRepositoryFile(string relativePath)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, relativePath);
            if (File.Exists(candidate)) return candidate;
            directory = directory.Parent;
        }
        throw new FileNotFoundException(relativePath);
    }

    private static void AssertJsonReference(JsonNode openApi, string path, string method, string status, string reference)
    {
        Assert.Equal(reference, openApi["paths"]![path]![method]!["responses"]![status]!["content"]!["application/json"]!["schema"]!["$ref"]!.GetValue<string>());
    }

    private static void AssertRequestReference(JsonNode openApi, string path, string method, string reference)
    {
        Assert.Equal(reference, openApi["paths"]![path]![method]!["requestBody"]!["content"]!["application/json"]!["schema"]!["$ref"]!.GetValue<string>());
    }

    private static void AssertEnumNames(JsonNode openApi, string schemaName, string[] expected)
    {
        Assert.Equal(expected, openApi["components"]!["schemas"]![schemaName]!["x-enumNames"]!.AsArray().Select(v => v!.GetValue<string>()).ToArray());
    }
}
