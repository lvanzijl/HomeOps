using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public sealed class RoomClimateReadModelService
{
    private readonly HomeOpsDbContext db;
    private readonly TimeProvider timeProvider;

    public RoomClimateReadModelService(HomeOpsDbContext db, TimeProvider timeProvider)
    {
        this.db = db;
        this.timeProvider = timeProvider;
    }
    public static readonly TimeSpan AgingAfter = TimeSpan.FromMinutes(20);
    public static readonly TimeSpan StaleAfter = TimeSpan.FromHours(2);
    public static readonly TimeSpan FutureTolerance = TimeSpan.FromMinutes(5);

    public async Task<(bool ok, string? field, string? message, SubmitRoomClimateObservationResponse? response)> Submit(Guid roomId, SubmitRoomClimateObservationRequest req, CancellationToken ct)
    {
        if (!Enum.IsDefined(req.OperatingState)) return Bad("operatingState", "Unsupported operating state.");
        var now = timeProvider.GetUtcNow();
        var received = req.ReceivedUtc ?? now;
        if (req.ObservedUtc > now.Add(FutureTolerance) || received > now.Add(FutureTolerance)) return Bad("observedUtc", "Observation timestamps cannot be too far in the future.");
        if (req.TemperatureCelsius is < -50m or > 80m) return Bad("temperatureCelsius", "Temperature must be between -50 and 80 Celsius.");
        if (req.RelativeHumidity is < 0m or > 100m) return Bad("relativeHumidity", "Relative humidity must be between 0 and 100.");
        if (req.TargetTemperatureCelsius is < 5m or > 35m) return Bad("targetTemperatureCelsius", "Target temperature must be between 5 and 35 Celsius.");
        var mapping = await db.RoomClimateSourceMappings.Include(m => m.Provider).Include(m => m.Room).FirstOrDefaultAsync(m => m.Id == req.SourceMappingId && m.HouseholdId == SeedHousehold.Id, ct);
        if (mapping is null || mapping.RoomId != roomId) return Bad("sourceMappingId", "Mapping must belong to the requested Room.");
        if (mapping.HouseholdId != mapping.Room!.HouseholdId || mapping.Provider!.HouseholdId != mapping.HouseholdId) return Bad("sourceMappingId", "Mapping, Room, and Provider must belong to the same household.");
        if (mapping.Room.IsArchived || !mapping.Room.IsEnabled) return Bad("roomId", "Archived or disabled Rooms cannot accept climate observations.");
        if (!mapping.IsEnabled || mapping.IsArchived || mapping.Provider.IsArchived || !mapping.Provider.IsEnabled || mapping.Health is MappingHealth.Missing or MappingHealth.Unavailable) return Bad("sourceMappingId", "Disabled or invalid mappings cannot publish active Room state.");
        var config = await db.RoomClimateConfigurations.AsNoTracking().FirstOrDefaultAsync(c => c.RoomId == roomId && c.HouseholdId == mapping.HouseholdId, ct);
        if (config is null || !config.IsClimateEnabled) return Bad("roomId", "Room requires enabled climate configuration before observations can be accepted.");
        if (req.TargetTemperatureCelsius is not null && config.MinimumPreferredTemperatureCelsius is not null && config.MaximumPreferredTemperatureCelsius is not null && (req.TargetTemperatureCelsius < config.MinimumPreferredTemperatureCelsius || req.TargetTemperatureCelsius > config.MaximumPreferredTemperatureCelsius)) return Bad("targetTemperatureCelsius", "Target temperature must be within the configured preferred range.");
        var current = await db.RoomClimateObservations.FirstOrDefaultAsync(o => o.RoomId == roomId && o.SourceMappingId == mapping.Id, ct);
        if (current is not null && req.ObservedUtc < current.ObservedUtc) return (true, null, null, new(RoomClimateObservationStatus.IgnoredOlderObservation, ToObservationDto(current)));
        if (current is null) { current = new RoomClimateObservation { Id = Guid.NewGuid(), HouseholdId = mapping.HouseholdId, RoomId = roomId, SourceMappingId = mapping.Id, ProviderId = mapping.ProviderId, CreatedUtc = now }; db.RoomClimateObservations.Add(current); }
        current.ObservedUtc = req.ObservedUtc; current.ReceivedUtc = received; current.TemperatureCelsius = req.TemperatureCelsius; current.RelativeHumidity = req.RelativeHumidity; current.TargetTemperatureCelsius = req.TargetTemperatureCelsius; current.OperatingState = req.IsProviderAvailable ? req.OperatingState : RoomClimateOperatingState.Unavailable; current.IsProviderAvailable = req.IsProviderAvailable; current.SourceReference = Clean(req.SourceReference, 240); current.StatusDetail = Clean(req.StatusDetail, 500); current.UpdatedUtc = now;
        mapping.LastSuccessfulUtc = now; mapping.LastCheckedUtc = now; mapping.UpdatedUtc = now;
        await db.SaveChangesAsync(ct);
        return (true, null, null, new(RoomClimateObservationStatus.Accepted, ToObservationDto(current)));
    }

    public async Task<RoomClimateStateDto?> GetRoom(Guid roomId, CancellationToken ct)
    {
        var room = await db.Rooms.Include(r => r.Floor).AsNoTracking().FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id && !r.IsArchived, ct);
        return room is null ? null : (await Build([room], ct)).Single();
    }

    public async Task<FloorClimateStateDto?> GetFloor(Guid floorId, CancellationToken ct)
    {
        var floor = await db.Floors.AsNoTracking().FirstOrDefaultAsync(f => f.Id == floorId && f.HouseholdId == SeedHousehold.Id && !f.IsArchived, ct);
        if (floor is null) return null;
        var rooms = await db.Rooms.Include(r => r.Floor).AsNoTracking().Where(r => r.FloorId == floorId && r.HouseholdId == SeedHousehold.Id && !r.IsArchived).OrderBy(r=>r.SortOrder).ThenBy(r=>r.Name).ToListAsync(ct);
        var states = await Build(rooms, ct);
        var active = await db.FloorPlanAssets.AsNoTracking().FirstOrDefaultAsync(a => a.FloorId == floorId && a.HouseholdId == SeedHousehold.Id && a.State == FloorPlanAssetState.Active, ct);
        return new(floor.Id, floor.Name, active is null ? null : AssetDto(active), states, Counts(states), states.Select(s=>s.ObservedUtc).Where(x=>x is not null).DefaultIfEmpty().Max(), Overall(states));
    }

    public async Task<HouseholdClimateSummaryDto> GetHousehold(Guid householdId, CancellationToken ct)
    {
        var floors = await db.Floors.AsNoTracking().Where(f=>f.HouseholdId==householdId&&!f.IsArchived).OrderBy(f=>f.SortOrder).ToListAsync(ct);
        var list = new List<FloorClimateSummaryDto>();
        foreach (var f in floors) { var state = await GetFloor(f.Id, ct); if (state is not null) list.Add(new(f.Id, f.Name, state.Counts, state.ObservedSummaryUtc, state.OverallAvailability)); }
        return new(householdId, list);
    }

    private async Task<List<RoomClimateStateDto>> Build(List<Room> rooms, CancellationToken ct)
    {
        var roomIds = rooms.Select(r=>r.Id).ToList(); var floorIds=rooms.Select(r=>r.FloorId).Distinct().ToList();
        var configs = await db.RoomClimateConfigurations.AsNoTracking().Where(c=>roomIds.Contains(c.RoomId)).ToDictionaryAsync(c=>c.RoomId, ct);
        var observations = await db.RoomClimateObservations.AsNoTracking().Where(o=>roomIds.Contains(o.RoomId)).GroupBy(o=>o.RoomId).Select(g=>g.OrderByDescending(o=>o.ObservedUtc).First()).ToDictionaryAsync(o=>o.RoomId, ct);
        var activeAssets = await db.FloorPlanAssets.AsNoTracking().Where(a=>floorIds.Contains(a.FloorId)&&a.HouseholdId==SeedHousehold.Id&&a.State==FloorPlanAssetState.Active).ToDictionaryAsync(a=>a.FloorId, ct);
        var overlays = await db.RoomOverlays.AsNoTracking().Where(o=>roomIds.Contains(o.RoomId) && (o.State==RoomOverlayState.Trusted || o.State==RoomOverlayState.NeedsReview)).ToListAsync(ct);
        var reviewItems = await db.FloorPlanReplacementReviewItems.Include(i=>i.Review).AsNoTracking().Where(i=>roomIds.Contains(i.RoomId) && i.Review != null && (i.Review.Status==FloorPlanReplacementReviewStatus.InReview || i.Review.Status==FloorPlanReplacementReviewStatus.ReadyToActivate)).ToListAsync(ct);
        return rooms.Select(r => BuildRoom(r, configs.GetValueOrDefault(r.Id), observations.GetValueOrDefault(r.Id), activeAssets.GetValueOrDefault(r.FloorId), overlays, reviewItems)).OrderBy(s=>rooms.Single(r=>r.Id==s.RoomId).SortOrder).ThenBy(s=>s.RoomName).ToList();
    }

    private RoomClimateStateDto BuildRoom(Room r, RoomClimateConfiguration? c, RoomClimateObservation? o, FloorPlanAsset? active, List<RoomOverlay> overlays, List<FloorPlanReplacementReviewItem> reviewItems)
    {
        var issues = new List<string>(); if (c is null) issues.Add("MissingConfiguration"); else if (!c.IsClimateEnabled) issues.Add("ClimateDisabled");
        if (c is not null && !db.RoomClimateSourceMappings.AsNoTracking().Any(m=>m.RoomId==r.Id&&!m.IsArchived&&m.IsEnabled)) issues.Add("MissingActiveMapping");
        if (o is null) issues.Add("NoObservation");
        var freshness = Freshness(o, timeProvider.GetUtcNow()); if (freshness is RoomClimateFreshness.Stale) issues.Add("StaleObservation"); if (freshness is RoomClimateFreshness.Unavailable) issues.Add("UnavailableObservation");
        var spatial = Spatial(r, active, overlays, reviewItems, out var trustedId);
        return new(r.Id, r.Name, r.FloorId, r.Floor?.Name ?? string.Empty, r.RoomType, ConfigSummary(c), o is null?null:ToObservationDto(o), o?.OperatingState ?? RoomClimateOperatingState.Unknown, freshness, o?.ObservedUtc, o?.ReceivedUtc, o?.IsProviderAvailable ?? false, issues, spatial, active?.Id, trustedId);
    }
    public static RoomClimateFreshness ClassifyFreshness(RoomClimateObservation? o, DateTimeOffset now) => Freshness(o, now);
    private static RoomClimateFreshness Freshness(RoomClimateObservation? o, DateTimeOffset now){ if(o is null || !o.IsProviderAvailable || o.OperatingState==RoomClimateOperatingState.Unavailable) return RoomClimateFreshness.Unavailable; var basis=o.ReceivedUtc>o.ObservedUtc?o.ReceivedUtc:o.ObservedUtc; var age=now - basis; return age<=AgingAfter?RoomClimateFreshness.Fresh:age<=StaleAfter?RoomClimateFreshness.Aging:RoomClimateFreshness.Stale; }
    private static RoomClimateSpatialDisplayStatus Spatial(Room r, FloorPlanAsset? active, List<RoomOverlay> overlays, List<FloorPlanReplacementReviewItem> items, out Guid? trustedId){ trustedId=null; if(active is null) return RoomClimateSpatialDisplayStatus.NoActiveFloorPlan; var item=items.FirstOrDefault(i=>i.RoomId==r.Id); if(item?.Disposition==RoomReplacementDisposition.IntentionallyNotDrawn) return RoomClimateSpatialDisplayStatus.IntentionallyNotDrawn; if(item is not null && item.Disposition is RoomReplacementDisposition.PendingReview or RoomReplacementDisposition.RedrawRequired or RoomReplacementDisposition.BlockedFallback) return RoomClimateSpatialDisplayStatus.OverlayNeedsReview; var needs=overlays.Any(o=>o.RoomId==r.Id&&o.FloorPlanAssetId==active.Id&&o.State==RoomOverlayState.NeedsReview); if(needs) return RoomClimateSpatialDisplayStatus.OverlayNeedsReview; var trusted=overlays.FirstOrDefault(o=>o.RoomId==r.Id&&o.FloorPlanAssetId==active.Id&&o.State==RoomOverlayState.Trusted); trustedId=trusted?.Id; return trusted is null?RoomClimateSpatialDisplayStatus.RoomListFallback:RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable; }
    private static RoomClimateConfigurationSummaryDto ConfigSummary(RoomClimateConfiguration? c)=> c is null ? new(false,false,null,null,HeatingPolicyIntent.None,[]) : new(true,c.IsClimateEnabled,c.MinimumPreferredTemperatureCelsius is null||c.MaximumPreferredTemperatureCelsius is null?null:new(c.MinimumPreferredTemperatureCelsius.Value,c.MaximumPreferredTemperatureCelsius.Value),c.MinimumPreferredRelativeHumidity is null||c.MaximumPreferredRelativeHumidity is null?null:new(c.MinimumPreferredRelativeHumidity.Value,c.MaximumPreferredRelativeHumidity.Value),c.HeatingPolicyIntent,FloorPlanEndpoints.DeriveRequiredSourceRoles(c));
    private static FloorPlanAssetDto AssetDto(FloorPlanAsset a)=>new(a.Id,a.FloorId,a.OriginalFilename,a.DetectedMediaType,a.ContentHash,a.SourceWidth,a.SourceHeight,a.CoordinateBasisWidth,a.CoordinateBasisHeight,a.AspectRatio,a.State,a.ReplacementOfAssetId,a.UploadedUtc,a.CreatedUtc,a.UpdatedUtc,a.ValidationSummary,a.SourceAvailability,a.DerivativeAvailability,$"/api/floor-plan-assets/{a.Id}/derivative");
    private static FloorClimateCountsDto Counts(IEnumerable<RoomClimateStateDto> s)=>new(s.Count(x=>x.Freshness==RoomClimateFreshness.Fresh),s.Count(x=>x.Freshness==RoomClimateFreshness.Aging),s.Count(x=>x.Freshness==RoomClimateFreshness.Stale),s.Count(x=>x.Freshness==RoomClimateFreshness.Unavailable),s.Count(x=>x.SpatialDisplayStatus==RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable),s.Count(x=>x.SpatialDisplayStatus!=RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable));
    private static RoomClimateFreshness Overall(IReadOnlyCollection<RoomClimateStateDto> s)=>s.Count==0?RoomClimateFreshness.Unavailable:s.Any(x=>x.Freshness==RoomClimateFreshness.Fresh)?RoomClimateFreshness.Fresh:s.Any(x=>x.Freshness==RoomClimateFreshness.Aging)?RoomClimateFreshness.Aging:s.Any(x=>x.Freshness==RoomClimateFreshness.Stale)?RoomClimateFreshness.Stale:RoomClimateFreshness.Unavailable;
    public static RoomClimateObservationDto ToObservationDto(RoomClimateObservation o)=>new(o.Id,o.RoomId,o.SourceMappingId,o.ProviderId,o.ObservedUtc,o.ReceivedUtc,o.TemperatureCelsius,o.RelativeHumidity,o.TargetTemperatureCelsius,o.OperatingState,o.IsProviderAvailable,o.SourceReference,o.StatusDetail,o.CreatedUtc,o.UpdatedUtc);
    private static string? Clean(string? value, int max)=>string.IsNullOrWhiteSpace(value)?null:value.Trim()[..Math.Min(value.Trim().Length,max)];
    private static (bool,string,string,SubmitRoomClimateObservationResponse?) Bad(string f,string m)=>(false,f,m,null);
}
