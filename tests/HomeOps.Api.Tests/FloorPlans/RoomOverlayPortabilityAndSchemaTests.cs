using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomOverlayPortabilityAndSchemaTests
{
    [Fact]
    public async Task ExportRestorePreservesOverlayShapeAndDowngradesTrustedInputToValid()
    {
        await using var source = CreateDbContext("overlay-export-source");
        var (floor, room, asset) = SeedGraph(source);
        var overlayId = Guid.NewGuid();
        source.RoomOverlays.Add(new RoomOverlay { Id = overlayId, HouseholdId = SeedHousehold.Id, FloorId = floor.Id, RoomId = room.Id, FloorPlanAssetId = asset.Id, State = RoomOverlayState.Trusted, PolygonJson = "[{\"x\":0.123456789012,\"y\":0.1},{\"x\":0.8,\"y\":0.1},{\"x\":0.8,\"y\":0.7},{\"x\":0.1,\"y\":0.7}]", LabelAnchorX = .3m, LabelAnchorY = .3m, CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc });
        await source.SaveChangesAsync();
        var export = WithDerivative(await CalendarPortabilityService.ExportAsync(source));
        var exported = Assert.Single(export.Calendar.RoomOverlays!);
        Assert.Equal(overlayId, exported.Id);
        Assert.Equal(.123456789012m, exported.Polygon[0].X);
        Assert.Equal(new NormalizedPoint(.3m, .3m), exported.LabelAnchor);

        await using var target = CreateDbContext("overlay-export-target");
        UseSnapshotDirectory();
        var result = await CalendarPortabilityService.RestoreAsync(target, export);
        Assert.True(result.Succeeded, string.Join(';', result.ValidationErrors.SelectMany(e => e.Value)));
        var restored = await target.RoomOverlays.SingleAsync(o => o.Id == overlayId);
        Assert.Equal(RoomOverlayState.Valid, restored.State);
        Assert.Equal(.3m, restored.LabelAnchorX);
        Assert.Equal(exported.Polygon, System.Text.Json.JsonSerializer.Deserialize<List<NormalizedPoint>>(restored.PolygonJson, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web))!);
    }

    [Fact]
    public async Task RestoreRejectsInvalidOverlayPayloadsAndLeavesExistingGraphUnchanged()
    {
        await using var db = CreateDbContext("overlay-restore-invalid");
        var (floor, room, asset) = SeedGraph(db);
        var existing = new RoomOverlay { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, RoomId = room.Id, FloorPlanAssetId = asset.Id, State = RoomOverlayState.Valid, PolygonJson = JsonPolygon(Rect(0, 0, .3m, .3m)), CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc };
        db.RoomOverlays.Add(existing);
        await db.SaveChangesAsync();
        var export = WithDerivative(await CalendarPortabilityService.ExportAsync(db));
        var invalid = export with { Calendar = export.Calendar with { RoomOverlays = [OverlayExport(Guid.NewGuid(), room.Id, floor.Id, asset.Id, RoomOverlayState.Valid, [new(-.1m,0), new(1,0), new(0,1)])] } };
        UseSnapshotDirectory();

        var result = await CalendarPortabilityService.RestoreAsync(db, invalid);

        Assert.False(result.Succeeded);
        Assert.Contains("Calendar.RoomOverlays.PointOutOfRange", result.ValidationErrors.Keys);
        Assert.Equal(existing.Id, (await db.RoomOverlays.SingleAsync()).Id);
        Assert.Equal(floor.Id, (await db.Floors.SingleAsync(f => f.Id == floor.Id)).Id);
        Assert.Equal(room.Id, (await db.Rooms.SingleAsync(r => r.Id == room.Id)).Id);
        Assert.Equal(asset.Id, (await db.FloorPlanAssets.SingleAsync(a => a.Id == asset.Id)).Id);
    }

    [Fact]
    public async Task RestoreHandlesAbsentAndExplicitEmptyOverlaySections()
    {
        await using var db = CreateDbContext("overlay-restore-empty");
        var (floor, room, asset) = SeedGraph(db);
        db.RoomOverlays.Add(new RoomOverlay { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, RoomId = room.Id, FloorPlanAssetId = asset.Id, State = RoomOverlayState.Valid, PolygonJson = JsonPolygon(Rect(0, 0, .3m, .3m)), CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc });
        await db.SaveChangesAsync();
        var export = WithDerivative(await CalendarPortabilityService.ExportAsync(db));
        UseSnapshotDirectory();

        var absent = export with { Calendar = export.Calendar with { RoomOverlays = null } };
        var absentResult = await CalendarPortabilityService.RestoreAsync(db, absent);
        Assert.True(absentResult.Succeeded);
        Assert.Empty(await db.RoomOverlays.ToListAsync());

        db.RoomOverlays.Add(new RoomOverlay { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, RoomId = room.Id, FloorPlanAssetId = asset.Id, State = RoomOverlayState.Valid, PolygonJson = JsonPolygon(Rect(0, 0, .3m, .3m)), CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc });
        await db.SaveChangesAsync();
        var empty = export with { Calendar = export.Calendar with { RoomOverlays = [] } };
        var emptyResult = await CalendarPortabilityService.RestoreAsync(db, empty);
        Assert.True(emptyResult.Succeeded);
        Assert.Empty(await db.RoomOverlays.ToListAsync());
    }

    [Fact]
    public async Task ExportRestorePreservesReplacementReviewItemsAndRejectsInvalidReviewGraphAtomically()
    {
        await using var source = CreateDbContext("replacement-review-export-source");
        var (floor, room, asset) = SeedGraph(source);
        var replacement = new FloorPlanAsset { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, OriginalFilename = "replacement.svg", DetectedMediaType = "image/svg+xml", ContentHash = Guid.NewGuid().ToString("N"), SourceContentReference = "source", DerivativeContentReference = "derivative", CoordinateBasisWidth = 100, CoordinateBasisHeight = 100, AspectRatio = 1, State = FloorPlanAssetState.Validated, ReplacementOfAssetId = asset.Id, SourceAvailability = FloorPlanAssetAvailability.Available, DerivativeAvailability = FloorPlanAssetAvailability.Available, UploadedUtc = SeedCalendarEvents.SeededUtc, CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc };
        var reviewId = Guid.NewGuid();
        source.FloorPlanAssets.Add(replacement);
        source.FloorPlanReplacementReviews.Add(new FloorPlanReplacementReview { Id = reviewId, HouseholdId = SeedHousehold.Id, FloorId = floor.Id, CurrentAssetId = asset.Id, ReplacementAssetId = replacement.Id, Status = FloorPlanReplacementReviewStatus.InReview, SameCoordinateBasisDimensions = true, SameAspectRatio = true, SameDerivativeBasis = true, ReuseCandidatesAvailable = true, CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc });
        source.FloorPlanReplacementReviewItems.Add(new FloorPlanReplacementReviewItem { Id = Guid.NewGuid(), ReviewId = reviewId, HouseholdId = SeedHousehold.Id, FloorId = floor.Id, RoomId = room.Id, Disposition = RoomReplacementDisposition.BlockedFallback, CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc });
        await source.SaveChangesAsync();
        var export = WithDerivative(await CalendarPortabilityService.ExportAsync(source));

        await using var target = CreateDbContext("replacement-review-export-target");
        UseSnapshotDirectory();
        var restored = await CalendarPortabilityService.RestoreAsync(target, export);
        Assert.True(restored.Succeeded, string.Join(';', restored.ValidationErrors.SelectMany(e => e.Value)));
        Assert.Equal(FloorPlanReplacementReviewStatus.InReview, (await target.FloorPlanReplacementReviews.SingleAsync()).Status);
        Assert.Equal(RoomReplacementDisposition.BlockedFallback, (await target.FloorPlanReplacementReviewItems.SingleAsync()).Disposition);

        var invalid = export with { Calendar = export.Calendar with { FloorPlanReplacementReviewItems = export.Calendar.FloorPlanReplacementReviewItems!.Concat(export.Calendar.FloorPlanReplacementReviewItems!).ToList() } };
        var beforeReviewCount = await target.FloorPlanReplacementReviews.CountAsync();
        var failed = await CalendarPortabilityService.RestoreAsync(target, invalid);
        Assert.False(failed.Succeeded);
        Assert.Contains("Calendar.FloorPlanReplacementReviewItems.DuplicateRoom", failed.ValidationErrors.Keys);
        Assert.Equal(beforeReviewCount, await target.FloorPlanReplacementReviews.CountAsync());
    }

    [Fact]
    public async Task RestoreRejectsActivatedReviewWithInconsistentTrustedOverlayGraph()
    {
        await using var db = CreateDbContext("replacement-review-invalid-activated");
        var (floor, room, oldAsset) = SeedGraph(db);
        var replacement = new FloorPlanAsset { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, OriginalFilename = "replacement.svg", DetectedMediaType = "image/svg+xml", ContentHash = Guid.NewGuid().ToString("N"), SourceContentReference = "source", DerivativeContentReference = "derivative", CoordinateBasisWidth = 100, CoordinateBasisHeight = 100, AspectRatio = 1, State = FloorPlanAssetState.Active, ReplacementOfAssetId = oldAsset.Id, SourceAvailability = FloorPlanAssetAvailability.Available, DerivativeAvailability = FloorPlanAssetAvailability.Available, UploadedUtc = SeedCalendarEvents.SeededUtc, CreatedUtc = SeedCalendarEvents.SeededUtc, UpdatedUtc = SeedCalendarEvents.SeededUtc };
        oldAsset.State = FloorPlanAssetState.Replaced;
        db.FloorPlanAssets.Add(replacement);
        await db.SaveChangesAsync();
        var export = WithDerivative(await CalendarPortabilityService.ExportAsync(db));
        var reviewId = Guid.NewGuid();
        var overlayId = Guid.NewGuid();
        var invalid = export with
        {
            Calendar = export.Calendar with
            {
                RoomOverlays = [OverlayExport(overlayId, room.Id, floor.Id, replacement.Id, RoomOverlayState.Valid, Rect(.1m, .1m, .4m, .4m))],
                FloorPlanReplacementReviews = [new CalendarExportFloorPlanReplacementReview(reviewId, floor.Id, oldAsset.Id, replacement.Id, FloorPlanReplacementReviewStatus.Activated.ToString(), true, true, true, true, replacement.Id, oldAsset.Id, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc, null)],
                FloorPlanReplacementReviewItems = [new CalendarExportFloorPlanReplacementReviewItem(Guid.NewGuid(), reviewId, floor.Id, room.Id, RoomReplacementDisposition.ApprovedReuse.ToString(), null, overlayId, true, null, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc)]
            }
        };
        UseSnapshotDirectory();
        var failed = await CalendarPortabilityService.RestoreAsync(db, invalid);
        Assert.False(failed.Succeeded);
        Assert.Contains("Calendar.FloorPlanReplacementReviewItems.TrustedApprovedOverlay", failed.ValidationErrors.Keys);
    }

    [Fact]
    public void ModelContainsExpectedRoomOverlaySchemaShape()
    {
        using var db = CreateRelationalModelContext();
        var entity = db.Model.FindEntityType(typeof(RoomOverlay))!;
        Assert.Equal("RoomOverlays", entity.GetTableName());
        Assert.Equal(["Id"], entity.FindPrimaryKey()!.Properties.Select(p => p.Name));
        Assert.Equal("jsonb", entity.FindProperty(nameof(RoomOverlay.PolygonJson))!.GetColumnType());
        Assert.False(entity.FindProperty(nameof(RoomOverlay.PolygonJson))!.IsNullable);
        Assert.Equal(18, entity.FindProperty(nameof(RoomOverlay.LabelAnchorX))!.GetPrecision());
        Assert.Equal(12, entity.FindProperty(nameof(RoomOverlay.LabelAnchorX))!.GetScale());
        Assert.True(entity.FindProperty(nameof(RoomOverlay.LabelAnchorX))!.IsNullable);
        Assert.NotNull(entity.FindProperty(nameof(RoomOverlay.ArchivedUtc)));
        Assert.NotNull(entity.FindIndex(entity.FindProperties([nameof(RoomOverlay.FloorId), nameof(RoomOverlay.FloorPlanAssetId), nameof(RoomOverlay.State)])!));
        Assert.NotNull(entity.FindIndex(entity.FindProperties([nameof(RoomOverlay.RoomId), nameof(RoomOverlay.FloorPlanAssetId), nameof(RoomOverlay.State)])!));
        var trustedIndex = entity.GetIndexes().Single(i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomOverlay.RoomId), nameof(RoomOverlay.FloorPlanAssetId)]) && i.IsUnique);
        Assert.Equal("\"State\" = 'Trusted'", trustedIndex.GetFilter());
        Assert.Contains(entity.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(Room) && fk.DeleteBehavior == DeleteBehavior.Cascade);
        Assert.Contains(entity.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(FloorPlanAsset) && fk.DeleteBehavior == DeleteBehavior.Restrict);
        Assert.Contains(entity.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(Floor) && fk.DeleteBehavior == DeleteBehavior.Restrict);
        Assert.Contains(entity.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(Household) && fk.DeleteBehavior == DeleteBehavior.Restrict);
    }

    [Fact]
    public void ModelContainsExpectedReplacementReviewSchemaShape()
    {
        using var db = CreateRelationalModelContext();
        var review = db.Model.FindEntityType(typeof(FloorPlanReplacementReview))!;
        Assert.Equal("FloorPlanReplacementReviews", review.GetTableName());
        Assert.Equal("string", review.FindProperty(nameof(FloorPlanReplacementReview.Status))!.GetProviderClrType()?.Name.ToLowerInvariant() ?? "string");
        var activeReviewIndex = review.GetIndexes().Single(i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(FloorPlanReplacementReview.FloorId)]) && i.IsUnique);
        Assert.Equal("\"Status\" IN ('Draft','InReview','ReadyToActivate')", activeReviewIndex.GetFilter());
        Assert.Contains(review.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(FloorPlanAsset) && fk.DeleteBehavior == DeleteBehavior.Restrict);
        Assert.Contains(review.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(Floor) && fk.DeleteBehavior == DeleteBehavior.Restrict);

        var item = db.Model.FindEntityType(typeof(FloorPlanReplacementReviewItem))!;
        Assert.Equal("FloorPlanReplacementReviewItems", item.GetTableName());
        Assert.NotNull(item.FindIndex(item.FindProperties([nameof(FloorPlanReplacementReviewItem.FloorId), nameof(FloorPlanReplacementReviewItem.RoomId)])!));
        var roomIndex = item.GetIndexes().Single(i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(FloorPlanReplacementReviewItem.ReviewId), nameof(FloorPlanReplacementReviewItem.RoomId)]));
        Assert.True(roomIndex.IsUnique);
        Assert.Contains(item.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(FloorPlanReplacementReview) && fk.DeleteBehavior == DeleteBehavior.Cascade);
        Assert.Contains(item.GetForeignKeys(), fk => fk.PrincipalEntityType.ClrType == typeof(RoomOverlay) && fk.DeleteBehavior == DeleteBehavior.Restrict);
    }

    private static (Floor Floor, Room Room, FloorPlanAsset Asset) SeedGraph(HomeOpsDbContext db)
    {
        var now = SeedCalendarEvents.SeededUtc;
        var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = $"Overlay portability {Guid.NewGuid():N}", SortOrder = 0, IsEnabled = true, CreatedUtc = now, UpdatedUtc = now };
        var room = new Room { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, Name = $"Room {Guid.NewGuid():N}", SortOrder = 0, IsEnabled = true, CreatedUtc = now, UpdatedUtc = now };
        var asset = new FloorPlanAsset { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, OriginalFilename = "plan.svg", DetectedMediaType = "image/svg+xml", ContentHash = Guid.NewGuid().ToString("N"), SourceContentReference = "source", DerivativeContentReference = "derivative", CoordinateBasisWidth = 100, CoordinateBasisHeight = 100, AspectRatio = 1, State = FloorPlanAssetState.Active, SourceAvailability = FloorPlanAssetAvailability.Available, DerivativeAvailability = FloorPlanAssetAvailability.Available, UploadedUtc = now, CreatedUtc = now, UpdatedUtc = now };
        db.Floors.Add(floor); db.Rooms.Add(room); db.FloorPlanAssets.Add(asset); db.SaveChanges();
        return (floor, room, asset);
    }
    private static CalendarExportDocument WithDerivative(CalendarExportDocument document)
    {
        var bytes = Encoding.UTF8.GetBytes("<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100'/></svg>");
        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        return document with { Calendar = document.Calendar with { FloorPlanAssets = document.Calendar.FloorPlanAssets?.Select(a => a with { DerivativeContentBase64 = Convert.ToBase64String(bytes), DerivativeContentHash = null }).ToList() } };
    }
    private static CalendarExportRoomOverlay OverlayExport(Guid id, Guid roomId, Guid floorId, Guid assetId, RoomOverlayState state, IReadOnlyList<NormalizedPoint> polygon, NormalizedPoint? anchor = null) => new(id, roomId, floorId, assetId, state.ToString(), polygon, anchor, null, SeedCalendarEvents.SeededUtc, SeedCalendarEvents.SeededUtc);
    private static NormalizedPoint[] Rect(decimal x1, decimal y1, decimal x2, decimal y2) => [new(x1, y1), new(x2, y1), new(x2, y2), new(x1, y2)];
    private static string JsonPolygon(IReadOnlyList<NormalizedPoint> points) => System.Text.Json.JsonSerializer.Serialize(points, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
    private static void UseSnapshotDirectory() => CalendarPortabilityService.PreRestoreSnapshotDirectory = Path.Combine(Path.GetTempPath(), "homeops-overlay-tests", Guid.NewGuid().ToString("N"));
    private static HomeOpsDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>().UseInMemoryDatabase(name).Options;
        var db = new HomeOpsDbContext(options); db.Database.EnsureDeleted(); db.Database.EnsureCreated(); return db;
    }
    private static HomeOpsDbContext CreateRelationalModelContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>().UseNpgsql("Host=localhost;Database=model-only;Username=test;Password=test").Options;
        return new HomeOpsDbContext(options);
    }
}
