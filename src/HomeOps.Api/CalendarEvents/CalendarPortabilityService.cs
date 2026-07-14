using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.FloorPlans;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HomeOps.Api.CalendarEvents;

public static class CalendarPortabilityService
{
    private static readonly JsonSerializerOptions SnapshotJsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    private static readonly string DefaultPreRestoreSnapshotDirectory = Path.Combine(AppContext.BaseDirectory, "calendar-restore-snapshots");

    public static string PreRestoreSnapshotDirectory { get; set; } = DefaultPreRestoreSnapshotDirectory;
    public static FloorPlanAssetOptions FloorPlanAssetOptions { get; set; } = new();

    public static void ConfigurePreRestoreSnapshotDirectory(string? configuredDirectory)
    {
        PreRestoreSnapshotDirectory = string.IsNullOrWhiteSpace(configuredDirectory)
            ? DefaultPreRestoreSnapshotDirectory
            : configuredDirectory.Trim();
    }

    public static void ConfigureFloorPlanAssetStorage(string? storageRoot)
    {
        FloorPlanAssetOptions = string.IsNullOrWhiteSpace(storageRoot)
            ? new FloorPlanAssetOptions()
            : new FloorPlanAssetOptions { StorageRoot = storageRoot.Trim() };
    }

    public static async Task<CalendarExportDocument> ExportAsync(HomeOpsDbContext dbContext, CancellationToken cancellationToken = default)
    {
        var household = await dbContext.Households.AsNoTracking().SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
        var sources = await dbContext.EventSources
            .AsNoTracking()
            .Where(source => source.HouseholdId == SeedHousehold.Id)
            .OrderBy(source => source.Name)
            .Include(source => source.Configuration)
            .Select(source => new CalendarExportEventSource(
                source.Id,
                source.Name,
                source.SourceType,
                source.IsWritable,
                source.CreatedUtc,
                source.UpdatedUtc,
                source.Icon,
                source.IsEnabled,
                source.IsSystem,
                source.HealthStatus.ToString(),
                source.PollInterval.ToString(),
                ToExportProviderConfiguration(source.Configuration)))
            .ToListAsync(cancellationToken);
        var series = await dbContext.EventSeries
            .AsNoTracking()
            .Where(candidate => candidate.EventSource!.HouseholdId == SeedHousehold.Id)
            .OrderBy(candidate => candidate.StartDate)
            .ThenBy(candidate => candidate.StartTime)
            .ThenBy(candidate => candidate.Title)
            .Select(candidate => new CalendarExportEventSeries(
                candidate.Id,
                candidate.EventSourceId,
                candidate.Title,
                candidate.Description,
                candidate.IsAllDay,
                candidate.StartDate,
                candidate.StartTime,
                candidate.EndDate,
                candidate.EndTime,
                ToExportRecurrence(candidate),
                candidate.CreatedUtc,
                candidate.UpdatedUtc,
                candidate.Location,
                candidate.ProviderEventId,
                candidate.ProviderInstanceId,
                candidate.ProviderRevision,
                candidate.ContentFingerprint,
                candidate.ImportedAtUtc))
            .ToListAsync(cancellationToken);
        var exceptions = await dbContext.EventExceptions
            .AsNoTracking()
            .Where(exception => exception.EventSeries!.EventSource!.HouseholdId == SeedHousehold.Id)
            .OrderBy(exception => exception.OccurrenceDate)
            .Select(exception => new CalendarExportEventException(exception.Id, exception.EventSeriesId, exception.OccurrenceDate, (exception.IsSkipped ? EventExceptionType.Skipped : exception.ExceptionType).ToString(), exception.Title, exception.Description, exception.StartDate, exception.StartTime, exception.EndDate, exception.EndTime, (exception.OccurrenceKey == default ? OccurrenceKey.FromOriginalStart(exception.OccurrenceDate, exception.EventSeries!.StartTime) : exception.OccurrenceKey).Serialize(), exception.Location, exception.IsAllDay, exception.RawProviderRecurrenceId, exception.NormalizedProviderRecurrenceId, exception.DetachedProviderEventId, exception.DetachedProviderRevision, exception.DetachedContentFingerprint, exception.RawDetachedRecurrenceMetadata))
            .ToListAsync(cancellationToken);

        var floors = await dbContext.Floors.AsNoTracking()
            .Where(floor => floor.HouseholdId == SeedHousehold.Id)
            .OrderBy(floor => floor.SortOrder).ThenBy(floor => floor.Name)
            .Select(floor => new CalendarExportFloor(floor.Id, floor.Name, floor.SortOrder, floor.IsEnabled, floor.IsArchived, floor.ArchivedUtc, floor.CreatedUtc, floor.UpdatedUtc))
            .ToListAsync(cancellationToken);
        var rooms = await dbContext.Rooms.AsNoTracking()
            .Where(room => room.HouseholdId == SeedHousehold.Id)
            .OrderBy(room => room.FloorId).ThenBy(room => room.SortOrder).ThenBy(room => room.Name)
            .Select(room => new CalendarExportRoom(room.Id, room.FloorId, room.Name, room.RoomType.ToString(), room.SortOrder, room.FamilyMemberId, room.IsEnabled, room.IsArchived, room.ArchivedUtc, room.CreatedUtc, room.UpdatedUtc))
            .ToListAsync(cancellationToken);
        var climateConfigurations = await dbContext.RoomClimateConfigurations.AsNoTracking()
            .Where(config => config.HouseholdId == SeedHousehold.Id)
            .OrderBy(config => config.RoomId)
            .Select(config => new CalendarExportRoomClimateConfiguration(config.RoomId, config.IsClimateEnabled, config.IsBedtimeRelevant, config.MinimumPreferredTemperatureCelsius, config.MaximumPreferredTemperatureCelsius, config.MinimumPreferredRelativeHumidity, config.MaximumPreferredRelativeHumidity, config.HeatingPolicyIntent.ToString(), config.CreatedUtc, config.UpdatedUtc))
            .ToListAsync(cancellationToken);
        var climateProviders = await dbContext.ClimateProviders.AsNoTracking()
            .Where(provider => provider.HouseholdId == SeedHousehold.Id)
            .OrderBy(provider => provider.DisplayName)
            .Select(provider => new CalendarExportClimateProvider(provider.Id, provider.DisplayName, provider.ProviderType.ToString(), provider.IsEnabled, provider.IsArchived, provider.ArchivedUtc, provider.ExternalInstanceReference, provider.DiagnosticMetadata, provider.CreatedUtc, provider.UpdatedUtc))
            .ToListAsync(cancellationToken);
        var climateMappings = await dbContext.RoomClimateSourceMappings.AsNoTracking()
            .Where(mapping => mapping.HouseholdId == SeedHousehold.Id)
            .OrderBy(mapping => mapping.RoomId).ThenBy(mapping => mapping.SourceRole).ThenBy(mapping => mapping.Priority)
            .Select(mapping => new CalendarExportRoomClimateSourceMapping(mapping.Id, mapping.RoomId, mapping.ProviderId, mapping.SourceRole.ToString(), mapping.ExternalSourceId, mapping.ExternalDisplayName, mapping.ExternalSourceKind, mapping.ExternalAreaId, mapping.ExternalAreaName, mapping.ExternalDeviceId, mapping.ExternalDeviceName, mapping.Priority, mapping.IsEnabled, mapping.IsArchived, mapping.ArchivedUtc, mapping.Health.ToString(), mapping.LastCheckedUtc, mapping.LastSuccessfulUtc, mapping.DiagnosticSummary, mapping.CreatedUtc, mapping.UpdatedUtc))
            .ToListAsync(cancellationToken);

        var assetService = new FloorPlanAssetService(Microsoft.Extensions.Options.Options.Create(FloorPlanAssetOptions));
        var floorPlanAssets = new List<CalendarExportFloorPlanAsset>();
        foreach (var asset in await dbContext.FloorPlanAssets.AsNoTracking().Where(asset => asset.HouseholdId == SeedHousehold.Id).OrderBy(asset => asset.FloorId).ThenBy(asset => asset.CreatedUtc).ToListAsync(cancellationToken))
        {
            byte[]? derivative = null;
            try { derivative = await assetService.ReadDerivativeAsync(asset, cancellationToken); } catch { }
            floorPlanAssets.Add(new CalendarExportFloorPlanAsset(asset.Id, asset.FloorId, asset.OriginalFilename, asset.DetectedMediaType, asset.ContentHash, null, derivative is null ? null : Convert.ToBase64String(derivative), derivative is null ? null : Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(derivative)).ToLowerInvariant(), asset.SourceWidth, asset.SourceHeight, asset.CoordinateBasisWidth, asset.CoordinateBasisHeight, asset.AspectRatio, asset.State.ToString(), asset.ReplacementOfAssetId, asset.UploadedUtc, asset.CreatedUtc, asset.UpdatedUtc, asset.ValidationSummary, asset.SourceAvailability.ToString(), asset.DerivativeAvailability.ToString()));
        }

        var roomOverlays = await dbContext.RoomOverlays.AsNoTracking()
            .Where(overlay => overlay.HouseholdId == SeedHousehold.Id)
            .OrderBy(overlay => overlay.FloorId).ThenBy(overlay => overlay.RoomId).ThenBy(overlay => overlay.CreatedUtc)
            .Select(overlay => new CalendarExportRoomOverlay(overlay.Id, overlay.RoomId, overlay.FloorId, overlay.FloorPlanAssetId, overlay.State.ToString(), RoomOverlayEndpoints.Points(overlay), overlay.LabelAnchorX == null || overlay.LabelAnchorY == null ? null : new NormalizedPoint(overlay.LabelAnchorX.Value, overlay.LabelAnchorY.Value), overlay.ArchivedUtc, overlay.CreatedUtc, overlay.UpdatedUtc))
            .ToListAsync(cancellationToken);

