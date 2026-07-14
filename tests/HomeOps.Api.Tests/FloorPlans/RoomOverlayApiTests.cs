using System.Net;
using System.Net.Http.Json;
using System.Text;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomOverlayApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreateReadAndRelationshipValidationAreEnforced()
    {
        var ctx = await SetupAsync("create-read");
        var draftResponse = await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/overlays", new CreateRoomOverlayRequest(ctx.RoomId, ctx.AssetId, Rect(0, 0, .4m, .4m), State: RoomOverlayState.Draft));
        Assert.Equal(HttpStatusCode.Created, draftResponse.StatusCode);
        var draft = (await draftResponse.Content.ReadFromJsonAsync<RoomOverlayDto>())!;
        Assert.Equal(RoomOverlayState.Draft, draft.State);

        var valid = await CreateOverlay(ctx, Rect(.5m, 0, .9m, .4m));
        Assert.Equal(RoomOverlayState.Valid, valid.State);
        Assert.Contains((await _client.GetFromJsonAsync<RoomOverlayDto[]>($"/api/floors/{ctx.FloorId}/overlays"))!, o => o.Id == valid.Id);
        Assert.Contains((await _client.GetFromJsonAsync<RoomOverlayDto[]>($"/api/rooms/{ctx.RoomId}/overlay"))!, o => o.Id == valid.Id);
        Assert.Equal(valid.Id, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{valid.Id}"))!.Id);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/room-overlays/{Guid.NewGuid()}" )).StatusCode);

        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/overlays", new CreateRoomOverlayRequest(Guid.Empty, ctx.AssetId, Rect(0, 0, .1m, .1m)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/overlays", new CreateRoomOverlayRequest(Guid.NewGuid(), ctx.AssetId, Rect(0, 0, .1m, .1m)))).StatusCode);

        var archivedRoom = await SetupAsync("archived-room");
        await _client.PostAsync($"/api/rooms/{archivedRoom.RoomId}/archive", null);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{archivedRoom.FloorId}/overlays", new CreateRoomOverlayRequest(archivedRoom.RoomId, archivedRoom.AssetId, Rect(0, 0, .3m, .3m)))).StatusCode);

        var other = await SetupAsync("other-floor");
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{other.FloorId}/overlays", new CreateRoomOverlayRequest(ctx.RoomId, other.AssetId, Rect(0, 0, .3m, .3m)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/overlays", new CreateRoomOverlayRequest(ctx.RoomId, other.AssetId, Rect(0, 0, .3m, .3m)))).StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var unusable = NewAsset(ctx.FloorId, FloorPlanAssetState.Validated);
        db.FloorPlanAssets.Add(unusable);
        var foreignHousehold = new Household { Id = Guid.NewGuid(), Name = "Other", TimeZoneId = "UTC", CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow };
        db.Households.Add(foreignHousehold);
        var foreignFloor = new Floor { Id = Guid.NewGuid(), HouseholdId = foreignHousehold.Id, Name = "Foreign floor", SortOrder = 0, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow };
        var foreignRoom = new Room { Id = Guid.NewGuid(), HouseholdId = foreignHousehold.Id, FloorId = foreignFloor.Id, Name = "Foreign room", SortOrder = 0, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow };
        db.Floors.Add(foreignFloor); db.Rooms.Add(foreignRoom);
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/overlays", new CreateRoomOverlayRequest(ctx.RoomId, unusable.Id, Rect(0, 0, .3m, .3m)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/overlays", new CreateRoomOverlayRequest(foreignRoom.Id, ctx.AssetId, Rect(0, 0, .3m, .3m)))).StatusCode);
    }

    [Fact]
    public async Task GeometryAndAnchorFailuresDoNotMutateStoredOverlay()
    {
        var ctx = await SetupAsync("geometry-anchor");
        var overlay = await CreateOverlay(ctx, Rect(0, 0, .5m, .5m), new(.2m, .2m));
        var updated = await PutGeometry(overlay.Id, Rect(.1m, .1m, .6m, .6m));
        Assert.Equal(.1m, updated.Polygon[0].X);

        await Trust(overlay.Id);
        var edit = await PutGeometry(overlay.Id, Rect(.2m, .2m, .7m, .7m));
        Assert.Equal(RoomOverlayState.Valid, edit.State);

        var before = (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{overlay.Id}"))!;
        foreach (var invalid in new[]
        {
            [new NormalizedPoint(0,0), new(1,1), new(0,1), new(1,0)],
            [new NormalizedPoint(-.1m,0), new(1,0), new(0,1)],
            [new NormalizedPoint(0,0), new(0,0), new(1,0), new(0,1)],
            [new NormalizedPoint(0,0), new(.5m,.5m), new(1,1)],
            Enumerable.Range(0, RoomOverlayGeometry.MaxVertices + 1).Select(i => new NormalizedPoint((decimal)i / (RoomOverlayGeometry.MaxVertices + 1), i % 2 == 0 ? .1m : .9m)).ToArray()
        })
        {
            Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/room-overlays/{overlay.Id}/geometry", new UpdateRoomOverlayGeometryRequest(invalid))).StatusCode);
            var after = (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{overlay.Id}"))!;
            Assert.Equal(before.Polygon, after.Polygon);
            Assert.Equal(before.LabelAnchor, after.LabelAnchor);
        }

        var anchor = await _client.PutAsJsonAsync($"/api/room-overlays/{overlay.Id}/label-anchor", new UpdateRoomOverlayLabelAnchorRequest(new(.3m, .3m)));
        Assert.Equal(HttpStatusCode.OK, anchor.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/room-overlays/{overlay.Id}/label-anchor", new UpdateRoomOverlayLabelAnchorRequest(new(1.2m, .3m)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PutAsJsonAsync($"/api/room-overlays/{overlay.Id}/label-anchor", new UpdateRoomOverlayLabelAnchorRequest(new(.95m, .95m)))).StatusCode);
        var afterFailedAnchor = (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{overlay.Id}"))!;
        Assert.Equal(new NormalizedPoint(.3m, .3m), afterFailedAnchor.LabelAnchor);
        Assert.Equal(HttpStatusCode.OK, (await _client.DeleteAsync($"/api/room-overlays/{overlay.Id}/label-anchor")).StatusCode);
        Assert.Null((await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{overlay.Id}"))!.LabelAnchor);
    }

    [Fact]
    public async Task TrustReviewArchiveRestoreDeleteAndOverlapRulesAreSafe()
    {
        var ctx = await SetupAsync("trust");
        var trusted = await CreateOverlay(ctx, Rect(0, 0, .4m, .4m));
        Assert.Equal(RoomOverlayState.Trusted, (await Trust(trusted.Id)).State);
        var draftCandidate = await CreateOverlay(ctx, Rect(.6m, .6m, .9m, .9m), state: RoomOverlayState.Draft);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/room-overlays/{draftCandidate.Id}/trust", null)).StatusCode);
        Assert.Equal(RoomOverlayState.Draft, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{draftCandidate.Id}"))!.State);
        await _client.DeleteAsync($"/api/room-overlays/{draftCandidate.Id}");
        var reviewCandidate = await CreateOverlay(ctx, Rect(.6m, .6m, .9m, .9m));
        await _client.PostAsync($"/api/room-overlays/{reviewCandidate.Id}/needs-review", null);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/room-overlays/{reviewCandidate.Id}/trust", null)).StatusCode);
        Assert.Equal(RoomOverlayState.NeedsReview, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{reviewCandidate.Id}"))!.State);
        await _client.DeleteAsync($"/api/room-overlays/{reviewCandidate.Id}");
        var duplicate = await CreateOverlay(ctx, Rect(.5m, 0, .9m, .4m));
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/room-overlays/{duplicate.Id}/trust", null)).StatusCode);
        Assert.Equal(RoomOverlayState.Valid, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{duplicate.Id}"))!.State);

        var otherRoom = await AddRoomAsync(ctx.FloorId, "Other trust room");
        var overlap = await CreateOverlay(ctx with { RoomId = otherRoom }, Rect(.2m, .2m, .6m, .6m));
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/room-overlays/{overlap.Id}/trust", null)).StatusCode);
        var sharedEdge = await CreateOverlay(ctx with { RoomId = otherRoom }, Rect(.4m, 0, .8m, .4m));
        Assert.Equal(RoomOverlayState.Trusted, (await Trust(sharedEdge.Id)).State);

        var needs = await _client.PostAsync($"/api/room-overlays/{trusted.Id}/needs-review", null);
        Assert.Equal(HttpStatusCode.OK, needs.StatusCode);
        Assert.Equal(RoomOverlayState.NeedsReview, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{trusted.Id}"))!.State);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/room-overlays/{trusted.Id}/trust", null)).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsync($"/api/room-overlays/{trusted.Id}/archive", null)).StatusCode);
        Assert.DoesNotContain((await _client.GetFromJsonAsync<RoomOverlayDto[]>($"/api/floors/{ctx.FloorId}/overlays"))!, o => o.Id == trusted.Id);
        var archivedTrust = await _client.PostAsync($"/api/room-overlays/{trusted.Id}/trust", null);
        Assert.Equal(HttpStatusCode.BadRequest, archivedTrust.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsync($"/api/room-overlays/{trusted.Id}/restore", null)).StatusCode);
        Assert.Equal(RoomOverlayState.Valid, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{trusted.Id}"))!.State);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/room-overlays/{trusted.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/room-overlays/{trusted.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync($"/api/rooms/{ctx.RoomId}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync($"/api/floors/{ctx.FloorId}")).StatusCode);
    }

    [Fact]
    public async Task RoomAndAssetLifecycleDowngradesTrustedOverlays()
    {
        var ctx = await SetupAsync("downgrade");
        var overlay = await CreateOverlay(ctx, Rect(0, 0, .4m, .4m));
        await Trust(overlay.Id);
        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsync($"/api/rooms/{ctx.RoomId}/archive", null)).StatusCode);
        Assert.Equal(RoomOverlayState.NeedsReview, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{overlay.Id}"))!.State);
        await _client.PostAsync($"/api/rooms/{ctx.RoomId}/restore", null);
        Assert.Equal(RoomOverlayState.NeedsReview, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{overlay.Id}"))!.State);

        var moveCtx = await SetupAsync("move");
        var moveOverlay = await CreateOverlay(moveCtx, Rect(0, 0, .4m, .4m));
        await Trust(moveOverlay.Id);
        var destinationFloor = await AddFloorAsync("destination");
        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsJsonAsync($"/api/rooms/{moveCtx.RoomId}/move", new MoveRoomRequest(destinationFloor))).StatusCode);
        Assert.Equal(RoomOverlayState.NeedsReview, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{moveOverlay.Id}"))!.State);

        var assetCtx = await SetupAsync("asset");
        var assetOverlay = await CreateOverlay(assetCtx, Rect(0, 0, .4m, .4m));
        await Trust(assetOverlay.Id);
        var replacement = await UploadAssetAsync(assetCtx.FloorId);
        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsync($"/api/floors/{assetCtx.FloorId}/floor-plan-assets/{replacement}/activate", null)).StatusCode);
        Assert.Equal(RoomOverlayState.NeedsReview, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{assetOverlay.Id}"))!.State);

        var missingCtx = await SetupAsync("missing");
        var missingOverlay = await CreateOverlay(missingCtx, Rect(0, 0, .4m, .4m));
        await Trust(missingOverlay.Id);
        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsync($"/api/floor-plan-assets/{missingCtx.AssetId}/mark-missing", null)).StatusCode);
        Assert.Equal(RoomOverlayState.NeedsReview, (await _client.GetFromJsonAsync<RoomOverlayDto>($"/api/room-overlays/{missingOverlay.Id}"))!.State);

        var deleteCtx = await SetupAsync("delete-room-cascade");
        var deleteOverlay = await CreateOverlay(deleteCtx, Rect(0, 0, .4m, .4m));
        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/rooms/{deleteCtx.RoomId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/room-overlays/{deleteOverlay.Id}")).StatusCode);
    }

    private async Task<OverlayContext> SetupAsync(string name)
    {
        var floor = await AddFloorAsync($"Overlay {name} {Guid.NewGuid():N}");
        var room = await AddRoomAsync(floor, $"Room {name} {Guid.NewGuid():N}");
        var asset = await AddAssetAsync(floor, FloorPlanAssetState.Active);
        return new(floor, room, asset);
    }

    private async Task<Guid> AddFloorAsync(string name)
    {
        var r = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest(name)); r.EnsureSuccessStatusCode(); return (await r.Content.ReadFromJsonAsync<FloorDto>())!.Id;
    }
    private async Task<Guid> AddRoomAsync(Guid floorId, string name)
    {
        var r = await _client.PostAsJsonAsync($"/api/floors/{floorId}/rooms", new CreateRoomRequest(name, RoomType.Other)); r.EnsureSuccessStatusCode(); return (await r.Content.ReadFromJsonAsync<RoomDto>())!.Id;
    }
    private async Task<Guid> AddAssetAsync(Guid floorId, FloorPlanAssetState state)
    {
        using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>(); var asset = NewAsset(floorId, state); db.FloorPlanAssets.Add(asset); await db.SaveChangesAsync(); return asset.Id;
    }
    private async Task<Guid> UploadAssetAsync(Guid floorId)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes("<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100'/></svg>")), "file", $"plan-{Guid.NewGuid():N}.svg");
        var r = await _client.PostAsync($"/api/floors/{floorId}/floor-plan-assets", form); r.EnsureSuccessStatusCode(); return (await r.Content.ReadFromJsonAsync<FloorPlanAssetUploadResult>())!.Asset.Id;
    }
    private static FloorPlanAsset NewAsset(Guid floorId, FloorPlanAssetState state) => new() { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floorId, OriginalFilename = "plan.svg", DetectedMediaType = "image/svg+xml", ContentHash = Guid.NewGuid().ToString("N"), SourceContentReference = "source", DerivativeContentReference = "derivative", CoordinateBasisWidth = 100, CoordinateBasisHeight = 100, AspectRatio = 1, State = state, SourceAvailability = FloorPlanAssetAvailability.Available, DerivativeAvailability = FloorPlanAssetAvailability.Available, UploadedUtc = DateTimeOffset.UtcNow, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow };
    private async Task<RoomOverlayDto> CreateOverlay(OverlayContext ctx, IReadOnlyList<NormalizedPoint> polygon, NormalizedPoint? anchor = null, RoomOverlayState? state = null)
    {
        var r = await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/overlays", new CreateRoomOverlayRequest(ctx.RoomId, ctx.AssetId, polygon, anchor, state)); r.EnsureSuccessStatusCode(); return (await r.Content.ReadFromJsonAsync<RoomOverlayDto>())!;
    }
    private async Task<RoomOverlayDto> PutGeometry(Guid id, IReadOnlyList<NormalizedPoint> polygon)
    {
        var r = await _client.PutAsJsonAsync($"/api/room-overlays/{id}/geometry", new UpdateRoomOverlayGeometryRequest(polygon)); r.EnsureSuccessStatusCode(); return (await r.Content.ReadFromJsonAsync<RoomOverlayDto>())!;
    }
    private async Task<RoomOverlayDto> Trust(Guid id)
    {
        var r = await _client.PostAsync($"/api/room-overlays/{id}/trust", null); r.EnsureSuccessStatusCode(); return (await r.Content.ReadFromJsonAsync<RoomOverlayDto>())!;
    }
    private static NormalizedPoint[] Rect(decimal x1, decimal y1, decimal x2, decimal y2) => [new(x1, y1), new(x2, y1), new(x2, y2), new(x1, y2)];
    private sealed record OverlayContext(Guid FloorId, Guid RoomId, Guid AssetId);
}
