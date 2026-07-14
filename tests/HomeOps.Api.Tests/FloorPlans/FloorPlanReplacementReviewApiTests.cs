using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Nodes;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Lists;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class FloorPlanReplacementReviewApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task StartReviewCreatesItemsKeepsRuntimeSetupAndRejectsDuplicateAndInvalidStarts()
    {
        var ctx = await SeedReviewContext();

        var review = await StartReview(ctx.FloorId, ctx.ReplacementAssetId);

        Assert.Equal(FloorPlanReplacementReviewStatus.InReview, review.Status);
        Assert.Equal(ctx.ActiveAssetId, review.CurrentAssetId);
        Assert.Equal(ctx.ReplacementAssetId, review.ReplacementAssetId);
        Assert.All(review.Items, item => Assert.Equal(RoomReplacementDisposition.PendingReview, item.Disposition));
        Assert.Equal(new[] { ctx.RoomAId, ctx.RoomBId }.Order().ToArray(), review.Items.Select(i => i.RoomId).Order().ToArray());
        await using var db = Db();
        Assert.Equal(FloorPlanAssetState.Active, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ActiveAssetId)).State);
        Assert.Equal(FloorPlanAssetState.Validated, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ReplacementAssetId)).State);
        Assert.Equal(RoomOverlayState.Trusted, (await db.RoomOverlays.SingleAsync(o => o.Id == ctx.TrustedOverlayId)).State);

        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews", new StartFloorPlanReplacementReviewRequest(ctx.ReplacementAssetId))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.PostAsJsonAsync($"/api/floors/{Guid.NewGuid()}/floor-plan-replacement-reviews", new StartFloorPlanReplacementReviewRequest(ctx.ReplacementAssetId))).StatusCode);

        var inactive = await CreateFloor("Inactive replacement review floor");
        await using (var mutate = Db())
        {
            var floor = await mutate.Floors.SingleAsync(f => f.Id == inactive.Id);
            floor.IsEnabled = false;
            await mutate.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{inactive.Id}/floor-plan-replacement-reviews", new StartFloorPlanReplacementReviewRequest(ctx.ReplacementAssetId))).StatusCode);
    }

    [Fact]
    public async Task ReadListAndCancelAreTypedDeterministicAndPreserveRuntimeSetup()
    {
        var ctx = await SeedReviewContext();
        var review = await StartReview(ctx.FloorId, ctx.ReplacementAssetId);
        var replacementOverlay = await SeedOverlay(ctx.FloorId, ctx.RoomAId, ctx.ReplacementAssetId, Rect(.5m, .5m, .8m, .8m), RoomOverlayState.Valid);
        await AttachOverlay(ctx.FloorId, review.Id, ctx.RoomAId, replacementOverlay.Id);

        var fetched = await _client.GetFromJsonAsync<FloorPlanReplacementReviewDto>($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}");
        Assert.NotNull(fetched);
        Assert.Equal(SeedHousehold.Id, fetched!.HouseholdId);
        Assert.True(fetched.Compatibility.ReuseCandidatesAvailable);
        Assert.Equal(new[] { ctx.RoomAId, ctx.RoomBId }.Order().ToArray(), fetched!.Items.Select(i => i.RoomId).Order().ToArray());
        Assert.Contains(fetched.Items, item => item.RoomName == "Room A" && item.RoomType == RoomType.Other && item.ReuseCandidateAvailable);
        var list = await _client.GetFromJsonAsync<FloorPlanReplacementReviewDto[]>($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews");
        Assert.Contains(list!, item => item.Id == review.Id);
        var active = await _client.GetFromJsonAsync<FloorPlanReplacementReviewDto>($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/active");
        Assert.Equal(review.Id, active!.Id);
        var items = await _client.GetFromJsonAsync<FloorPlanReplacementReviewItemDto[]>($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/rooms");
        Assert.Equal(new[] { ctx.RoomAId, ctx.RoomBId }.Order().ToArray(), items!.Select(i => i.RoomId).Order().ToArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{Guid.NewGuid()}")).StatusCode);

        var cancelled = await PostReview($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/cancel");
        Assert.Equal(FloorPlanReplacementReviewStatus.Cancelled, cancelled.Status);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/cancel", null)).StatusCode);
        await using var db = Db();
        Assert.Equal(FloorPlanAssetState.Active, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ActiveAssetId)).State);
        Assert.Equal(FloorPlanAssetState.Validated, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ReplacementAssetId)).State);
        Assert.Equal(RoomOverlayState.Trusted, (await db.RoomOverlays.SingleAsync(o => o.Id == ctx.TrustedOverlayId)).State);
        Assert.Equal(RoomOverlayState.Valid, (await db.RoomOverlays.SingleAsync(o => o.Id == replacementOverlay.Id)).State);
    }

    [Fact]
    public async Task RoomDispositionTransitionsReadinessAndResetAreExplicit()
    {
        var ctx = await SeedReviewContext();
        var review = await StartReview(ctx.FloorId, ctx.ReplacementAssetId);
        foreach (var disposition in new[] { RoomReplacementDisposition.RedrawRequired, RoomReplacementDisposition.NotConfiguredYet, RoomReplacementDisposition.IntentionallyNotDrawn, RoomReplacementDisposition.BlockedFallback })
        {
            var updated = await PutDisposition(ctx.FloorId, review.Id, ctx.RoomBId, disposition);
            Assert.Equal(disposition, updated.Items.Single(i => i.RoomId == ctx.RoomBId).Disposition);
        }
        var pending = await PostReview($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/rooms/{ctx.RoomBId}/reset");
        Assert.Equal(RoomReplacementDisposition.PendingReview, pending.Items.Single(i => i.RoomId == ctx.RoomBId).Disposition);

        var ready = await Readiness(ctx.FloorId, review.Id);
        Assert.False(ready.IsReady);
        Assert.Contains(ready.Blockers, b => b.Code == "PendingRoom");

        await using (var db = Db())
        {
            db.FloorPlanReplacementReviewItems.Remove(await db.FloorPlanReplacementReviewItems.SingleAsync(i => i.ReviewId == review.Id && i.RoomId == ctx.RoomBId));
            await db.SaveChangesAsync();
        }
        var missing = await Readiness(ctx.FloorId, review.Id);
        Assert.Contains(missing.Blockers, b => b.Code == "MissingRoomItem");
    }

    [Fact]
    public async Task OverlayApprovalCopiesCandidatesHandlesAnchorsRejectsInvalidAndOverlap()
    {
        var ctx = await SeedReviewContext(labelAnchor: true);
        var review = await StartReview(ctx.FloorId, ctx.ReplacementAssetId);
        var approved = await ApproveReuse(ctx.FloorId, review.Id, ctx.RoomAId, preserveAnchor: true);
        var item = approved.Items.Single(i => i.RoomId == ctx.RoomAId);
        Assert.Equal(RoomReplacementDisposition.ApprovedReuse, item.Disposition);
        await using (var db = Db())
        {
            var copied = await db.RoomOverlays.SingleAsync(o => o.Id == item.ReplacementOverlayId);
            Assert.Equal(RoomOverlayState.Valid, copied.State);
            Assert.Equal(.2m, copied.LabelAnchorX);
        }

        var ctx2 = await SeedReviewContext("anchor-clear", labelAnchor: true);
        var review2 = await StartReview(ctx2.FloorId, ctx2.ReplacementAssetId);
        var cleared = await ApproveReuse(ctx2.FloorId, review2.Id, ctx2.RoomAId, preserveAnchor: false);
        await using (var db = Db())
        {
            var copiedId = cleared.Items.Single(i => i.RoomId == ctx2.RoomAId).ReplacementOverlayId;
            var copied = await db.RoomOverlays.SingleAsync(o => o.Id == copiedId);
            Assert.Null(copied.LabelAnchorX);
        }

        var badOverlay = await SeedOverlay(ctx.FloorId, ctx.RoomBId, ctx.ReplacementAssetId, [new(-.1m, 0), new(.5m, 0)], RoomOverlayState.Valid);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/rooms/{ctx.RoomBId}/replacement-overlay", new AttachReplacementOverlayRequest(badOverlay.Id))).StatusCode);
        var overlap = await SeedOverlay(ctx.FloorId, ctx.RoomBId, ctx.ReplacementAssetId, Rect(.2m, .2m, .5m, .5m), RoomOverlayState.Valid);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/rooms/{ctx.RoomBId}/replacement-overlay", new AttachReplacementOverlayRequest(overlap.Id))).StatusCode);
        var draft = await SeedOverlay(ctx.FloorId, ctx.RoomBId, ctx.ReplacementAssetId, Rect(.6m, .6m, .9m, .9m), RoomOverlayState.Draft);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/rooms/{ctx.RoomBId}/replacement-overlay", new AttachReplacementOverlayRequest(draft.Id))).StatusCode);
    }

    [Fact]
    public async Task ActivationIsAtomicAndRollbackRestoresTrustedSetup()
    {
        var ctx = await SeedReviewContext();
        var review = await StartReview(ctx.FloorId, ctx.ReplacementAssetId);
        var replacementOverlay = await SeedOverlay(ctx.FloorId, ctx.RoomAId, ctx.ReplacementAssetId, Rect(.5m, .5m, .8m, .8m), RoomOverlayState.Valid);
        await AttachOverlay(ctx.FloorId, review.Id, ctx.RoomAId, replacementOverlay.Id);
        await PutDisposition(ctx.FloorId, review.Id, ctx.RoomBId, RoomReplacementDisposition.NotConfiguredYet);
        var ready = await Readiness(ctx.FloorId, review.Id);
        Assert.True(ready.IsReady, string.Join(';', ready.Blockers.Select(b => b.Code)));

        var activated = await PostReview($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/activate");
        Assert.Equal(FloorPlanReplacementReviewStatus.Activated, activated.Status);
        Assert.NotNull(activated.ActivatedUtc);
        Assert.True(activated.RollbackAvailable);
        var availability = await _client.GetFromJsonAsync<FloorPlanReplacementRollbackAvailabilityDto>($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/rollback");
        Assert.True(availability!.IsAvailable, string.Join(';', availability.Blockers.Select(b => b.Code)));
        Assert.Equal(ctx.ReplacementAssetId, availability.CurrentAssetId);
        Assert.Equal(ctx.ActiveAssetId, availability.PreviousAssetId);
        await using (var db = Db())
        {
            Assert.Equal(1, await db.FloorPlanAssets.CountAsync(a => a.FloorId == ctx.FloorId && a.State == FloorPlanAssetState.Active));
            Assert.Equal(FloorPlanAssetState.Replaced, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ActiveAssetId)).State);
            Assert.Equal(FloorPlanAssetState.Active, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ReplacementAssetId)).State);
            Assert.Equal(RoomOverlayState.Trusted, (await db.RoomOverlays.SingleAsync(o => o.Id == ctx.TrustedOverlayId)).State);
            Assert.Equal(RoomOverlayState.Trusted, (await db.RoomOverlays.SingleAsync(o => o.Id == replacementOverlay.Id)).State);
            Assert.Empty(await db.RoomOverlays.Where(o => o.FloorPlanAssetId == ctx.ReplacementAssetId && o.RoomId == ctx.RoomBId && o.State == RoomOverlayState.Trusted).ToListAsync());
        }

        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/cancel", null)).StatusCode);
        var rolledBack = await PostReview($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/rollback");
        Assert.Equal(FloorPlanReplacementReviewStatus.Activated, rolledBack.Status);
        await using (var db = Db())
        {
            Assert.Equal(1, await db.FloorPlanAssets.CountAsync(a => a.FloorId == ctx.FloorId && a.State == FloorPlanAssetState.Active));
            Assert.Equal(FloorPlanAssetState.Active, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ActiveAssetId)).State);
            Assert.Equal(FloorPlanAssetState.Replaced, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ReplacementAssetId)).State);
            Assert.Equal(RoomOverlayState.Trusted, (await db.RoomOverlays.SingleAsync(o => o.Id == ctx.TrustedOverlayId)).State);
            Assert.Equal(RoomOverlayState.Valid, (await db.RoomOverlays.SingleAsync(o => o.Id == replacementOverlay.Id)).State);
        }
    }

    [Fact]
    public async Task FailedActivationAndLegacyDirectReplacementActivationLeaveSetupUnchanged()
    {
        var ctx = await SeedReviewContext();
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync($"/api/floors/{ctx.FloorId}/floor-plan-assets/{ctx.ReplacementAssetId}/activate", null)).StatusCode);
        var review = await StartReview(ctx.FloorId, ctx.ReplacementAssetId);
        var response = await _client.PostAsync($"/api/floors/{ctx.FloorId}/floor-plan-replacement-reviews/{review.Id}/activate", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var db = Db();
        Assert.Equal(FloorPlanAssetState.Active, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ActiveAssetId)).State);
        Assert.Equal(FloorPlanAssetState.Validated, (await db.FloorPlanAssets.SingleAsync(a => a.Id == ctx.ReplacementAssetId)).State);
        Assert.Equal(RoomOverlayState.Trusted, (await db.RoomOverlays.SingleAsync(o => o.Id == ctx.TrustedOverlayId)).State);
        Assert.NotEqual(FloorPlanReplacementReviewStatus.Activated, (await db.FloorPlanReplacementReviews.SingleAsync(r => r.Id == review.Id)).Status);
    }

    [Fact]
    public void OpenApiAndGeneratedClientExposeReplacementReviewContracts()
    {
        var openApi = JsonNode.Parse(File.ReadAllText(FindRepositoryFile("src/HomeOps.Contracts/openapi.json")))!;

        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews", "post", "201", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews", "get", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/active", "get", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        Assert.NotNull(openApi["paths"]!["/api/floors/{floorId}/floor-plan-replacement-reviews/active"]!["get"]!["responses"]!["204"]);
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}", "get", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms", "get", "200", "#/components/schemas/FloorPlanReplacementReviewItemDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/disposition", "put", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/approve-reuse", "post", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/approve-reuse", "post", "400", "#/components/schemas/ReplacementReviewValidationResultDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/replacement-overlay", "post", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/reset", "post", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/validation", "get", "200", "#/components/schemas/ReplacementReviewValidationResultDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/activate", "post", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/cancel", "post", "200", "#/components/schemas/FloorPlanReplacementReviewDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rollback", "get", "200", "#/components/schemas/FloorPlanReplacementRollbackAvailabilityDto");
        AssertJsonReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rollback", "post", "200", "#/components/schemas/FloorPlanReplacementReviewDto");

        AssertRequestReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews", "post", "#/components/schemas/StartFloorPlanReplacementReviewRequest");
        AssertRequestReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/disposition", "put", "#/components/schemas/UpdateRoomReplacementDispositionRequest");
        AssertRequestReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/approve-reuse", "post", "#/components/schemas/ApproveReuseCandidateRequest");
        AssertRequestReference(openApi, "/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/replacement-overlay", "post", "#/components/schemas/AttachReplacementOverlayRequest");

        AssertEnumNames(openApi, "FloorPlanReplacementReviewStatus", ["Draft", "InReview", "ReadyToActivate", "Activated", "Cancelled", "Invalid"]);
        AssertEnumNames(openApi, "RoomReplacementDisposition", ["PendingReview", "ApprovedReuse", "RedrawRequired", "NotConfiguredYet", "IntentionallyNotDrawn", "BlockedFallback"]);
        Assert.NotNull(openApi["components"]!["schemas"]!["FloorPlanReplacementCompatibilityDto"]);
        Assert.NotNull(openApi["components"]!["schemas"]!["ReplacementReviewValidationResultDto"]!["properties"]!["blockers"]!["items"]!["$ref"]);

        var client = File.ReadAllText(FindRepositoryFile("src/HomeOps.Client/src/api/homeOpsApiClient.ts"));
        Assert.Contains("startFloorPlanReplacementReview(floorId: string, req: StartFloorPlanReplacementReviewRequest): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("listFloorPlanReplacementReviews(floorId: string): Promise<FloorPlanReplacementReviewDto[]>", client);
        Assert.Contains("getActiveFloorPlanReplacementReview(floorId: string): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("getFloorPlanReplacementReviewRooms(floorId: string, reviewId: string): Promise<FloorPlanReplacementReviewItemDto[]>", client);
        Assert.Contains("updateFloorPlanReplacementRoomDisposition(floorId: string, reviewId: string, roomId: string, req: UpdateRoomReplacementDispositionRequest): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("approveFloorPlanReplacementReuse(floorId: string, reviewId: string, roomId: string, req: ApproveReuseCandidateRequest): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("attachFloorPlanReplacementOverlay(floorId: string, reviewId: string, roomId: string, req: AttachReplacementOverlayRequest): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("validateFloorPlanReplacementReview(floorId: string, reviewId: string): Promise<ReplacementReviewValidationResultDto>", client);
        Assert.Contains("activateFloorPlanReplacementReview(floorId: string, reviewId: string): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("cancelFloorPlanReplacementReview(floorId: string, reviewId: string): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("getFloorPlanReplacementRollbackAvailability(floorId: string, reviewId: string): Promise<FloorPlanReplacementRollbackAvailabilityDto>", client);
        Assert.Contains("rollbackFloorPlanReplacementReview(floorId: string, reviewId: string): Promise<FloorPlanReplacementReviewDto>", client);
        Assert.Contains("export enum FloorPlanReplacementReviewStatus", client);
        Assert.Contains("export enum RoomReplacementDisposition", client);
    }

    private HomeOpsDbContext Db()
    {
        var scope = factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
    }

    private async Task<ReviewContext> SeedReviewContext(string suffix = "", bool labelAnchor = false)
    {
        var floor = await CreateFloor($"Review floor {Guid.NewGuid():N} {suffix}");
        var roomA = await CreateRoom(floor.Id, "Room A");
        var roomB = await CreateRoom(floor.Id, "Room B");
        var first = await Upload(floor.Id, "first.svg", "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100'/></svg>");
        await PostAsset($"/api/floors/{floor.Id}/floor-plan-assets/{first.Id}/activate");
        var replacement = await Upload(floor.Id, "replacement.svg", "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100'/></svg>");
        var trusted = await CreateOverlay(floor.Id, roomA.Id, first.Id, Rect(.1m, .1m, .4m, .4m), RoomOverlayState.Valid, labelAnchor ? new(.2m, .2m) : null);
        await _client.PostAsync($"/api/room-overlays/{trusted.Id}/trust", null);
        return new(floor.Id, roomA.Id, roomB.Id, first.Id, replacement.Id, trusted.Id);
    }

    private async Task<FloorDto> CreateFloor(string name) { var response = await _client.PostAsJsonAsync("/api/floors", new CreateFloorRequest(name)); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorDto>())!; }
    private async Task<RoomDto> CreateRoom(Guid floorId, string name) { var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/rooms", new CreateRoomRequest(name, RoomType.Other)); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<RoomDto>())!; }
    private async Task<FloorPlanAssetDto> Upload(Guid floorId, string filename, string body) { using var form = new MultipartFormDataContent(); form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes(body)), "file", filename); var response = await _client.PostAsync($"/api/floors/{floorId}/floor-plan-assets", form); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorPlanAssetUploadResult>())!.Asset; }
    private async Task<FloorPlanAssetDto> PostAsset(string url) { var response = await _client.PostAsync(url, null); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorPlanAssetDto>())!; }
    private async Task<RoomOverlayDto> CreateOverlay(Guid floorId, Guid roomId, Guid assetId, IReadOnlyList<NormalizedPoint> polygon, RoomOverlayState state, NormalizedPoint? anchor = null) { var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/overlays", new CreateRoomOverlayRequest(roomId, assetId, polygon, anchor, state)); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<RoomOverlayDto>())!; }
    private async Task<FloorPlanReplacementReviewDto> StartReview(Guid floorId, Guid replacementAssetId) { var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/floor-plan-replacement-reviews", new StartFloorPlanReplacementReviewRequest(replacementAssetId)); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorPlanReplacementReviewDto>())!; }
    private async Task<FloorPlanReplacementReviewDto> PutDisposition(Guid floorId, Guid reviewId, Guid roomId, RoomReplacementDisposition disposition) { var response = await _client.PutAsJsonAsync($"/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/disposition", new UpdateRoomReplacementDispositionRequest(disposition)); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorPlanReplacementReviewDto>())!; }
    private async Task<FloorPlanReplacementReviewDto> AttachOverlay(Guid floorId, Guid reviewId, Guid roomId, Guid overlayId) { var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/replacement-overlay", new AttachReplacementOverlayRequest(overlayId)); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorPlanReplacementReviewDto>())!; }
    private async Task<FloorPlanReplacementReviewDto> ApproveReuse(Guid floorId, Guid reviewId, Guid roomId, bool preserveAnchor) { var response = await _client.PostAsJsonAsync($"/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/approve-reuse", new ApproveReuseCandidateRequest(preserveAnchor)); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorPlanReplacementReviewDto>())!; }

    private async Task<RoomOverlayDto> SeedOverlay(Guid floorId, Guid roomId, Guid assetId, IReadOnlyList<NormalizedPoint> polygon, RoomOverlayState state, NormalizedPoint? anchor = null)
    {
        var now = DateTimeOffset.UtcNow;
        var overlay = new RoomOverlay { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floorId, RoomId = roomId, FloorPlanAssetId = assetId, State = state, PolygonJson = System.Text.Json.JsonSerializer.Serialize(polygon, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web)), LabelAnchorX = anchor?.X, LabelAnchorY = anchor?.Y, CreatedUtc = now, UpdatedUtc = now };
        await using var db = Db();
        db.RoomOverlays.Add(overlay);
        await db.SaveChangesAsync();
        return new RoomOverlayDto(overlay.Id, roomId, floorId, assetId, state, polygon, anchor, null, now, now);
    }
    private async Task<ReplacementReviewValidationResultDto> Readiness(Guid floorId, Guid reviewId) => (await _client.GetFromJsonAsync<ReplacementReviewValidationResultDto>($"/api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/validation"))!;
    private async Task<FloorPlanReplacementReviewDto> PostReview(string url) { var response = await _client.PostAsync(url, null); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<FloorPlanReplacementReviewDto>())!; }
    private static NormalizedPoint[] Rect(decimal x1, decimal y1, decimal x2, decimal y2) => [new(x1, y1), new(x2, y1), new(x2, y2), new(x1, y2)];
    private sealed record ReviewContext(Guid FloorId, Guid RoomAId, Guid RoomBId, Guid ActiveAssetId, Guid ReplacementAssetId, Guid TrustedOverlayId);

    private static void AssertJsonReference(JsonNode openApi, string path, string method, string status, string schemaReference)
    {
        var response = openApi["paths"]![path]![method]!["responses"]![status]!;
        var schema = response["content"]?["application/json"]?["schema"];
        Assert.NotNull(schema);
        var directReference = schema?["$ref"]?.GetValue<string>();
        var arrayReference = schema?["items"]?["$ref"]?.GetValue<string>();
        Assert.True(directReference == schemaReference || arrayReference == schemaReference, $"Expected {method.ToUpperInvariant()} {path} {status} to reference {schemaReference} but found {schema?.ToJsonString()}.");
    }

    private static void AssertRequestReference(JsonNode openApi, string path, string method, string schemaReference)
    {
        var schema = openApi["paths"]![path]![method]!["requestBody"]!["content"]!["application/json"]!["schema"];
        Assert.Equal(schemaReference, schema!["$ref"]!.GetValue<string>());
    }

    private static void AssertEnumNames(JsonNode openApi, string schemaName, string[] expected)
    {
        var names = openApi["components"]!["schemas"]![schemaName]!["x-enumNames"]!.AsArray().Select(node => node!.GetValue<string>()).ToArray();
        Assert.Equal(expected, names);
    }

    private static string FindRepositoryFile(string relativePath)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, relativePath);
            if (File.Exists(candidate)) return candidate;
            directory = directory.Parent;
        }
        throw new FileNotFoundException($"Could not find {relativePath} from {AppContext.BaseDirectory}.");
    }
}