        return new CalendarExportDocument(
            CalendarExportDocument.CurrentFormat,
            CalendarExportDocument.CurrentSchemaVersion,
            DateTimeOffset.UtcNow,
            new CalendarExportHousehold(household.Id, household.TimeZoneId),
            new CalendarExportPayload(CalendarExportPayload.CurrentVersion, sources, series, new CalendarExportRecurrenceSection([]), exceptions, new Dictionary<string, string>(), floors, rooms, climateConfigurations, climateProviders, climateMappings, floorPlanAssets, roomOverlays),
            new Dictionary<string, string>());
    }

    public static async Task<CalendarRestoreResult> RestoreAsync(HomeOpsDbContext dbContext, CalendarExportDocument? document, CancellationToken cancellationToken = default)
    {
        var validationErrors = Validate(document);
        if (validationErrors.Count == 0 && document is not null)
        {
            foreach (var error in await ValidateFloorRoomPayloadAsync(dbContext, document, cancellationToken))
            {
                validationErrors[error.Key] = error.Value;
            }
            foreach (var error in ValidateClimatePayload(document))
            {
                validationErrors[error.Key] = error.Value;
            }
            foreach (var error in await ValidateClimateRoomReferencesAsync(dbContext, document, cancellationToken))
            {
                validationErrors[error.Key] = error.Value;
            }
            foreach (var error in await ValidateClimateMappingPayloadAsync(dbContext, document, cancellationToken))
            {
                validationErrors[error.Key] = error.Value;
            }
            foreach (var error in ValidateFloorPlanAssetGraph(document))
            {
                validationErrors[error.Key] = error.Value;
            }
            foreach (var error in ValidateRoomOverlayPayload(document))
            {
                validationErrors[error.Key] = error.Value;
            }
        }
        if (validationErrors.Count > 0)
        {
            return new CalendarRestoreResult(false, validationErrors);
        }

        var floorPlanAssetService = new FloorPlanAssetService(Microsoft.Extensions.Options.Options.Create(FloorPlanAssetOptions));
        var stagedFloorPlanAssets = StageFloorPlanAssetContent(document!, floorPlanAssetService, out var contentErrors);
        if (contentErrors.Count > 0)
        {
            return new CalendarRestoreResult(false, contentErrors);
        }

        try
        {
            var snapshot = await ExportAsync(dbContext, cancellationToken);
            await WritePreRestoreSnapshotAsync(snapshot, cancellationToken);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or NotSupportedException or ArgumentException or System.Security.SecurityException)
        {
            return new CalendarRestoreResult(false, new Dictionary<string, string[]>
            {
                ["PreRestoreExport"] = [$"Restore was cancelled because the local pre-restore export snapshot could not be created: {exception.Message}"]
            });
        }

        await using var transaction = dbContext.Database.IsRelational() ? await dbContext.Database.BeginTransactionAsync(cancellationToken) : null;

        var household = await dbContext.Households.SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
        if (!string.IsNullOrWhiteSpace(document!.Household.TimeZoneId) && IsValidTimeZone(document.Household.TimeZoneId))
        {
            household.TimeZoneId = document.Household.TimeZoneId;
            household.UpdatedUtc = DateTimeOffset.UtcNow;
        }

        var existingSeries = await dbContext.EventSeries
            .Where(series => series.EventSource!.HouseholdId == SeedHousehold.Id)
            .ToListAsync(cancellationToken);
        dbContext.EventSeries.RemoveRange(existingSeries);
        var existingSources = await dbContext.EventSources
            .Include(source => source.Configuration)
            .Where(source => source.HouseholdId == SeedHousehold.Id)
            .ToListAsync(cancellationToken);
        var restoredSourceIds = document.Calendar.EventSources.Select(source => source.Id).ToHashSet();
        dbContext.EventSources.RemoveRange(existingSources.Where(source => !source.IsSystemManualSource && !restoredSourceIds.Contains(source.Id)));

        foreach (var source in document.Calendar.EventSources)
        {
            var restoredSource = ToRestoredSource(source);
            var existingSource = existingSources.FirstOrDefault(candidate => candidate.Id == restoredSource.Id);
            if (existingSource is null)
            {
                dbContext.EventSources.Add(restoredSource);
                UpsertRestoredProviderConfiguration(dbContext, restoredSource, source.ProviderConfiguration, source.CreatedUtc, source.UpdatedUtc);
                continue;
            }

            ApplyRestoredSource(existingSource, restoredSource);
            UpsertRestoredProviderConfiguration(dbContext, existingSource, source.ProviderConfiguration, source.CreatedUtc, source.UpdatedUtc);
        }

        var restoredSeriesById = document.Calendar.EventSeries.ToDictionary(series => series.Id);
        dbContext.EventSeries.AddRange(document.Calendar.EventSeries.Select(series => new EventSeries
        {
            Id = series.Id,
            EventSourceId = series.EventSourceId,
            Title = series.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(series.Description) ? null : series.Description.Trim(),
            IsAllDay = series.IsAllDay,
            StartDate = series.StartDate,
            StartTime = series.IsAllDay ? null : series.StartTime,
            EndDate = series.EndDate,
            EndTime = series.IsAllDay ? null : series.EndTime,
            RecurrenceType = series.Recurrence?.Frequency is null ? ParseRecurrenceType(series.Recurrence) : RecurrenceType.None,
            RecurrenceRule = ToRestoredRecurrenceRule(series.Recurrence),
            Location = string.IsNullOrWhiteSpace(series.Location) ? null : series.Location.Trim(),
            ProviderEventId = string.IsNullOrWhiteSpace(series.ProviderEventId) ? null : series.ProviderEventId.Trim(),
            ProviderInstanceId = string.IsNullOrWhiteSpace(series.ProviderInstanceId) ? null : series.ProviderInstanceId.Trim(),
            ProviderRevision = string.IsNullOrWhiteSpace(series.ProviderRevision) ? null : series.ProviderRevision.Trim(),
            ContentFingerprint = string.IsNullOrWhiteSpace(series.ContentFingerprint) ? null : series.ContentFingerprint.Trim(),
            ImportedAtUtc = series.ImportedAtUtc,
            CreatedUtc = series.CreatedUtc,
            UpdatedUtc = series.UpdatedUtc,
        }));
        // Floor/Room portability is full replacement when the section is present.
        // Legacy backups without both collections leave the current Floor/Room graph unchanged.
        if (document.Calendar.Floors is not null && document.Calendar.Rooms is not null)
        {
            var existingOverlays = await dbContext.RoomOverlays.Where(overlay => overlay.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.RoomOverlays.RemoveRange(existingOverlays);
            var existingAssets = await dbContext.FloorPlanAssets.Where(asset => asset.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.FloorPlanAssets.RemoveRange(existingAssets);
            await dbContext.SaveChangesAsync(cancellationToken);
            var existingClimateConfigurations = await dbContext.RoomClimateConfigurations.Where(config => config.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.RoomClimateConfigurations.RemoveRange(existingClimateConfigurations);
            var existingRooms = await dbContext.Rooms.Where(room => room.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.Rooms.RemoveRange(existingRooms);
            var existingFloors = await dbContext.Floors.Where(floor => floor.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.Floors.RemoveRange(existingFloors);
            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
            var activeFamilyMemberIds = await dbContext.FamilyMembers.AsNoTracking()
                .Where(member => member.HouseholdId == SeedHousehold.Id && !member.IsDeleted)
                .Select(member => member.Id)
                .ToListAsync(cancellationToken);
            var activeFamilyMemberIdSet = activeFamilyMemberIds.ToHashSet(StringComparer.Ordinal);

            dbContext.Floors.AddRange(document.Calendar.Floors.Select(floor => new Floor { Id = floor.Id, HouseholdId = SeedHousehold.Id, Name = floor.Name.Trim(), SortOrder = floor.SortOrder, IsEnabled = floor.IsEnabled, IsArchived = floor.IsArchived, ArchivedUtc = floor.ArchivedUtc, CreatedUtc = floor.CreatedUtc, UpdatedUtc = floor.UpdatedUtc }));
            dbContext.Rooms.AddRange(document.Calendar.Rooms.Select(room =>
            {
                var familyMemberId = string.IsNullOrWhiteSpace(room.FamilyMemberId) ? null : room.FamilyMemberId.Trim();
                return new Room { Id = room.Id, HouseholdId = SeedHousehold.Id, FloorId = room.FloorId, Name = room.Name.Trim(), RoomType = Enum.Parse<RoomType>(room.RoomType, true), SortOrder = room.SortOrder, FamilyMemberId = familyMemberId is not null && activeFamilyMemberIdSet.Contains(familyMemberId) ? familyMemberId : null, IsEnabled = room.IsEnabled, IsArchived = room.IsArchived, ArchivedUtc = room.ArchivedUtc, CreatedUtc = room.CreatedUtc, UpdatedUtc = room.UpdatedUtc };
            }));
            if (document.Calendar.FloorPlanAssets is not null)
            {
                foreach (var asset in document.Calendar.FloorPlanAssets)
                {
                    var staged = stagedFloorPlanAssets.GetValueOrDefault(asset.Id);
                    var state = Enum.Parse<FloorPlanAssetState>(asset.State, true);
                    if (staged is null && state == FloorPlanAssetState.Active) state = FloorPlanAssetState.Missing;
                    var derivativeReference = staged is null
                        ? floorPlanAssetService.DerivativeReference(SeedHousehold.Id, asset.Id, asset.DetectedMediaType)
                        : await floorPlanAssetService.StoreRestoredDerivativeAsync(SeedHousehold.Id, asset.Id, staged.MediaType, staged.DerivativeBytes, cancellationToken);
                    dbContext.FloorPlanAssets.Add(new FloorPlanAsset { Id = asset.Id, HouseholdId = SeedHousehold.Id, FloorId = asset.FloorId, OriginalFilename = asset.OriginalFilename.Trim(), DetectedMediaType = asset.DetectedMediaType, ContentHash = asset.ContentHash.Trim(), SourceContentReference = floorPlanAssetService.MissingSourceReference(SeedHousehold.Id, asset.Id), DerivativeContentReference = derivativeReference, SourceWidth = staged?.SourceWidth ?? asset.SourceWidth, SourceHeight = staged?.SourceHeight ?? asset.SourceHeight, CoordinateBasisWidth = staged?.BasisWidth ?? asset.CoordinateBasisWidth, CoordinateBasisHeight = staged?.BasisHeight ?? asset.CoordinateBasisHeight, AspectRatio = (staged?.BasisWidth ?? asset.CoordinateBasisWidth) / (staged?.BasisHeight ?? asset.CoordinateBasisHeight), State = state, ReplacementOfAssetId = asset.ReplacementOfAssetId, UploadedUtc = asset.UploadedUtc, CreatedUtc = asset.CreatedUtc, UpdatedUtc = asset.UpdatedUtc, ValidationSummary = staged?.Summary ?? asset.ValidationSummary, SourceAvailability = FloorPlanAssetAvailability.Missing, DerivativeAvailability = staged is null ? FloorPlanAssetAvailability.Missing : FloorPlanAssetAvailability.Available });
                }
            }
            if (document.Calendar.RoomOverlays is not null)
            {
                dbContext.RoomOverlays.AddRange(document.Calendar.RoomOverlays.Select(overlay => new RoomOverlay
                {
                    Id = overlay.Id, HouseholdId = SeedHousehold.Id, RoomId = overlay.RoomId, FloorId = overlay.FloorId, FloorPlanAssetId = overlay.FloorPlanAssetId, State = Enum.Parse<RoomOverlayState>(overlay.State, true) == RoomOverlayState.Trusted ? RoomOverlayState.Valid : Enum.Parse<RoomOverlayState>(overlay.State, true), PolygonJson = JsonSerializer.Serialize(overlay.Polygon, SnapshotJsonOptions), LabelAnchorX = overlay.LabelAnchor?.X, LabelAnchorY = overlay.LabelAnchor?.Y, ArchivedUtc = overlay.ArchivedUtc, CreatedUtc = overlay.CreatedUtc, UpdatedUtc = overlay.UpdatedUtc
                }));
            }
            if (document.Calendar.RoomClimateConfigurations is not null)
            {
                dbContext.RoomClimateConfigurations.AddRange(document.Calendar.RoomClimateConfigurations.Select(config => new RoomClimateConfiguration
                {
                    RoomId = config.RoomId, HouseholdId = SeedHousehold.Id, IsClimateEnabled = config.IsClimateEnabled, IsBedtimeRelevant = config.IsBedtimeRelevant,
                    MinimumPreferredTemperatureCelsius = config.MinimumPreferredTemperatureCelsius, MaximumPreferredTemperatureCelsius = config.MaximumPreferredTemperatureCelsius,
                    MinimumPreferredRelativeHumidity = config.MinimumPreferredRelativeHumidity, MaximumPreferredRelativeHumidity = config.MaximumPreferredRelativeHumidity,
                    HeatingPolicyIntent = Enum.Parse<HeatingPolicyIntent>(config.HeatingPolicyIntent, true), CreatedUtc = config.CreatedUtc, UpdatedUtc = config.UpdatedUtc
                }));
            }
        }
        else if (document.Calendar.RoomClimateConfigurations is not null)
        {
            var existingClimateConfigurations = await dbContext.RoomClimateConfigurations.Where(config => config.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.RoomClimateConfigurations.RemoveRange(existingClimateConfigurations);
            dbContext.RoomClimateConfigurations.AddRange(document.Calendar.RoomClimateConfigurations.Select(config => new RoomClimateConfiguration
            {
                RoomId = config.RoomId, HouseholdId = SeedHousehold.Id, IsClimateEnabled = config.IsClimateEnabled, IsBedtimeRelevant = config.IsBedtimeRelevant,
                MinimumPreferredTemperatureCelsius = config.MinimumPreferredTemperatureCelsius, MaximumPreferredTemperatureCelsius = config.MaximumPreferredTemperatureCelsius,
                MinimumPreferredRelativeHumidity = config.MinimumPreferredRelativeHumidity, MaximumPreferredRelativeHumidity = config.MaximumPreferredRelativeHumidity,
                HeatingPolicyIntent = Enum.Parse<HeatingPolicyIntent>(config.HeatingPolicyIntent, true), CreatedUtc = config.CreatedUtc, UpdatedUtc = config.UpdatedUtc
            }));
        }

        if (document.Calendar.ClimateProviders is not null)
        {
            var existingMappings = await dbContext.RoomClimateSourceMappings.Where(mapping => mapping.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.RoomClimateSourceMappings.RemoveRange(existingMappings);
            var existingProviders = await dbContext.ClimateProviders.Where(provider => provider.HouseholdId == SeedHousehold.Id).ToListAsync(cancellationToken);
            dbContext.ClimateProviders.RemoveRange(existingProviders);
            dbContext.ClimateProviders.AddRange(document.Calendar.ClimateProviders.Select(provider => new ClimateProvider
            {
                Id = provider.Id, HouseholdId = SeedHousehold.Id, DisplayName = provider.DisplayName.Trim(), ProviderType = Enum.Parse<ProviderType>(provider.ProviderType, true), IsEnabled = provider.IsEnabled, IsArchived = provider.IsArchived, ArchivedUtc = provider.ArchivedUtc, ExternalInstanceReference = string.IsNullOrWhiteSpace(provider.ExternalInstanceReference) ? null : provider.ExternalInstanceReference.Trim(), DiagnosticMetadata = string.IsNullOrWhiteSpace(provider.DiagnosticMetadata) ? null : provider.DiagnosticMetadata.Trim(), CreatedUtc = provider.CreatedUtc, UpdatedUtc = provider.UpdatedUtc
            }));
            if (document.Calendar.RoomClimateSourceMappings is not null)
            {
                dbContext.RoomClimateSourceMappings.AddRange(document.Calendar.RoomClimateSourceMappings.Select(mapping => new RoomClimateSourceMapping
                {
                    Id = mapping.Id, HouseholdId = SeedHousehold.Id, RoomId = mapping.RoomId, ProviderId = mapping.ProviderId, SourceRole = Enum.Parse<ClimateSourceRole>(mapping.SourceRole, true), ExternalSourceId = mapping.ExternalSourceId.Trim(), ExternalDisplayName = string.IsNullOrWhiteSpace(mapping.ExternalDisplayName) ? null : mapping.ExternalDisplayName.Trim(), ExternalSourceKind = string.IsNullOrWhiteSpace(mapping.ExternalSourceKind) ? null : mapping.ExternalSourceKind.Trim(), ExternalAreaId = string.IsNullOrWhiteSpace(mapping.ExternalAreaId) ? null : mapping.ExternalAreaId.Trim(), ExternalAreaName = string.IsNullOrWhiteSpace(mapping.ExternalAreaName) ? null : mapping.ExternalAreaName.Trim(), ExternalDeviceId = string.IsNullOrWhiteSpace(mapping.ExternalDeviceId) ? null : mapping.ExternalDeviceId.Trim(), ExternalDeviceName = string.IsNullOrWhiteSpace(mapping.ExternalDeviceName) ? null : mapping.ExternalDeviceName.Trim(), Priority = mapping.Priority, IsEnabled = mapping.IsEnabled, IsArchived = mapping.IsArchived, ArchivedUtc = mapping.ArchivedUtc, Health = MappingHealth.Unverified, LastCheckedUtc = null, LastSuccessfulUtc = null, DiagnosticSummary = string.IsNullOrWhiteSpace(mapping.DiagnosticSummary) ? null : mapping.DiagnosticSummary.Trim(), CreatedUtc = mapping.CreatedUtc, UpdatedUtc = mapping.UpdatedUtc
                }));
            }
        }

        dbContext.EventExceptions.AddRange(document.Calendar.Exceptions.Select(exception => new EventException
        {
            Id = exception.Id,
            EventSeriesId = exception.EventSeriesId,
            OccurrenceDate = exception.OccurrenceDate,
            OccurrenceKey = ToRestoredOccurrenceKey(exception, restoredSeriesById),
            ExceptionType = ParseExceptionType(exception.ExceptionType),
            IsSkipped = string.Equals(exception.ExceptionType, "Skipped", StringComparison.OrdinalIgnoreCase),
            Title = string.IsNullOrWhiteSpace(exception.Title) ? null : exception.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(exception.Description) ? null : exception.Description.Trim(),
            Location = string.IsNullOrWhiteSpace(exception.Location) ? null : exception.Location.Trim(),
            IsAllDay = exception.IsAllDay,
            StartDate = exception.StartDate,
            StartTime = exception.StartTime,
            EndDate = exception.EndDate,
            EndTime = exception.EndTime,
            RawProviderRecurrenceId = string.IsNullOrWhiteSpace(exception.RawProviderRecurrenceId) ? null : exception.RawProviderRecurrenceId.Trim(),
            NormalizedProviderRecurrenceId = string.IsNullOrWhiteSpace(exception.NormalizedProviderRecurrenceId) ? null : exception.NormalizedProviderRecurrenceId.Trim(),
            DetachedProviderEventId = string.IsNullOrWhiteSpace(exception.DetachedProviderEventId) ? null : exception.DetachedProviderEventId.Trim(),
            DetachedProviderRevision = string.IsNullOrWhiteSpace(exception.DetachedProviderRevision) ? null : exception.DetachedProviderRevision.Trim(),
            DetachedContentFingerprint = string.IsNullOrWhiteSpace(exception.DetachedContentFingerprint) ? null : exception.DetachedContentFingerprint.Trim(),
            RawDetachedRecurrenceMetadata = string.IsNullOrWhiteSpace(exception.RawDetachedRecurrenceMetadata) ? null : exception.RawDetachedRecurrenceMetadata.Trim(),
            CreatedUtc = DateTimeOffset.UtcNow,
            UpdatedUtc = DateTimeOffset.UtcNow,
        }));
        await dbContext.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);

        return new CalendarRestoreResult(true, new Dictionary<string, string[]>());
    }


    private static CalendarExportRecurrence ToExportRecurrence(EventSeries series)
    {
        if (series.RecurrenceRule is null)
        {
            return new CalendarExportRecurrence(series.RecurrenceType.ToString(), string.Empty);
        }

        if (series.RecurrenceRule.UnsupportedRecurrenceStatus == UnsupportedRecurrenceStatus.Unsupported)
        {
            return new CalendarExportRecurrence(
                RecurrenceType.None.ToString(),
                series.RecurrenceRule.RawProviderRecurrenceRule ?? string.Empty,
                Frequency: null,
                RawProviderRecurrenceRule: series.RecurrenceRule.RawProviderRecurrenceRule,
                UnsupportedRecurrenceStatus: series.RecurrenceRule.UnsupportedRecurrenceStatus.ToString(),
                UnsupportedRecurrenceReason: series.RecurrenceRule.UnsupportedRecurrenceReason);
        }

        return new CalendarExportRecurrence(
            series.RecurrenceRule.Frequency.ToString(),
            series.RecurrenceRule.RawProviderRecurrenceRule ?? string.Empty,
            series.RecurrenceRule.Frequency.ToString(),
            series.RecurrenceRule.Interval,
            series.RecurrenceRule.EndMode.ToString(),
            series.RecurrenceRule.UntilDate,
            series.RecurrenceRule.Count,
            series.RecurrenceRule.WeeklyDays,
            series.RecurrenceRule.MonthlyDayOfMonth,
            series.RecurrenceRule.YearlyMonth,
            series.RecurrenceRule.YearlyDayOfMonth,
            series.RecurrenceRule.RawProviderRecurrenceRule,
            series.RecurrenceRule.UnsupportedRecurrenceStatus.ToString(),
            series.RecurrenceRule.UnsupportedRecurrenceReason);
    }

    private static EventRecurrenceRule? ToRestoredRecurrenceRule(CalendarExportRecurrence? recurrence)
    {
        if (recurrence is null)
        {
            return null;
        }

        var unsupportedStatus = Enum.TryParse<UnsupportedRecurrenceStatus>(recurrence.UnsupportedRecurrenceStatus, true, out var parsedUnsupportedStatus) ? parsedUnsupportedStatus : UnsupportedRecurrenceStatus.Supported;
        if (recurrence.Frequency is null)
        {
            return unsupportedStatus == UnsupportedRecurrenceStatus.Unsupported
                ? new EventRecurrenceRule
                {
                    RawProviderRecurrenceRule = string.IsNullOrWhiteSpace(recurrence.RawProviderRecurrenceRule) ? null : recurrence.RawProviderRecurrenceRule.Trim(),
                    UnsupportedRecurrenceStatus = unsupportedStatus,
                    UnsupportedRecurrenceReason = string.IsNullOrWhiteSpace(recurrence.UnsupportedRecurrenceReason) ? null : recurrence.UnsupportedRecurrenceReason.Trim(),
                }
                : null;
        }

        return new EventRecurrenceRule
        {
            Frequency = Enum.Parse<RecurrenceFrequency>(recurrence.Frequency, true),
            Interval = recurrence.Interval ?? 1,
            EndMode = Enum.TryParse<RecurrenceEndMode>(recurrence.EndMode, true, out var endMode) ? endMode : RecurrenceEndMode.Never,
            UntilDate = recurrence.UntilDate,
            Count = recurrence.Count,
            WeeklyDays = recurrence.WeeklyDays,
            MonthlyDayOfMonth = recurrence.MonthlyDayOfMonth,
            YearlyMonth = recurrence.YearlyMonth,
            YearlyDayOfMonth = recurrence.YearlyDayOfMonth,
            RawProviderRecurrenceRule = string.IsNullOrWhiteSpace(recurrence.RawProviderRecurrenceRule) ? null : recurrence.RawProviderRecurrenceRule.Trim(),
            UnsupportedRecurrenceStatus = unsupportedStatus,
            UnsupportedRecurrenceReason = string.IsNullOrWhiteSpace(recurrence.UnsupportedRecurrenceReason) ? null : recurrence.UnsupportedRecurrenceReason.Trim(),
        };
    }

    private static OccurrenceKey ToRestoredOccurrenceKey(CalendarExportEventException exception, IReadOnlyDictionary<Guid, CalendarExportEventSeries> seriesById)
    {
        if (!string.IsNullOrWhiteSpace(exception.OccurrenceKey) && OccurrenceKey.TryParse(exception.OccurrenceKey, out var key))
        {
            return key;
        }

        return seriesById.TryGetValue(exception.EventSeriesId, out var series)
            ? OccurrenceKey.FromOriginalStart(exception.OccurrenceDate, series.StartTime)
            : OccurrenceKey.FromOriginalStart(exception.OccurrenceDate, exception.StartTime);
    }

    private static EventExceptionType ParseExceptionType(string? exceptionType) =>
        Enum.TryParse<EventExceptionType>(exceptionType, true, out var value) ? value : EventExceptionType.Modified;

    private static CalendarExportProviderConfiguration? ToExportProviderConfiguration(EventSourceConfiguration? configuration) => configuration switch
    {
        ICalFeedSourceConfiguration feed => new CalendarExportProviderConfiguration(
            EventSourceTypes.ICalFeed,
            ICalFeed: new CalendarExportICalFeedConfiguration(feed.FeedUrl)),
        ICalFileSourceConfiguration file => new CalendarExportProviderConfiguration(
            EventSourceTypes.ICalFile,
            ICalFile: new CalendarExportICalFileConfiguration(file.FileReference, file.OriginalFilename, file.ContentHash, file.UploadedUtc)),
        _ => null
    };

    private static EventSource ToRestoredSource(CalendarExportEventSource source)
    {
        var sourceType = NormalizeSourceType(source.SourceType);
        var isManual = string.Equals(sourceType, EventSourceTypes.Manual, StringComparison.Ordinal);
        var isSystem = source.IsSystem ?? isManual;
        return new EventSource
        {
            Id = source.Id,
            HouseholdId = SeedHousehold.Id,
            Name = source.Name.Trim(),
            SourceType = sourceType,
            Icon = string.IsNullOrWhiteSpace(source.Icon) ? "📅" : source.Icon.Trim(),
            IsEnabled = source.IsEnabled ?? true,
            IsWritable = isManual && source.IsWritable,
            IsSystem = isSystem && isManual,
            HealthStatus = isManual ? EventSourceHealthStatus.Healthy : EventSourceHealthStatus.NeverSynced,
            PollInterval = ParsePollInterval(source.PollInterval),
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = source.UpdatedUtc,
        };
    }

    private static void ApplyRestoredSource(EventSource target, EventSource restored)
    {
        target.Name = restored.Name;
        target.SourceType = restored.SourceType;
        target.Icon = restored.Icon;
        target.IsEnabled = restored.IsEnabled;
        target.IsWritable = restored.IsSystemManualSource && restored.IsWritable;
        target.IsSystem = restored.IsSystemManualSource;
        target.HealthStatus = restored.IsSystemManualSource ? EventSourceHealthStatus.Healthy : EventSourceHealthStatus.NeverSynced;
        target.PollInterval = restored.PollInterval;
        target.ProviderSourceId = null;
        target.LastSyncAttemptUtc = null;
        target.LastSuccessfulSyncUtc = null;
        target.LastFailedSyncUtc = null;
        target.NextSyncAfterUtc = null;
        target.LastErrorCode = null;
        target.LastErrorMessage = null;
        target.LastErrorDetail = null;
        target.CreatedUtc = restored.CreatedUtc;
        target.UpdatedUtc = restored.UpdatedUtc;
    }

    private static void UpsertRestoredProviderConfiguration(HomeOpsDbContext dbContext, EventSource source, CalendarExportProviderConfiguration? configuration, DateTimeOffset createdUtc, DateTimeOffset updatedUtc)
    {
        if (configuration is null)
        {
            if (source.Configuration is not null)
            {
                dbContext.Remove(source.Configuration);
                source.Configuration = null;
            }
            return;
        }

        switch (configuration.ProviderType)
        {
            case EventSourceTypes.ICalFeed:
                var feed = configuration.ICalFeed!;
                if (source.Configuration is ICalFeedSourceConfiguration existingFeed)
                {
                    existingFeed.FeedUrl = feed.FeedUrl.Trim();
                    existingFeed.UpdatedUtc = updatedUtc;
                }
                else
                {
                    if (source.Configuration is not null) dbContext.Remove(source.Configuration);
                    dbContext.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration
                    {
                        EventSourceId = source.Id,
                        FeedUrl = feed.FeedUrl.Trim(),
                        CreatedUtc = createdUtc,
                        UpdatedUtc = updatedUtc,
                    });
                }
                break;
            case EventSourceTypes.ICalFile:
                var file = configuration.ICalFile!;
                if (source.Configuration is ICalFileSourceConfiguration existingFile)
                {
                    existingFile.FileReference = file.FileReference.Trim();
                    existingFile.OriginalFilename = file.OriginalFilename.Trim();
                    existingFile.ContentHash = file.ContentHash.Trim();
                    existingFile.UploadedUtc = file.UploadedUtc;
                    existingFile.UpdatedUtc = updatedUtc;
                }
                else
                {
                    if (source.Configuration is not null) dbContext.Remove(source.Configuration);
                    dbContext.ICalFileSourceConfigurations.Add(new ICalFileSourceConfiguration
                    {
                        EventSourceId = source.Id,
                        FileReference = file.FileReference.Trim(),
                        OriginalFilename = file.OriginalFilename.Trim(),
                        ContentHash = file.ContentHash.Trim(),
                        UploadedUtc = file.UploadedUtc,
                        CreatedUtc = createdUtc,
                        UpdatedUtc = updatedUtc,
                    });
                }
                break;
        }
    }

    private static async Task WritePreRestoreSnapshotAsync(CalendarExportDocument snapshot, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(PreRestoreSnapshotDirectory);
        var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmssfff");
        var path = Path.Combine(PreRestoreSnapshotDirectory, $"calendar-pre-restore-{timestamp}.json");
        await using var stream = File.Create(path);
        await JsonSerializer.SerializeAsync(stream, snapshot, SnapshotJsonOptions, cancellationToken);
    }


    private static Dictionary<string, string[]> ValidateRoomOverlayPayload(CalendarExportDocument document)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        var overlays = document.Calendar.RoomOverlays;
        if (overlays is null) return new Dictionary<string, string[]>();
        if (overlays.GroupBy(o => o.Id).Any(g => g.Count() > 1)) AddError(errors, "Calendar.RoomOverlays.Id", "Room overlay identifiers must be unique.");
        var roomIds = document.Calendar.Rooms?.Select(r => r.Id).ToHashSet() ?? [];
        var floorIds = document.Calendar.Floors?.Select(f => f.Id).ToHashSet() ?? [];
        var assetById = (document.Calendar.FloorPlanAssets ?? []).ToDictionary(a => a.Id);
        foreach (var o in overlays)
        {
            if (!Enum.TryParse<RoomOverlayState>(o.State, true, out var state)) AddError(errors, "Calendar.RoomOverlays.State", "Room overlay state is invalid.");
            if (!roomIds.Contains(o.RoomId)) AddError(errors, "Calendar.RoomOverlays.RoomId", "Room overlay Room references must exist in the restore payload.");
            if (!floorIds.Contains(o.FloorId)) AddError(errors, "Calendar.RoomOverlays.FloorId", "Room overlay Floor references must exist in the restore payload.");
            if (!assetById.TryGetValue(o.FloorPlanAssetId, out var asset)) AddError(errors, "Calendar.RoomOverlays.FloorPlanAssetId", "Room overlay Asset references must exist in the restore payload.");
            else if (asset.FloorId != o.FloorId) AddError(errors, "Calendar.RoomOverlays.AssetFloor", "Room overlay Asset must belong to the overlay Floor.");
            foreach (var issue in RoomOverlayGeometry.Validate(o.Polygon, o.LabelAnchor)) AddError(errors, $"Calendar.RoomOverlays.{issue.Code}", issue.Message);
            if (state == RoomOverlayState.Trusted && asset is not null && !string.Equals(asset.State, FloorPlanAssetState.Active.ToString(), StringComparison.OrdinalIgnoreCase)) AddError(errors, "Calendar.RoomOverlays.TrustedAsset", "Trusted overlays require an Active asset.");
        }
        foreach (var group in overlays.Where(o => string.Equals(o.State, RoomOverlayState.Trusted.ToString(), StringComparison.OrdinalIgnoreCase)).GroupBy(o => new { o.RoomId, o.FloorPlanAssetId }))
        {
            if (group.Count() > 1) AddError(errors, "Calendar.RoomOverlays.DuplicateTrusted", "Only one Trusted overlay per Room and asset may be restored.");
        }
        var trusted = overlays.Where(o => string.Equals(o.State, RoomOverlayState.Trusted.ToString(), StringComparison.OrdinalIgnoreCase)).ToList();
        for (var i = 0; i < trusted.Count; i++) for (var j = i + 1; j < trusted.Count; j++)
        {
            if (trusted[i].FloorPlanAssetId == trusted[j].FloorPlanAssetId && RoomOverlayGeometry.HasPositiveOverlap(trusted[i].Polygon, trusted[j].Polygon)) AddError(errors, "Calendar.RoomOverlays.Overlap", "Trusted restored overlays cannot overlap by positive area.");
        }
        return ToArrayDictionary(errors);
    }

    private static async Task<Dictionary<string, string[]>> ValidateFloorRoomPayloadAsync(HomeOpsDbContext dbContext, CalendarExportDocument document, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        var floors = document.Calendar.Floors;
        var rooms = document.Calendar.Rooms;
        if (floors is null && rooms is null) return new Dictionary<string, string[]>();
        if (floors is null || rooms is null)
        {
            AddError(errors, "Calendar.FloorsRooms", "Floor and Room collections must be supplied together. Older backups may omit both collections.");
            return ToArrayDictionary(errors);
        }

        if (floors.Any(floor => floor.Id == Guid.Empty)) AddError(errors, "Calendar.Floors.Id", "Floor identifiers must be non-empty GUIDs.");
        if (rooms.Any(room => room.Id == Guid.Empty || room.FloorId == Guid.Empty)) AddError(errors, "Calendar.Rooms.Id", "Room and Floor references must be non-empty GUIDs.");
        if (floors.GroupBy(floor => floor.Id).Any(group => group.Count() > 1)) AddError(errors, "Calendar.Floors.Id", "Floor identifiers must be unique within the backup.");
        if (rooms.GroupBy(room => room.Id).Any(group => group.Count() > 1)) AddError(errors, "Calendar.Rooms.Id", "Room identifiers must be unique within the backup.");
        if (floors.Any(floor => string.IsNullOrWhiteSpace(floor.Name))) AddError(errors, "Calendar.Floors.Name", "Floor names are required.");
        if (rooms.Any(room => string.IsNullOrWhiteSpace(room.Name))) AddError(errors, "Calendar.Rooms.Name", "Room names are required.");
        if (floors.Any(floor => floor.SortOrder < 0)) AddError(errors, "Calendar.Floors.SortOrder", "Floor sort orders must be zero or greater.");
        if (rooms.Any(room => room.SortOrder < 0)) AddError(errors, "Calendar.Rooms.SortOrder", "Room sort orders must be zero or greater.");
        if (floors.GroupBy(floor => floor.SortOrder).Any(group => group.Count() > 1)) AddError(errors, "Calendar.Floors.SortOrder", "Floor sort orders must be unique across restored Floors.");
        if (!IsContiguous(floors.Select(floor => floor.SortOrder))) AddError(errors, "Calendar.Floors.SortOrder", "Floor sort orders must be contiguous starting at zero.");

        var floorIds = floors.Select(floor => floor.Id).ToHashSet();
        var floorById = floors.GroupBy(floor => floor.Id).Where(group => group.Count() == 1).ToDictionary(group => group.Key, group => group.Single());
        if (rooms.Any(room => !floorIds.Contains(room.FloorId))) AddError(errors, "Calendar.Rooms.FloorId", "Every Room must reference a Floor owned by the same restore payload.");
        if (floors.GroupBy(floor => floor.Name.Trim(), StringComparer.Ordinal).Any(group => group.Count() > 1)) AddError(errors, "Calendar.Floors.Name", "Floor names must be unique across active and archived restored Floors to avoid ambiguous restores.");
        if (floors.Any(floor => floor.IsArchived && floor.ArchivedUtc is null)) AddError(errors, "Calendar.Floors.ArchiveState", "Archived Floors require an archive timestamp.");
        if (floors.Any(floor => !floor.IsArchived && floor.ArchivedUtc is not null)) AddError(errors, "Calendar.Floors.ArchiveState", "Active Floors must not carry an archive timestamp.");
        if (floors.Any(floor => floor.IsArchived && floor.IsEnabled)) AddError(errors, "Calendar.Floors.ArchiveState", "Archived Floors must not be enabled.");

        foreach (var roomGroup in rooms.GroupBy(room => room.FloorId))
        {
            if (roomGroup.GroupBy(room => room.SortOrder).Any(group => group.Count() > 1)) AddError(errors, "Calendar.Rooms.SortOrder", "Room sort orders must be unique within each Floor.");
            if (!IsContiguous(roomGroup.Select(room => room.SortOrder))) AddError(errors, "Calendar.Rooms.SortOrder", "Room sort orders must be contiguous within each Floor starting at zero.");
            if (roomGroup.GroupBy(room => room.Name.Trim(), StringComparer.Ordinal).Any(group => group.Count() > 1)) AddError(errors, "Calendar.Rooms.Name", "Room names must be unique within a Floor across active and archived records to avoid ambiguous restores.");
        }

        foreach (var room in rooms)
        {
            if (!Enum.TryParse<RoomType>(room.RoomType, true, out _)) AddError(errors, "Calendar.Rooms.RoomType", "RoomType must be one of the supported RoomType values and is never silently mapped to Other.");
            if (room.IsArchived && room.ArchivedUtc is null) AddError(errors, "Calendar.Rooms.ArchiveState", "Archived Rooms require an archive timestamp.");
            if (!room.IsArchived && room.ArchivedUtc is not null) AddError(errors, "Calendar.Rooms.ArchiveState", "Active Rooms must not carry an archive timestamp.");
            if (room.IsArchived && room.IsEnabled) AddError(errors, "Calendar.Rooms.ArchiveState", "Archived Rooms must not be enabled.");
            if (floorById.TryGetValue(room.FloorId, out var floor) && (floor.IsArchived || !floor.IsEnabled) && !room.IsArchived) AddError(errors, "Calendar.Rooms.FloorState", "Active Rooms cannot be restored into archived or inactive Floors.");
        }

        var familyMemberIds = rooms.Select(room => room.FamilyMemberId?.Trim()).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct(StringComparer.Ordinal).ToList();
        if (familyMemberIds.Count > 0)
        {
            var validFamilyMemberIds = await dbContext.FamilyMembers.AsNoTracking()
                .Where(member => member.HouseholdId == SeedHousehold.Id && !member.IsDeleted && familyMemberIds.Contains(member.Id))
                .Select(member => member.Id)
                .ToListAsync(cancellationToken);
            var validFamilyMemberIdSet = validFamilyMemberIds.ToHashSet(StringComparer.Ordinal);
            foreach (var missingId in familyMemberIds.Where(id => !validFamilyMemberIdSet.Contains(id!)))
            {
                AddError(errors, "Calendar.Rooms.FamilyMemberId", $"Room FamilyMember reference '{missingId}' must point to an active FamilyMember in the local household.");
            }
        }

        return ToArrayDictionary(errors);
    }

    private sealed record StagedFloorPlanAssetContent(string MediaType, byte[] DerivativeBytes, int? SourceWidth, int? SourceHeight, decimal BasisWidth, decimal BasisHeight, string Summary);

    private static Dictionary<string, string[]> ValidateFloorPlanAssetGraph(CalendarExportDocument document)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        var assets = document.Calendar.FloorPlanAssets;
        if (assets is null) return new Dictionary<string, string[]>();
        var floorIds = (document.Calendar.Floors ?? []).Select(floor => floor.Id).ToHashSet();
        if (document.Calendar.Floors is null) return new Dictionary<string, string[]>();
        if (assets.Any(asset => asset.Id == Guid.Empty || asset.FloorId == Guid.Empty)) AddError(errors, "Calendar.FloorPlanAssets.Id", "Floor-plan assets require non-empty asset and Floor identifiers.");
        if (assets.GroupBy(asset => asset.Id).Any(group => group.Count() > 1)) AddError(errors, "Calendar.FloorPlanAssets.Id", "Floor-plan asset identifiers must be unique.");
        if (assets.Any(asset => !floorIds.Contains(asset.FloorId))) AddError(errors, "Calendar.FloorPlanAssets.FloorId", "Every floor-plan asset must reference a restored Floor.");
        if (assets.Any(asset => string.IsNullOrWhiteSpace(asset.OriginalFilename) || string.IsNullOrWhiteSpace(asset.DetectedMediaType) || string.IsNullOrWhiteSpace(asset.ContentHash))) AddError(errors, "Calendar.FloorPlanAssets.Required", "Floor-plan assets require filename, media type, and hash metadata.");
        if (assets.Any(asset => !Enum.TryParse<FloorPlanAssetState>(asset.State, true, out _))) AddError(errors, "Calendar.FloorPlanAssets.State", "Floor-plan asset lifecycle state must be supported.");
        if (assets.Any(asset => !Enum.TryParse<FloorPlanAssetAvailability>(asset.SourceAvailability, true, out _) || !Enum.TryParse<FloorPlanAssetAvailability>(asset.DerivativeAvailability, true, out _))) AddError(errors, "Calendar.FloorPlanAssets.Availability", "Floor-plan asset availability state must be supported.");
        if (assets.Any(asset => asset.CoordinateBasisWidth <= 0 || asset.CoordinateBasisHeight <= 0 || asset.AspectRatio <= 0)) AddError(errors, "Calendar.FloorPlanAssets.Dimensions", "Floor-plan asset coordinate basis and aspect ratio must be positive.");
        var ids = assets.Select(asset => asset.Id).ToHashSet();
        if (assets.Any(asset => asset.ReplacementOfAssetId == asset.Id)) AddError(errors, "Calendar.FloorPlanAssets.Replacement", "Floor-plan assets cannot replace themselves.");
        if (assets.Any(asset => asset.ReplacementOfAssetId is not null && !ids.Contains(asset.ReplacementOfAssetId.Value))) AddError(errors, "Calendar.FloorPlanAssets.Replacement", "Replacement references must point to a retained asset in the same restore payload.");
        if (assets.GroupBy(asset => $"{asset.FloorId:N}:{asset.State}", StringComparer.OrdinalIgnoreCase).Any(group => group.Key.EndsWith(":" + FloorPlanAssetState.Active, StringComparison.OrdinalIgnoreCase) && group.Count() > 1)) AddError(errors, "Calendar.FloorPlanAssets.Active", "Only one Active floor-plan asset may be restored per Floor.");
        foreach (var asset in assets)
        {
            if (HasReplacementCycle(asset, assets)) AddError(errors, "Calendar.FloorPlanAssets.Replacement", "Replacement relationships cannot form cycles.");
        }
        return ToArrayDictionary(errors);
    }

    private static bool HasReplacementCycle(CalendarExportFloorPlanAsset start, IReadOnlyCollection<CalendarExportFloorPlanAsset> assets)
    {
        var byId = assets.ToDictionary(asset => asset.Id);
        var seen = new HashSet<Guid>();
        var current = start;
        while (current.ReplacementOfAssetId is Guid next)
        {
            if (!seen.Add(next)) return true;
            if (!byId.TryGetValue(next, out current!)) return false;
        }
        return false;
    }

    private static Dictionary<Guid, StagedFloorPlanAssetContent> StageFloorPlanAssetContent(CalendarExportDocument document, FloorPlanAssetService floorPlanAssetService, out Dictionary<string, string[]> errors)
    {
        var staged = new Dictionary<Guid, StagedFloorPlanAssetContent>();
        var errorLists = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        if (document.Calendar.FloorPlanAssets is null)
        {
            errors = new Dictionary<string, string[]>();
            return staged;
        }
        foreach (var asset in document.Calendar.FloorPlanAssets)
        {
            if (string.IsNullOrWhiteSpace(asset.DerivativeContentBase64))
            {
                if (string.Equals(asset.State, FloorPlanAssetState.Active.ToString(), StringComparison.OrdinalIgnoreCase)) AddError(errorLists, "Calendar.FloorPlanAssets.Derivative", "Active floor-plan assets require restorable safe derivative content.");
                continue;
            }
            byte[] bytes;
            try { bytes = Convert.FromBase64String(asset.DerivativeContentBase64); }
            catch { AddError(errorLists, "Calendar.FloorPlanAssets.Derivative", "Floor-plan derivative payload must be valid base64."); continue; }
            try
            {
                var validated = floorPlanAssetService.ValidateDerivativeBytes(bytes, asset.OriginalFilename);
                if (!string.Equals(validated.MediaType, asset.DetectedMediaType, StringComparison.OrdinalIgnoreCase)) AddError(errorLists, "Calendar.FloorPlanAssets.MediaType", "Floor-plan derivative media type must match metadata.");
                if (!string.IsNullOrWhiteSpace(asset.DerivativeContentHash) && !string.Equals(validated.Hash, asset.DerivativeContentHash.Trim(), StringComparison.OrdinalIgnoreCase)) AddError(errorLists, "Calendar.FloorPlanAssets.Hash", "Floor-plan derivative hash does not match backup metadata.");
                if (validated.BasisWidth != asset.CoordinateBasisWidth || validated.BasisHeight != asset.CoordinateBasisHeight) AddError(errorLists, "Calendar.FloorPlanAssets.Dimensions", "Floor-plan derivative dimensions do not match backup metadata.");
                staged[asset.Id] = new StagedFloorPlanAssetContent(validated.MediaType, validated.DerivativeBytes, validated.SourceWidth, validated.SourceHeight, validated.BasisWidth, validated.BasisHeight, validated.Summary);
            }
            catch (InvalidOperationException)
            {
                AddError(errorLists, "Calendar.FloorPlanAssets.Derivative", "Floor-plan derivative content is invalid or unsafe.");
            }
        }
        errors = ToArrayDictionary(errorLists);
        return staged;
    }


    private static async Task<Dictionary<string, string[]>> ValidateClimateMappingPayloadAsync(HomeOpsDbContext dbContext, CalendarExportDocument document, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        var providers = document.Calendar.ClimateProviders;
        var mappings = document.Calendar.RoomClimateSourceMappings;
        if (providers is null && mappings is null) return new Dictionary<string, string[]>();
        if (providers is null) { AddError(errors, "Calendar.ClimateProviders", "Climate providers are required when climate mappings are supplied."); return ToArrayDictionary(errors); }
        if (providers.Any(provider => provider.Id == Guid.Empty || string.IsNullOrWhiteSpace(provider.DisplayName))) AddError(errors, "Calendar.ClimateProviders", "Climate providers require id and display name.");
        if (providers.GroupBy(provider => provider.Id).Any(group => group.Count() > 1)) AddError(errors, "Calendar.ClimateProviders.Id", "Climate provider identifiers must be unique.");
        if (providers.Any(provider => !Enum.TryParse<ProviderType>(provider.ProviderType, true, out _))) AddError(errors, "Calendar.ClimateProviders.ProviderType", "ProviderType must be supported.");
        var providerIds = providers.Select(provider => provider.Id).ToHashSet();
        var maps = mappings ?? [];
        if (maps.Any(mapping => mapping.Id == Guid.Empty || mapping.RoomId == Guid.Empty || mapping.ProviderId == Guid.Empty || string.IsNullOrWhiteSpace(mapping.ExternalSourceId))) AddError(errors, "Calendar.RoomClimateSourceMappings", "Climate mappings require ids, Room, Provider, and external source references.");
        if (maps.GroupBy(mapping => mapping.Id).Any(group => group.Count() > 1)) AddError(errors, "Calendar.RoomClimateSourceMappings.Id", "Climate mapping identifiers must be unique.");
        if (maps.Any(mapping => !providerIds.Contains(mapping.ProviderId))) AddError(errors, "Calendar.RoomClimateSourceMappings.ProviderId", "Every climate mapping must reference a restored Provider.");
        if (maps.Any(mapping => !Enum.TryParse<ClimateSourceRole>(mapping.SourceRole, true, out _))) AddError(errors, "Calendar.RoomClimateSourceMappings.SourceRole", "Climate source role must be supported.");
        if (maps.Any(mapping => mapping.Priority < 0)) AddError(errors, "Calendar.RoomClimateSourceMappings.Priority", "Mapping priority must be zero or greater.");
        if (maps.GroupBy(mapping => new { mapping.RoomId, mapping.SourceRole, mapping.ProviderId, Source = mapping.ExternalSourceId.Trim() }).Any(group => group.Count() > 1)) AddError(errors, "Calendar.RoomClimateSourceMappings.Duplicate", "Duplicate Room/role/provider/source mappings are not allowed.");
        if (maps.Where(mapping => !mapping.IsArchived).GroupBy(mapping => new { mapping.RoomId, mapping.SourceRole, mapping.Priority }).Any(group => group.Count() > 1)) AddError(errors, "Calendar.RoomClimateSourceMappings.Priority", "Active mapping priorities must be unique within a Room and role.");
        if (maps.Any(mapping => mapping.IsArchived && mapping.ArchivedUtc is null)) AddError(errors, "Calendar.RoomClimateSourceMappings.ArchiveState", "Archived mappings require an archive timestamp.");
        if (maps.Any(mapping => !mapping.IsArchived && mapping.ArchivedUtc is not null)) AddError(errors, "Calendar.RoomClimateSourceMappings.ArchiveState", "Active mappings must not carry an archive timestamp.");
        var roomIds = (document.Calendar.Rooms ?? await dbContext.Rooms.AsNoTracking().Where(room => room.HouseholdId == SeedHousehold.Id).Select(room => new CalendarExportRoom(room.Id, room.FloorId, room.Name, room.RoomType.ToString(), room.SortOrder, room.FamilyMemberId, room.IsEnabled, room.IsArchived, room.ArchivedUtc, room.CreatedUtc, room.UpdatedUtc)).ToListAsync(cancellationToken)).Select(room => room.Id).ToHashSet();
        var climateRoomIds = (document.Calendar.RoomClimateConfigurations ?? await dbContext.RoomClimateConfigurations.AsNoTracking().Where(config => config.HouseholdId == SeedHousehold.Id).Select(config => new CalendarExportRoomClimateConfiguration(config.RoomId, config.IsClimateEnabled, config.IsBedtimeRelevant, config.MinimumPreferredTemperatureCelsius, config.MaximumPreferredTemperatureCelsius, config.MinimumPreferredRelativeHumidity, config.MaximumPreferredRelativeHumidity, config.HeatingPolicyIntent.ToString(), config.CreatedUtc, config.UpdatedUtc)).ToListAsync(cancellationToken)).Select(config => config.RoomId).ToHashSet();
        if (maps.Any(mapping => !roomIds.Contains(mapping.RoomId))) AddError(errors, "Calendar.RoomClimateSourceMappings.RoomId", "Every climate mapping must reference an existing or restored Room.");
        if (maps.Any(mapping => !climateRoomIds.Contains(mapping.RoomId))) AddError(errors, "Calendar.RoomClimateSourceMappings.RoomClimateConfiguration", "Every climate mapping Room must have a climate configuration.");
        return ToArrayDictionary(errors);
    }

    private static async Task<Dictionary<string, string[]>> ValidateClimateRoomReferencesAsync(HomeOpsDbContext dbContext, CalendarExportDocument document, CancellationToken cancellationToken)
    {
        var configs = document.Calendar.RoomClimateConfigurations;
        if (configs is null || document.Calendar.Rooms is not null) return new Dictionary<string, string[]>();
        var requestedRoomIds = configs.Select(config => config.RoomId).Distinct().ToList();
        var existingRoomIds = await dbContext.Rooms.AsNoTracking()
            .Where(room => room.HouseholdId == SeedHousehold.Id && requestedRoomIds.Contains(room.Id))
            .Select(room => room.Id)
            .ToListAsync(cancellationToken);
        var existingRoomIdSet = existingRoomIds.ToHashSet();
        return requestedRoomIds.Any(roomId => !existingRoomIdSet.Contains(roomId))
            ? new Dictionary<string, string[]> { ["Calendar.RoomClimateConfigurations.RoomId"] = ["Every climate configuration must reference an existing Room."] }
            : new Dictionary<string, string[]>();
    }

    private static Dictionary<string, string[]> ValidateClimatePayload(CalendarExportDocument document)
    {
        var errors = new Dictionary<string, List<string>>();
        var configs = document.Calendar.RoomClimateConfigurations;
        if (configs is null) return new Dictionary<string, string[]>();
        if (configs.Any(config => config.RoomId == Guid.Empty)) AddError(errors, "Calendar.RoomClimateConfigurations.RoomId", "Room climate configuration RoomId values must be non-empty GUIDs.");
        if (configs.GroupBy(config => config.RoomId).Any(group => group.Count() > 1)) AddError(errors, "Calendar.RoomClimateConfigurations.RoomId", "Only one climate configuration is allowed per Room.");
        var roomIds = (document.Calendar.Rooms ?? []).Select(room => room.Id).ToHashSet();
        if (roomIds.Count == 0) roomIds = configs.Select(config => config.RoomId).ToHashSet();
        if (document.Calendar.Rooms is not null && configs.Any(config => !roomIds.Contains(config.RoomId))) AddError(errors, "Calendar.RoomClimateConfigurations.RoomId", "Every climate configuration must reference a restored Room.");
        foreach (var config in configs)
        {
            if (!Enum.TryParse<HeatingPolicyIntent>(config.HeatingPolicyIntent, true, out var intent)) AddError(errors, "Calendar.RoomClimateConfigurations.HeatingPolicyIntent", "HeatingPolicyIntent must be supported.");
            if (config.IsBedtimeRelevant && !config.IsClimateEnabled) AddError(errors, "Calendar.RoomClimateConfigurations.IsBedtimeRelevant", "Bedtime relevance requires climate to be enabled.");
            ValidateExportRange(errors, config.MinimumPreferredTemperatureCelsius, config.MaximumPreferredTemperatureCelsius, -30m, 60m, "TemperatureRange");
            ValidateExportRange(errors, config.MinimumPreferredRelativeHumidity, config.MaximumPreferredRelativeHumidity, 0m, 100m, "HumidityRange");
            if (Enum.TryParse<HeatingPolicyIntent>(config.HeatingPolicyIntent, true, out intent) && intent == HeatingPolicyIntent.BoundedControl && (config.MinimumPreferredTemperatureCelsius is null || config.MaximumPreferredTemperatureCelsius is null)) AddError(errors, "Calendar.RoomClimateConfigurations.HeatingPolicyIntent", "Bounded heating control intent requires a temperature comfort policy.");
        }
        return ToArrayDictionary(errors);
    }

    private static void ValidateExportRange(Dictionary<string, List<string>> errors, decimal? minimum, decimal? maximum, decimal supportedMinimum, decimal supportedMaximum, string field)
    {
        if (minimum is null && maximum is null) return;
        if (minimum is null || maximum is null) { AddError(errors, $"Calendar.RoomClimateConfigurations.{field}", $"{field} requires both minimum and maximum values."); return; }
        if (minimum < supportedMinimum || maximum > supportedMaximum) AddError(errors, $"Calendar.RoomClimateConfigurations.{field}", $"{field} values are outside supported bounds.");
        if (minimum >= maximum) AddError(errors, $"Calendar.RoomClimateConfigurations.{field}", $"{field} minimum must be lower than maximum.");
    }

    private static void AddError(Dictionary<string, List<string>> errors, string key, string message)
    {
        if (!errors.TryGetValue(key, out var messages))
        {
            messages = [];
            errors[key] = messages;
        }
        messages.Add(message);
    }

    private static Dictionary<string, string[]> ToArrayDictionary(Dictionary<string, List<string>> errors) =>
        errors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray(), StringComparer.Ordinal);

    private static bool IsContiguous(IEnumerable<int> orders)
    {
        var ordered = orders.Order().ToArray();
        for (var index = 0; index < ordered.Length; index++)
        {
            if (ordered[index] != index) return false;
        }
        return true;
    }

    private static Dictionary<string, string[]> Validate(CalendarExportDocument? document)
    {
        var errors = new Dictionary<string, string[]>();
        if (document is null) return new() { ["document"] = ["Calendar export document is required."] };
        var household = document.Household;
        var calendar = document.Calendar;
        if (household is null) errors[nameof(document.Household)] = ["Household metadata is required."];
        if (calendar is null) errors[nameof(document.Calendar)] = ["Calendar payload is required."];
        if (errors.Count > 0) return errors;

        if (document.Format != CalendarExportDocument.CurrentFormat) errors[nameof(document.Format)] = ["Unsupported calendar export format."];
        if (document.SchemaVersion != CalendarExportDocument.CurrentSchemaVersion) errors[nameof(document.SchemaVersion)] = ["Unsupported calendar export schema version."];
        if (calendar!.Version != CalendarExportPayload.CurrentVersion) errors["Calendar.Version"] = ["Unsupported calendar export payload version."];
        if (!IsValidTimeZone(household!.TimeZoneId)) errors["Household.TimeZoneId"] = ["Household timezone is invalid."];
        var eventSources = calendar.EventSources;
        var eventSeries = calendar.EventSeries;
        var recurrence = calendar.Recurrence;
        var exceptions = calendar.Exceptions;
        var documentMetadata = document.Metadata;
        var calendarMetadata = calendar.Metadata;
        if (eventSources is null) errors["Calendar.EventSources"] = ["Event sources are required."];
        if (eventSeries is null) errors["Calendar.EventSeries"] = ["EventSeries records are required."];
        if (recurrence is null) errors["Calendar.Recurrence"] = ["Recurrence section is required for V1 contract stability."];
        if (exceptions is null) errors["Calendar.Exceptions"] = ["EventException collection is required."];
        if (documentMetadata is null) errors["Metadata"] = ["Document metadata section is required for V1 contract stability."];
        if (calendarMetadata is null) errors["Calendar.Metadata"] = ["Calendar metadata section is required for V1 contract stability."];
        if (errors.Count > 0) return errors;

        var requiredEventSources = eventSources!;
        var requiredEventSeries = eventSeries!;
        var requiredRecurrence = recurrence!;
        var requiredExceptions = exceptions!;
        var sourceIds = requiredEventSources.Select(source => source.Id).ToHashSet();
        var seriesIds = requiredEventSeries.Select(series => series.Id).ToHashSet();
        if (household!.Id == Guid.Empty) errors["Household.Id"] = ["Household identifier is required."];
        if (household.Id != SeedHousehold.Id) errors["Household.Id"] = ["Calendar restore only supports the local seeded household."];
        if (sourceIds.Count != requiredEventSources.Count) errors["Calendar.EventSources"] = ["Event source identifiers must be unique."];
        if (seriesIds.Count != requiredEventSeries.Count) errors["Calendar.EventSeries"] = ["EventSeries identifiers must be unique."];
        if (requiredEventSources.Any(source => source.Id == Guid.Empty || string.IsNullOrWhiteSpace(source.Name) || string.IsNullOrWhiteSpace(source.SourceType))) errors["Calendar.EventSources.Required"] = ["Event sources require id, name, and source type."];
        if (requiredEventSources.Count(source => (source.IsSystem ?? string.Equals(NormalizeSourceType(source.SourceType), EventSourceTypes.Manual, StringComparison.Ordinal)) && string.Equals(NormalizeSourceType(source.SourceType), EventSourceTypes.Manual, StringComparison.Ordinal)) != 1) errors["Calendar.EventSources.SystemManual"] = ["Exactly one protected system manual source is required."];
        if (requiredEventSources.Any(source => (source.IsSystem ?? false) && (!string.Equals(NormalizeSourceType(source.SourceType), EventSourceTypes.Manual, StringComparison.Ordinal) || !source.IsWritable))) errors["Calendar.EventSources.SystemManual"] = ["The protected system manual source must be a writable manual source."];
        if (requiredEventSources.Any(source => (source.IsSystem ?? string.Equals(NormalizeSourceType(source.SourceType), EventSourceTypes.Manual, StringComparison.Ordinal)) && string.Equals(NormalizeSourceType(source.SourceType), EventSourceTypes.Manual, StringComparison.Ordinal) && source.Id != SeedCalendarEvents.EventSourceId)) errors["Calendar.EventSources.SystemManual"] = ["The protected system manual source identifier cannot be changed."];
        if (requiredEventSources.Any(source => !IsSupportedSourceType(NormalizeSourceType(source.SourceType)))) errors["Calendar.EventSources.SourceType"] = ["Event source type is not supported by calendar restore."];
        if (requiredEventSources.Any(source => !IsValidProviderConfiguration(source))) errors["Calendar.EventSources.ProviderConfiguration"] = ["Provider configuration is missing, duplicated, invalid, or does not match the source type."];
        if (requiredEventSeries.Any(series => series.Id == Guid.Empty || string.IsNullOrWhiteSpace(series.Title) || !sourceIds.Contains(series.EventSourceId))) errors["Calendar.EventSeries.Required"] = ["EventSeries records require id, title, and a valid event source reference owned by this export."];
        if (requiredEventSeries.Any(series => series.IsAllDay && (series.StartTime is not null || series.EndTime is not null))) errors["Calendar.EventSeries.AllDay"] = ["All-day EventSeries must not include start or end times."];
        if (requiredEventSeries.Any(series => !series.IsAllDay && (series.StartTime is null || series.EndTime is null))) errors["Calendar.EventSeries.Timed"] = ["Timed EventSeries require start and end times."];
        if (requiredEventSeries.Any(series => series.EndDate < series.StartDate)) errors["Calendar.EventSeries.Range"] = ["EventSeries end date must be on or after start date."];
        if (requiredEventSeries.Any(series => !series.IsAllDay && series.StartDate == series.EndDate && series.EndTime < series.StartTime)) errors["Calendar.EventSeries.TimeRange"] = ["Timed EventSeries end time must be on or after start time on the same date."];
        if (requiredRecurrence.Rules is null) errors["Calendar.Recurrence.Rules"] = ["Recurrence rules collection is required."];
        else if (requiredRecurrence.Rules.Any(rule => !IsSupportedRecurrence(rule))) errors["Calendar.Recurrence"] = ["Recurrence rules must use None, Daily, Weekly, Monthly, or Yearly."];
        if (requiredExceptions.Any(exception => exception.Id == Guid.Empty || exception.EventSeriesId == Guid.Empty || !seriesIds.Contains(exception.EventSeriesId) || exception.OccurrenceDate == default || !IsSupportedExceptionType(exception.ExceptionType))) errors["Calendar.Exceptions.Required"] = ["EventException records require id, supported type, occurrence date, and a valid EventSeries reference owned by this export."];
        if (requiredExceptions.Any(exception => !string.IsNullOrWhiteSpace(exception.OccurrenceKey) && !OccurrenceKey.TryParse(exception.OccurrenceKey, out _))) errors["Calendar.Exceptions.OccurrenceKey"] = ["EventException occurrence keys must be formatted as yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss."];
        if (requiredExceptions.GroupBy(exception => new { exception.EventSeriesId, Key = string.IsNullOrWhiteSpace(exception.OccurrenceKey) ? exception.OccurrenceDate.ToString("O") : exception.OccurrenceKey }).Any(group => group.Count() > 1)) errors["Calendar.Exceptions.OccurrenceKey"] = ["EventException occurrence keys must be unique per EventSeries."];
        if (requiredEventSeries.Any(series => series.Recurrence is not null && !IsSupportedRecurrence(series.Recurrence))) errors["Calendar.EventSeries.Recurrence"] = ["EventSeries recurrence must use None, Daily, Weekly, Monthly, or Yearly and valid Recurrence V2 fields."];
        foreach (var series in requiredEventSeries.Where(series => series.Recurrence is not null && (series.Recurrence.Frequency is not null || IsUnsupportedRecurrence(series.Recurrence))))
        {
            var rule = ToRestoredRecurrenceRule(series.Recurrence);
            if (rule is null)
            {
                continue;
            }

            if (rule.UnsupportedRecurrenceStatus == UnsupportedRecurrenceStatus.Unsupported)
            {
                if (string.IsNullOrWhiteSpace(rule.RawProviderRecurrenceRule)) errors[$"Calendar.EventSeries.{series.Id}.Recurrence"] = ["Unsupported recurrence metadata must preserve the raw provider recurrence rule."];
                continue;
            }

            var validation = ValidateRestoredRecurrenceRule(rule, series.StartDate);
            if (!validation.IsValid) errors[$"Calendar.EventSeries.{series.Id}.Recurrence"] = validation.Errors.ToArray();
        }
        return errors;
    }

    private static RecurrenceType ParseRecurrenceType(CalendarExportRecurrence? recurrence) => Enum.TryParse<RecurrenceType>(recurrence?.RuleType, true, out var value) ? value : RecurrenceType.None;

    private static EventSourcePollInterval ParsePollInterval(string? pollInterval) => Enum.TryParse<EventSourcePollInterval>(pollInterval, true, out var value) ? value : EventSourcePollInterval.Every8Hours;

    private static string NormalizeSourceType(string sourceType) => string.Equals(sourceType.Trim(), "manual", StringComparison.OrdinalIgnoreCase) ? EventSourceTypes.Manual : sourceType.Trim();

    private static bool IsSupportedRecurrence(CalendarExportRecurrence? recurrence)
    {
        if (recurrence is null) return false;
        if (recurrence.Frequency is null)
        {
            return IsUnsupportedRecurrence(recurrence) || Enum.TryParse<RecurrenceType>(recurrence.RuleType, true, out _);
        }

        return Enum.TryParse<RecurrenceFrequency>(recurrence.Frequency, true, out _)
            && (recurrence.EndMode is null || Enum.TryParse<RecurrenceEndMode>(recurrence.EndMode, true, out _))
            && (recurrence.UnsupportedRecurrenceStatus is null || Enum.TryParse<UnsupportedRecurrenceStatus>(recurrence.UnsupportedRecurrenceStatus, true, out _));
    }

    private static bool IsUnsupportedRecurrence(CalendarExportRecurrence recurrence) =>
        string.Equals(recurrence.UnsupportedRecurrenceStatus, nameof(UnsupportedRecurrenceStatus.Unsupported), StringComparison.OrdinalIgnoreCase);

    private static RecurrenceValidationResult ValidateRestoredRecurrenceRule(EventRecurrenceRule rule, DateOnly firstOccurrenceDate)
    {
        if (rule.EndMode == RecurrenceEndMode.OnDate && rule.UntilDate < firstOccurrenceDate)
        {
            var validationRule = new EventRecurrenceRule
            {
                Frequency = rule.Frequency,
                Interval = rule.Interval,
                EndMode = rule.EndMode,
                UntilDate = firstOccurrenceDate,
                Count = rule.Count,
                WeeklyDays = rule.WeeklyDays,
                MonthlyDayOfMonth = rule.MonthlyDayOfMonth,
                YearlyMonth = rule.YearlyMonth,
                YearlyDayOfMonth = rule.YearlyDayOfMonth,
                RawProviderRecurrenceRule = rule.RawProviderRecurrenceRule,
                UnsupportedRecurrenceStatus = rule.UnsupportedRecurrenceStatus,
                UnsupportedRecurrenceReason = rule.UnsupportedRecurrenceReason,
            };
            return EventRecurrenceRuleValidation.Validate(validationRule, firstOccurrenceDate);
        }

        return EventRecurrenceRuleValidation.Validate(rule, firstOccurrenceDate);
    }


    private static bool IsSupportedSourceType(string sourceType) => sourceType is EventSourceTypes.Manual or EventSourceTypes.ICalFeed or EventSourceTypes.ICalFile or EventSourceTypes.GoogleCalendar or EventSourceTypes.CalDav or EventSourceTypes.Exchange or EventSourceTypes.SchoolHolidays or EventSourceTypes.TvSeries or EventSourceTypes.Provider;

    private static bool IsValidProviderConfiguration(CalendarExportEventSource source)
    {
        var sourceType = NormalizeSourceType(source.SourceType);
        var configuration = source.ProviderConfiguration;
        if (sourceType == EventSourceTypes.Manual) return configuration is null;
        if (configuration is null) return false;
        if (!string.Equals(configuration.ProviderType, sourceType, StringComparison.Ordinal)) return false;

        return sourceType switch
        {
            EventSourceTypes.ICalFeed => configuration.ICalFeed is not null && configuration.ICalFile is null && !string.IsNullOrWhiteSpace(configuration.ICalFeed.FeedUrl) && Uri.TryCreate(configuration.ICalFeed.FeedUrl, UriKind.Absolute, out _),
            EventSourceTypes.ICalFile => configuration.ICalFile is not null && configuration.ICalFeed is null && !string.IsNullOrWhiteSpace(configuration.ICalFile.FileReference) && !string.IsNullOrWhiteSpace(configuration.ICalFile.OriginalFilename) && !string.IsNullOrWhiteSpace(configuration.ICalFile.ContentHash),
            _ => configuration.ICalFeed is null && configuration.ICalFile is null,
        };
    }

    private static bool IsSupportedExceptionType(string? exceptionType) => string.Equals(exceptionType, "Skipped", StringComparison.OrdinalIgnoreCase) || string.Equals(exceptionType, "Modified", StringComparison.OrdinalIgnoreCase);

    private static bool IsValidTimeZone(string timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId)) return false;
        try { _ = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId); return true; }
        catch (TimeZoneNotFoundException) { return false; }
        catch (InvalidTimeZoneException) { return false; }
    }
}

public sealed record CalendarRestoreResult(bool Succeeded, IReadOnlyDictionary<string, string[]> ValidationErrors);
