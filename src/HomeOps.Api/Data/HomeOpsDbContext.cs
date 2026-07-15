using System.Text.Json;
using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.KnownPeople;
using HomeOps.Api.Motivation;
using HomeOps.Api.WidgetLayouts;
using HomeOps.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Data;

public sealed class HomeOpsDbContext(DbContextOptions<HomeOpsDbContext> options) : DbContext(options)
{
    public DbSet<AgendaLayerSetting> AgendaLayerSettings => Set<AgendaLayerSetting>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<Lists.List> Lists => Set<Lists.List>();
    public DbSet<ListItem> ListItems => Set<ListItem>();
    public DbSet<ShoppingPurchaseHistory> ShoppingPurchaseHistories => Set<ShoppingPurchaseHistory>();
    public DbSet<CalendarEvents.EventSource> EventSources => Set<CalendarEvents.EventSource>();
    public DbSet<EventSeries> EventSeries => Set<EventSeries>();
    public DbSet<EventException> EventExceptions => Set<EventException>();
    public DbSet<ICalFeedSourceConfiguration> ICalFeedSourceConfigurations => Set<ICalFeedSourceConfiguration>();
    public DbSet<ICalFileSourceConfiguration> ICalFileSourceConfigurations => Set<ICalFileSourceConfiguration>();
    public DbSet<WorkspaceLayout> WorkspaceLayouts => Set<WorkspaceLayout>();
    public DbSet<WidgetPlacement> WidgetPlacements => Set<WidgetPlacement>();
    public DbSet<HouseholdTask> HouseholdTasks => Set<HouseholdTask>();
    public DbSet<RecurringTaskSeries> RecurringTaskSeries => Set<RecurringTaskSeries>();
    public DbSet<TaskTemplate> TaskTemplates => Set<TaskTemplate>();
    public DbSet<TaskTemplateItem> TaskTemplateItems => Set<TaskTemplateItem>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<KnownPerson> KnownPeople => Set<KnownPerson>();
    public DbSet<MotivationFamilyGoal> MotivationFamilyGoals => Set<MotivationFamilyGoal>();
    public DbSet<MotivationIndividualGoal> MotivationIndividualGoals => Set<MotivationIndividualGoal>();
    public DbSet<HelpfulMoment> HelpfulMoments => Set<HelpfulMoment>();
    public DbSet<Floor> Floors => Set<Floor>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomClimateConfiguration> RoomClimateConfigurations => Set<RoomClimateConfiguration>();
    public DbSet<ClimateProvider> ClimateProviders => Set<ClimateProvider>();
    public DbSet<RoomClimateSourceMapping> RoomClimateSourceMappings => Set<RoomClimateSourceMapping>();
    public DbSet<FloorPlanAsset> FloorPlanAssets => Set<FloorPlanAsset>();
    public DbSet<RoomOverlay> RoomOverlays => Set<RoomOverlay>();
    public DbSet<FloorPlanReplacementReview> FloorPlanReplacementReviews => Set<FloorPlanReplacementReview>();
    public DbSet<FloorPlanReplacementReviewItem> FloorPlanReplacementReviewItems => Set<FloorPlanReplacementReviewItem>();
    public DbSet<RoomClimateObservation> RoomClimateObservations => Set<RoomClimateObservation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);




        modelBuilder.Entity<Floor>(entity =>
        {
            entity.ToTable("Floors");
            entity.HasKey(floor => floor.Id);
            entity.Property(floor => floor.Name).HasMaxLength(160).IsRequired();
            entity.Property(floor => floor.SortOrder).IsRequired();
            entity.Property(floor => floor.IsEnabled).IsRequired();
            entity.Property(floor => floor.IsArchived).IsRequired();
            entity.Property(floor => floor.ArchivedUtc);
            entity.Property(floor => floor.CreatedUtc).IsRequired();
            entity.Property(floor => floor.UpdatedUtc).IsRequired();
            entity.HasOne(floor => floor.Household).WithMany().HasForeignKey(floor => floor.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(floor => new { floor.HouseholdId, floor.IsArchived, floor.SortOrder });
            entity.HasIndex(floor => new { floor.HouseholdId, floor.Name }).IsUnique().HasFilter("\"IsArchived\" = false");
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.ToTable("Rooms");
            entity.HasKey(room => room.Id);
            entity.Property(room => room.Name).HasMaxLength(160).IsRequired();
            entity.Property(room => room.RoomType).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(room => room.SortOrder).IsRequired();
            entity.Property(room => room.FamilyMemberId).HasMaxLength(120);
            entity.Property(room => room.IsEnabled).IsRequired();
            entity.Property(room => room.IsArchived).IsRequired();
            entity.Property(room => room.ArchivedUtc);
            entity.Property(room => room.CreatedUtc).IsRequired();
            entity.Property(room => room.UpdatedUtc).IsRequired();
            entity.HasOne(room => room.Household).WithMany().HasForeignKey(room => room.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(room => room.Floor).WithMany(floor => floor.Rooms).HasForeignKey(room => room.FloorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(room => room.FamilyMember).WithMany().HasForeignKey(room => room.FamilyMemberId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(room => new { room.FloorId, room.IsArchived, room.SortOrder });
            entity.HasIndex(room => new { room.FloorId, room.Name }).IsUnique().HasFilter("\"IsArchived\" = false");
            entity.HasIndex(room => new { room.HouseholdId, room.FamilyMemberId });
        });

        modelBuilder.Entity<RoomClimateConfiguration>(entity =>
        {
            entity.ToTable("RoomClimateConfigurations");
            entity.HasKey(config => config.RoomId);
            entity.Property(config => config.IsClimateEnabled).IsRequired();
            entity.Property(config => config.IsBedtimeRelevant).IsRequired();
            entity.Property(config => config.MinimumPreferredTemperatureCelsius).HasPrecision(5, 2);
            entity.Property(config => config.MaximumPreferredTemperatureCelsius).HasPrecision(5, 2);
            entity.Property(config => config.MinimumPreferredRelativeHumidity).HasPrecision(5, 2);
            entity.Property(config => config.MaximumPreferredRelativeHumidity).HasPrecision(5, 2);
            entity.Property(config => config.HeatingPolicyIntent).HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(config => config.CreatedUtc).IsRequired();
            entity.Property(config => config.UpdatedUtc).IsRequired();
            entity.HasOne(config => config.Household).WithMany().HasForeignKey(config => config.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(config => config.Room).WithOne().HasForeignKey<RoomClimateConfiguration>(config => config.RoomId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(config => config.HouseholdId);
        });



        modelBuilder.Entity<ClimateProvider>(entity =>
        {
            entity.ToTable("ClimateProviders");
            entity.HasKey(provider => provider.Id);
            entity.Property(provider => provider.ProviderType).HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(provider => provider.DisplayName).HasMaxLength(160).IsRequired();
            entity.Property(provider => provider.IsEnabled).IsRequired();
            entity.Property(provider => provider.IsArchived).IsRequired();
            entity.Property(provider => provider.ArchivedUtc);
            entity.Property(provider => provider.ExternalInstanceReference).HasMaxLength(240);
            entity.Property(provider => provider.DiagnosticMetadata).HasMaxLength(2000);
            entity.Property(provider => provider.CreatedUtc).IsRequired();
            entity.Property(provider => provider.UpdatedUtc).IsRequired();
            entity.HasOne(provider => provider.Household).WithMany().HasForeignKey(provider => provider.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(provider => new { provider.HouseholdId, provider.IsArchived, provider.DisplayName });
            entity.HasIndex(provider => new { provider.HouseholdId, provider.DisplayName }).IsUnique().HasFilter("\"IsArchived\" = false");
        });

        modelBuilder.Entity<RoomClimateSourceMapping>(entity =>
        {
            entity.ToTable("RoomClimateSourceMappings");
            entity.HasKey(mapping => mapping.Id);
            entity.Property(mapping => mapping.SourceRole).HasConversion<string>().HasMaxLength(64).IsRequired();
            entity.Property(mapping => mapping.ExternalSourceId).HasMaxLength(240).IsRequired();
            entity.Property(mapping => mapping.ExternalDisplayName).HasMaxLength(240);
            entity.Property(mapping => mapping.ExternalSourceKind).HasMaxLength(80);
            entity.Property(mapping => mapping.ExternalAreaId).HasMaxLength(160);
            entity.Property(mapping => mapping.ExternalAreaName).HasMaxLength(160);
            entity.Property(mapping => mapping.ExternalDeviceId).HasMaxLength(160);
            entity.Property(mapping => mapping.ExternalDeviceName).HasMaxLength(160);
            entity.Property(mapping => mapping.Priority).IsRequired();
            entity.Property(mapping => mapping.IsEnabled).IsRequired();
            entity.Property(mapping => mapping.IsArchived).IsRequired();
            entity.Property(mapping => mapping.ArchivedUtc);
            entity.Property(mapping => mapping.Health).HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(mapping => mapping.LastCheckedUtc);
            entity.Property(mapping => mapping.LastSuccessfulUtc);
            entity.Property(mapping => mapping.DiagnosticSummary).HasMaxLength(500);
            entity.Property(mapping => mapping.CreatedUtc).IsRequired();
            entity.Property(mapping => mapping.UpdatedUtc).IsRequired();
            entity.HasOne(mapping => mapping.Household).WithMany().HasForeignKey(mapping => mapping.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(mapping => mapping.Room).WithMany().HasForeignKey(mapping => mapping.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(mapping => mapping.Provider).WithMany().HasForeignKey(mapping => mapping.ProviderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(mapping => new { mapping.RoomId, mapping.SourceRole, mapping.IsArchived, mapping.Priority });
            entity.HasIndex(mapping => new { mapping.ProviderId, mapping.ExternalSourceId });
            entity.HasIndex(mapping => new { mapping.RoomId, mapping.SourceRole, mapping.ProviderId, mapping.ExternalSourceId }).IsUnique().HasFilter("\"IsArchived\" = false");
            entity.HasIndex(mapping => new { mapping.RoomId, mapping.SourceRole, mapping.Priority }).IsUnique().HasFilter("\"IsArchived\" = false");
        });




        modelBuilder.Entity<RoomClimateObservation>(entity =>
        {
            entity.ToTable("RoomClimateObservations");
            entity.HasKey(observation => observation.Id);
            entity.Property(observation => observation.TemperatureCelsius).HasPrecision(5, 2);
            entity.Property(observation => observation.RelativeHumidity).HasPrecision(5, 2);
            entity.Property(observation => observation.TargetTemperatureCelsius).HasPrecision(5, 2);
            entity.Property(observation => observation.OperatingState).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(observation => observation.IsProviderAvailable).IsRequired();
            entity.Property(observation => observation.SourceReference).HasMaxLength(240);
            entity.Property(observation => observation.StatusDetail).HasMaxLength(500);
            entity.Property(observation => observation.ObservedUtc).IsRequired();
            entity.Property(observation => observation.ReceivedUtc).IsRequired();
            entity.Property(observation => observation.CreatedUtc).IsRequired();
            entity.Property(observation => observation.UpdatedUtc).IsRequired();
            entity.HasOne(observation => observation.Household).WithMany().HasForeignKey(observation => observation.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(observation => observation.Room).WithMany().HasForeignKey(observation => observation.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(observation => observation.SourceMapping).WithMany().HasForeignKey(observation => observation.SourceMappingId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(observation => observation.Provider).WithMany().HasForeignKey(observation => observation.ProviderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(observation => new { observation.HouseholdId, observation.RoomId });
            entity.HasIndex(observation => new { observation.HouseholdId, observation.ReceivedUtc });
            entity.HasIndex(observation => new { observation.RoomId, observation.SourceMappingId }).IsUnique();
        });

        modelBuilder.Entity<FloorPlanAsset>(entity =>
        {
            entity.ToTable("FloorPlanAssets");
            entity.HasKey(asset => asset.Id);
            entity.Property(asset => asset.OriginalFilename).HasMaxLength(160).IsRequired();
            entity.Property(asset => asset.DetectedMediaType).HasMaxLength(80).IsRequired();
            entity.Property(asset => asset.ContentHash).HasMaxLength(128).IsRequired();
            entity.Property(asset => asset.SourceContentReference).HasMaxLength(500).IsRequired();
            entity.Property(asset => asset.DerivativeContentReference).HasMaxLength(500).IsRequired();
            entity.Property(asset => asset.CoordinateBasisWidth).HasPrecision(12, 2).IsRequired();
            entity.Property(asset => asset.CoordinateBasisHeight).HasPrecision(12, 2).IsRequired();
            entity.Property(asset => asset.AspectRatio).HasPrecision(12, 6).IsRequired();
            entity.Property(asset => asset.State).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(asset => asset.ValidationSummary).HasMaxLength(1000);
            entity.Property(asset => asset.SourceAvailability).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(asset => asset.DerivativeAvailability).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(asset => asset.UploadedUtc).IsRequired();
            entity.Property(asset => asset.CreatedUtc).IsRequired();
            entity.Property(asset => asset.UpdatedUtc).IsRequired();
            entity.HasOne(asset => asset.Household).WithMany().HasForeignKey(asset => asset.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(asset => asset.Floor).WithMany().HasForeignKey(asset => asset.FloorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(asset => asset.ReplacementOfAsset).WithMany().HasForeignKey(asset => asset.ReplacementOfAssetId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(asset => new { asset.FloorId, asset.State });
            entity.HasIndex(asset => new { asset.HouseholdId, asset.ContentHash });
            entity.HasIndex(asset => new { asset.FloorId, asset.State }).IsUnique().HasFilter("\"State\" = 'Active'");
        });


        modelBuilder.Entity<RoomOverlay>(entity =>
        {
            entity.ToTable("RoomOverlays");
            entity.HasKey(overlay => overlay.Id);
            entity.Property(overlay => overlay.State).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(overlay => overlay.PolygonJson).HasColumnType("jsonb").IsRequired();
            entity.Property(overlay => overlay.LabelAnchorX).HasPrecision(18, 12);
            entity.Property(overlay => overlay.LabelAnchorY).HasPrecision(18, 12);
            entity.Property(overlay => overlay.ArchivedUtc);
            entity.Property(overlay => overlay.CreatedUtc).IsRequired();
            entity.Property(overlay => overlay.UpdatedUtc).IsRequired();
            entity.HasOne(overlay => overlay.Household).WithMany().HasForeignKey(overlay => overlay.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(overlay => overlay.Room).WithMany().HasForeignKey(overlay => overlay.RoomId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(overlay => overlay.Floor).WithMany().HasForeignKey(overlay => overlay.FloorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(overlay => overlay.FloorPlanAsset).WithMany().HasForeignKey(overlay => overlay.FloorPlanAssetId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(overlay => new { overlay.FloorId, overlay.FloorPlanAssetId, overlay.State });
            entity.HasIndex(overlay => new { overlay.RoomId, overlay.FloorPlanAssetId, overlay.State });
            entity.HasIndex(overlay => new { overlay.RoomId, overlay.FloorPlanAssetId }).IsUnique().HasFilter("\"State\" = 'Trusted'");
        });

        modelBuilder.Entity<FloorPlanReplacementReview>(entity =>
        {
            entity.ToTable("FloorPlanReplacementReviews");
            entity.HasKey(review => review.Id);
            entity.Property(review => review.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(review => review.SameCoordinateBasisDimensions).IsRequired();
            entity.Property(review => review.SameAspectRatio).IsRequired();
            entity.Property(review => review.SameDerivativeBasis).IsRequired();
            entity.Property(review => review.ReuseCandidatesAvailable).IsRequired();
            entity.Property(review => review.CreatedUtc).IsRequired();
            entity.Property(review => review.UpdatedUtc).IsRequired();
            entity.Property(review => review.CompletedUtc);
            entity.Property(review => review.ActivatedUtc);
            entity.Property(review => review.CancelledUtc);
            entity.HasOne(review => review.Household).WithMany().HasForeignKey(review => review.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(review => review.Floor).WithMany().HasForeignKey(review => review.FloorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(review => review.CurrentAsset).WithMany().HasForeignKey(review => review.CurrentAssetId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(review => review.ReplacementAsset).WithMany().HasForeignKey(review => review.ReplacementAssetId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(review => new { review.FloorId, review.Status });
            entity.HasIndex(review => review.ReplacementAssetId);
            entity.HasIndex(review => review.FloorId).IsUnique().HasFilter("\"Status\" IN ('Draft','InReview','ReadyToActivate')");
        });

        modelBuilder.Entity<FloorPlanReplacementReviewItem>(entity =>
        {
            entity.ToTable("FloorPlanReplacementReviewItems");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Disposition).HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(item => item.LabelAnchorApproved).IsRequired();
            entity.Property(item => item.FallbackReason).HasMaxLength(500);
            entity.Property(item => item.CreatedUtc).IsRequired();
            entity.Property(item => item.UpdatedUtc).IsRequired();
            entity.HasOne(item => item.Household).WithMany().HasForeignKey(item => item.HouseholdId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Floor).WithMany().HasForeignKey(item => item.FloorId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Room).WithMany().HasForeignKey(item => item.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Review).WithMany(review => review.Items).HasForeignKey(item => item.ReviewId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.ReuseCandidateOverlay).WithMany().HasForeignKey(item => item.ReuseCandidateOverlayId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.ReplacementOverlay).WithMany().HasForeignKey(item => item.ReplacementOverlayId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(item => new { item.ReviewId, item.RoomId }).IsUnique();
            entity.HasIndex(item => new { item.FloorId, item.RoomId });
        });


        modelBuilder.Entity<AgendaLayerSetting>(entity =>
        {
            entity.ToTable("AgendaLayerSettings");
            entity.HasKey(setting => setting.Id);
            entity.Property(setting => setting.DeviceKey).HasMaxLength(160).IsRequired();
            entity.Property(setting => setting.ViewType).HasMaxLength(40).IsRequired();
            entity.Property(setting => setting.SourceId).HasMaxLength(160).IsRequired();
            entity.Property(setting => setting.IsEnabled).IsRequired();
            entity.Property(setting => setting.CreatedUtc).IsRequired();
            entity.Property(setting => setting.UpdatedUtc).IsRequired();
            entity.HasIndex(setting => new { setting.DeviceKey, setting.ViewType, setting.SourceId }).IsUnique();
        });

        modelBuilder.Entity<Household>(entity =>
        {
            entity.ToTable("Households");
            entity.HasKey(household => household.Id);
            entity.Property(household => household.Name).HasMaxLength(120).IsRequired();
            entity.Property(household => household.TimeZoneId).HasMaxLength(80).IsRequired();
            entity.Property(household => household.OnboardingCompleted).IsRequired();
            entity.Property(household => household.CreatedUtc).IsRequired();
            entity.Property(household => household.UpdatedUtc).IsRequired();
        });

        modelBuilder.Entity<Lists.List>(entity =>
        {
            entity.ToTable("Lists");
            entity.HasKey(list => list.Id);
            entity.Property(list => list.Name).HasMaxLength(160).IsRequired();
            entity.Property(list => list.IsArchived).IsRequired();
            entity.Property(list => list.ArchivedUtc);
            entity.Property(list => list.IsDeleted).IsRequired();
            entity.Property(list => list.DeletedUtc);
            entity.Property(list => list.CreatedUtc).IsRequired();
            entity.Property(list => list.UpdatedUtc).IsRequired();
            entity.HasOne(list => list.Household)
                .WithMany()
                .HasForeignKey(list => list.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(list => new { list.HouseholdId, list.Name }).IsUnique();
        });

        modelBuilder.Entity<ListItem>(entity =>
        {
            entity.ToTable("ListItems", table =>
            {
                table.HasCheckConstraint("CK_ListItems_DecorativeAvatar_NullablePair", "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
            });
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Text).HasMaxLength(240).IsRequired();
            entity.Property(item => item.IsCompleted).IsRequired();
            entity.Property(item => item.CompletedUtc);
            entity.Property(item => item.IsDeleted).IsRequired();
            entity.Property(item => item.DeletedUtc);
            entity.Property(item => item.PreferredStore).HasMaxLength(120);
            entity.Property(item => item.DecorativeAvatarReferenceType).HasConversion<string>().HasMaxLength(32);
            entity.Property(item => item.DecorativeAvatarReferenceId).HasMaxLength(120);
            entity.Property(item => item.CreatedUtc).IsRequired();
            entity.Property(item => item.UpdatedUtc).IsRequired();
            entity.HasOne(item => item.List)
                .WithMany(list => list.Items)
                .HasForeignKey(item => item.ListId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(item => new { item.ListId, item.IsDeleted, item.IsCompleted, item.CreatedUtc });
            entity.HasIndex(item => new { item.DecorativeAvatarReferenceType, item.DecorativeAvatarReferenceId });
        });


        modelBuilder.Entity<ShoppingPurchaseHistory>(entity =>
        {
            entity.ToTable("ShoppingPurchaseHistories");
            entity.HasKey(history => history.Id);
            entity.Property(history => history.NormalizedText).HasMaxLength(240).IsRequired();
            entity.Property(history => history.ItemText).HasMaxLength(240).IsRequired();
            entity.Property(history => history.Store).HasMaxLength(120).IsRequired();
            entity.Property(history => history.PurchaseCount).IsRequired();
            entity.Property(history => history.CreatedUtc).IsRequired();
            entity.Property(history => history.UpdatedUtc).IsRequired();
            entity.HasIndex(history => new { history.HouseholdId, history.NormalizedText, history.Store }).IsUnique();
            entity.HasIndex(history => new { history.HouseholdId, history.NormalizedText, history.PurchaseCount });
        });


        modelBuilder.Entity<CalendarEvents.EventSource>(entity =>
        {
            entity.ToTable("EventSources");
            entity.HasKey(source => source.Id);
            entity.Property(source => source.Name).HasMaxLength(160).IsRequired();
            entity.Property(source => source.SourceType).HasMaxLength(80).IsRequired();
            entity.Property(source => source.Icon).HasMaxLength(16).HasDefaultValue("📅").IsRequired();
            entity.Property(source => source.IsEnabled).HasDefaultValue(true).IsRequired();
            entity.Property(source => source.IsWritable).IsRequired();
            entity.Property(source => source.IsSystem).HasDefaultValue(false).IsRequired();
            entity.Property(source => source.HealthStatus).HasConversion<string>().HasMaxLength(32).HasDefaultValue(EventSourceHealthStatus.Healthy).HasSentinel((EventSourceHealthStatus)(-1)).IsRequired();
            entity.Property(source => source.PollInterval).HasConversion<string>().HasMaxLength(32).HasDefaultValue(EventSourcePollInterval.Every8Hours).HasSentinel((EventSourcePollInterval)(-1)).IsRequired();
            entity.Property(source => source.LastSyncAttemptUtc);
            entity.Property(source => source.LastSuccessfulSyncUtc);
            entity.Property(source => source.LastFailedSyncUtc);
            entity.Property(source => source.NextSyncAfterUtc);
            entity.Property(source => source.LastErrorCode).HasMaxLength(80);
            entity.Property(source => source.LastErrorMessage).HasMaxLength(500);
            entity.Property(source => source.LastErrorDetail).HasMaxLength(2000);
            entity.Property(source => source.ProviderSourceId).HasMaxLength(240);
            entity.Property(source => source.CreatedUtc).IsRequired();
            entity.Property(source => source.UpdatedUtc).IsRequired();
            entity.HasOne(source => source.Household)
                .WithMany()
                .HasForeignKey(source => source.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(source => new { source.HouseholdId, source.IsEnabled, source.HealthStatus });
            entity.HasIndex(source => new { source.HouseholdId, source.SourceType });
            entity.HasIndex(source => new { source.HouseholdId, source.IsSystem }).IsUnique().HasFilter("\"IsSystem\" = true");
            entity.HasIndex(source => source.NextSyncAfterUtc);
        });

        modelBuilder.Entity<EventSeries>(entity =>
        {
            entity.ToTable("EventSeries", table =>
            {
                table.HasCheckConstraint("CK_EventSeries_DecorativeAvatar_NullablePair", "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
            });
            entity.HasKey(eventSeries => eventSeries.Id);
            entity.Property(eventSeries => eventSeries.Title).HasMaxLength(240).IsRequired();
            entity.Property(eventSeries => eventSeries.Description).HasMaxLength(1000);
            entity.Property(eventSeries => eventSeries.Location).HasMaxLength(500);
            entity.Property(eventSeries => eventSeries.DecorativeAvatarReferenceType).HasConversion<string>().HasMaxLength(32);
            entity.Property(eventSeries => eventSeries.DecorativeAvatarReferenceId).HasMaxLength(120);
            entity.Property(eventSeries => eventSeries.ProviderEventId).HasMaxLength(512);
            entity.Property(eventSeries => eventSeries.ProviderInstanceId).HasMaxLength(512);
            entity.Property(eventSeries => eventSeries.ProviderRevision).HasMaxLength(512);
            entity.Property(eventSeries => eventSeries.ContentFingerprint).HasMaxLength(128);
            entity.Property(eventSeries => eventSeries.ImportedAtUtc);
            entity.Property(eventSeries => eventSeries.LastImportedUtc);
            entity.Property(eventSeries => eventSeries.LastSeenSyncAttemptUtc);
            entity.Property(eventSeries => eventSeries.StartDate).HasColumnType("date").IsRequired();
            entity.Property(eventSeries => eventSeries.StartTime).HasColumnType("time without time zone");
            entity.Property(eventSeries => eventSeries.EndDate).HasColumnType("date").IsRequired();
            entity.Property(eventSeries => eventSeries.EndTime).HasColumnType("time without time zone");
            entity.Property(eventSeries => eventSeries.IsAllDay).IsRequired();
            entity.Property(eventSeries => eventSeries.RecurrenceType).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.OwnsOne(eventSeries => eventSeries.RecurrenceRule, rule =>
            {
                rule.Property(recurrence => recurrence.Frequency).HasColumnName("RecurrenceFrequency").HasConversion<string>().HasMaxLength(16);
                rule.Property(recurrence => recurrence.Interval).HasColumnName("RecurrenceInterval");
                rule.Property(recurrence => recurrence.EndMode).HasColumnName("RecurrenceEndMode").HasConversion<string>().HasMaxLength(16);
                rule.Property(recurrence => recurrence.UntilDate).HasColumnName("RecurrenceUntilDate").HasColumnType("date");
                rule.Property(recurrence => recurrence.Count).HasColumnName("RecurrenceCount");
                rule.Property(recurrence => recurrence.WeeklyDays).HasColumnName("RecurrenceWeeklyDays").HasMaxLength(64);
                rule.Property(recurrence => recurrence.MonthlyDayOfMonth).HasColumnName("RecurrenceMonthlyDayOfMonth");
                rule.Property(recurrence => recurrence.YearlyMonth).HasColumnName("RecurrenceYearlyMonth");
                rule.Property(recurrence => recurrence.YearlyDayOfMonth).HasColumnName("RecurrenceYearlyDayOfMonth");
                rule.Property(recurrence => recurrence.RawProviderRecurrenceRule).HasColumnName("RawProviderRecurrenceRule").HasMaxLength(2000);
                rule.Property(recurrence => recurrence.UnsupportedRecurrenceStatus).HasColumnName("UnsupportedRecurrenceStatus").HasConversion<string>().HasMaxLength(32);
                rule.Property(recurrence => recurrence.UnsupportedRecurrenceReason).HasColumnName("UnsupportedRecurrenceReason").HasMaxLength(500);
            });
            entity.Property(eventSeries => eventSeries.CreatedUtc).IsRequired();
            entity.Property(eventSeries => eventSeries.UpdatedUtc).IsRequired();
            entity.HasOne(eventSeries => eventSeries.EventSource)
                .WithMany(source => source.EventSeries)
                .HasForeignKey(eventSeries => eventSeries.EventSourceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(eventSeries => new { eventSeries.EventSourceId, eventSeries.StartDate });
            entity.HasIndex(eventSeries => new { eventSeries.EventSourceId, eventSeries.ProviderEventId })
                .IsUnique()
                .HasFilter("\"ProviderEventId\" IS NOT NULL");
            entity.HasIndex(eventSeries => new { eventSeries.EventSourceId, eventSeries.LastSeenSyncAttemptUtc });
            entity.HasIndex(eventSeries => new { eventSeries.DecorativeAvatarReferenceType, eventSeries.DecorativeAvatarReferenceId });
        });

        modelBuilder.Entity<EventSourceConfiguration>(entity =>
        {
            entity.UseTptMappingStrategy();
            entity.ToTable("EventSourceConfigurations");
            entity.HasKey(configuration => configuration.EventSourceId);
            entity.Property(configuration => configuration.CreatedUtc).IsRequired();
            entity.Property(configuration => configuration.UpdatedUtc).IsRequired();
            entity.HasOne(configuration => configuration.EventSource)
                .WithOne(source => source.Configuration)
                .HasForeignKey<EventSourceConfiguration>(configuration => configuration.EventSourceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ICalFeedSourceConfiguration>(entity =>
        {
            entity.ToTable("ICalFeedSourceConfigurations");
            entity.Property(configuration => configuration.FeedUrl).HasMaxLength(2048).IsRequired();
            entity.Property(configuration => configuration.ETag).HasMaxLength(512);
            entity.Property(configuration => configuration.LastModified).HasMaxLength(256);
            entity.Property(configuration => configuration.LastContentHash).HasMaxLength(128);
        });

        modelBuilder.Entity<ICalFileSourceConfiguration>(entity =>
        {
            entity.ToTable("ICalFileSourceConfigurations");
            entity.Property(configuration => configuration.FileReference).HasMaxLength(1024).IsRequired();
            entity.Property(configuration => configuration.OriginalFilename).HasMaxLength(260).IsRequired();
            entity.Property(configuration => configuration.ContentHash).HasMaxLength(128).IsRequired();
            entity.Property(configuration => configuration.UploadedUtc).IsRequired();
        });

        modelBuilder.Entity<EventException>(entity =>
        {
            entity.ToTable("EventExceptions");
            entity.HasKey(exception => exception.Id);
            entity.Property(exception => exception.OccurrenceDate).HasColumnType("date").IsRequired();
            entity.Property(exception => exception.OccurrenceKey)
                .HasConversion(
                    key => key.Serialize(),
                    value => OccurrenceKey.Parse(value))
                .HasMaxLength(32)
                .IsRequired();
            entity.Property(exception => exception.ExceptionType).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(exception => exception.IsSkipped).IsRequired();
            entity.Property(exception => exception.Title).HasMaxLength(240);
            entity.Property(exception => exception.Description).HasMaxLength(1000);
            entity.Property(exception => exception.Location).HasMaxLength(500);
            entity.Property(exception => exception.IsAllDay);
            entity.Property(exception => exception.StartDate).HasColumnType("date");
            entity.Property(exception => exception.StartTime).HasColumnType("time without time zone");
            entity.Property(exception => exception.EndDate).HasColumnType("date");
            entity.Property(exception => exception.EndTime).HasColumnType("time without time zone");
            entity.Property(exception => exception.RawProviderRecurrenceId).HasMaxLength(512);
            entity.Property(exception => exception.NormalizedProviderRecurrenceId).HasMaxLength(512);
            entity.Property(exception => exception.DetachedProviderEventId).HasMaxLength(512);
            entity.Property(exception => exception.DetachedProviderRevision).HasMaxLength(512);
            entity.Property(exception => exception.DetachedContentFingerprint).HasMaxLength(128);
            entity.Property(exception => exception.RawDetachedRecurrenceMetadata).HasMaxLength(2000);
            entity.Property(exception => exception.CreatedUtc).IsRequired();
            entity.Property(exception => exception.UpdatedUtc).IsRequired();
            entity.HasOne(exception => exception.EventSeries)
                .WithMany(series => series.Exceptions)
                .HasForeignKey(exception => exception.EventSeriesId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(exception => new { exception.EventSeriesId, exception.OccurrenceDate });
            entity.HasIndex(exception => new { exception.EventSeriesId, exception.OccurrenceKey }).IsUnique();
        });


        modelBuilder.Entity<FamilyMember>(entity =>
        {
            entity.ToTable("FamilyMembers");
            entity.HasKey(member => member.Id);
            entity.Property(member => member.Id).HasMaxLength(120);
            entity.Property(member => member.Name).HasMaxLength(120).IsRequired();
            entity.Property(member => member.DisplayColor).HasMaxLength(32).IsRequired();
            entity.Property(member => member.Initials).HasMaxLength(8).IsRequired();
            entity.Property(member => member.MemberKind).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(member => member.DateOfBirth).HasColumnType("date");
            entity.Property(member => member.IsDeleted).IsRequired();
            entity.Property(member => member.DeletedUtc);
            entity.Property(member => member.CreatedUtc).IsRequired();
            entity.Property(member => member.UpdatedUtc).IsRequired();
            entity.OwnsOne(member => member.AvatarV2Config, avatar =>
            {
                avatar.Property(config => config.HeadVariant).HasColumnName("AvatarV2HeadVariant").HasMaxLength(32).IsRequired();
                avatar.Property(config => config.HairStyle).HasColumnName("AvatarV2HairStyle").HasMaxLength(32).IsRequired();
                avatar.Property(config => config.HairColor).HasColumnName("AvatarV2HairColor").HasMaxLength(32).IsRequired();
                avatar.Property(config => config.ClothingStyle).HasColumnName("AvatarV2ClothingStyle").HasMaxLength(32).IsRequired();
                avatar.Property(config => config.ClothingColor).HasColumnName("AvatarV2ClothingColor").HasMaxLength(32).IsRequired();
                avatar.Property(config => config.Accessory).HasColumnName("AvatarV2Accessory").HasMaxLength(32).IsRequired();
                avatar.Property(config => config.AccessoryColor).HasColumnName("AvatarV2AccessoryColor").HasMaxLength(32).IsRequired();
            });
            entity.Property(member => member.AvatarSelection)
                .HasColumnType("jsonb")
                .HasConversion(
                    selection => JsonSerializer.Serialize(selection, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<AvatarSelection>(json, (JsonSerializerOptions?)null) ?? new AvatarSelection());
            entity.HasOne(member => member.Household)
                .WithMany()
                .HasForeignKey(member => member.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(member => new { member.HouseholdId, member.Name });
            entity.HasIndex(member => new { member.HouseholdId, member.IsDeleted, member.Name });
        });



        modelBuilder.Entity<KnownPerson>(entity =>
        {
            entity.ToTable("KnownPeople", table =>
            {
                table.HasCheckConstraint("CK_KnownPeople_Scope_FamilyMember", "(\"Scope\" = 'Shared' AND \"FamilyMemberId\" IS NULL) OR (\"Scope\" = 'PrivateToMember' AND \"FamilyMemberId\" IS NOT NULL)");
            });
            entity.HasKey(person => person.Id);
            entity.Property(person => person.DisplayName).HasMaxLength(160).IsRequired();
            entity.Property(person => person.Nickname).HasMaxLength(80);
            entity.Property(person => person.RelationshipType).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(person => person.CustomRelationshipLabel).HasMaxLength(80);
            entity.Property(person => person.Scope).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(person => person.FamilyMemberId).HasMaxLength(120);
            entity.Property(person => person.Initials).HasMaxLength(8).IsRequired();
            entity.Property(person => person.AvatarSelection)
                .HasColumnType("jsonb")
                .HasConversion(
                    selection => JsonSerializer.Serialize(selection, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<AvatarSelection>(json, (JsonSerializerOptions?)null) ?? new AvatarSelection());
            entity.Property(person => person.IsDeleted).IsRequired();
            entity.Property(person => person.DeletedUtc);
            entity.Property(person => person.CreatedUtc).IsRequired();
            entity.Property(person => person.UpdatedUtc).IsRequired();
            entity.HasOne(person => person.Household)
                .WithMany()
                .HasForeignKey(person => person.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(person => person.FamilyMember)
                .WithMany()
                .HasForeignKey(person => person.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(person => new { person.HouseholdId, person.IsDeleted, person.DisplayName });
            entity.HasIndex(person => new { person.HouseholdId, person.Scope, person.IsDeleted, person.DisplayName });
            entity.HasIndex(person => new { person.HouseholdId, person.FamilyMemberId, person.IsDeleted, person.DisplayName });
            entity.HasIndex(person => new { person.HouseholdId, person.RelationshipType, person.IsDeleted });
        });

        modelBuilder.Entity<RecurringTaskSeries>(entity =>
        {
            entity.ToTable("RecurringTaskSeries", table =>
            {
                table.HasCheckConstraint("CK_RecurringTaskSeries_DecorativeAvatar_NullablePair", "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
            });
            entity.HasKey(series => series.Id);
            entity.Property(series => series.Title).HasMaxLength(240).IsRequired();
            entity.Property(series => series.StartDate).HasColumnType("date").IsRequired();
            entity.Property(series => series.Frequency).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(series => series.OwnershipKind).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(series => series.FamilyMemberId).HasMaxLength(120);
            entity.Property(series => series.DecorativeAvatarReferenceType).HasConversion<string>().HasMaxLength(32);
            entity.Property(series => series.DecorativeAvatarReferenceId).HasMaxLength(120);
            entity.Property(series => series.IsDeleted).IsRequired();
            entity.Property(series => series.CreatedUtc).IsRequired();
            entity.Property(series => series.UpdatedUtc).IsRequired();
            entity.HasOne(series => series.Household)
                .WithMany()
                .HasForeignKey(series => series.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FamilyMember>()
                .WithMany()
                .HasForeignKey(series => series.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(series => new { series.HouseholdId, series.IsDeleted, series.StartDate });
            entity.HasIndex(series => new { series.DecorativeAvatarReferenceType, series.DecorativeAvatarReferenceId });
        });



        modelBuilder.Entity<TaskTemplate>(entity =>
        {
            entity.ToTable("TaskTemplates");
            entity.HasKey(template => template.Id);
            entity.Property(template => template.Name).HasMaxLength(160).IsRequired();
            entity.Property(template => template.Description).HasMaxLength(500);
            entity.Property(template => template.IsArchived).IsRequired();
            entity.Property(template => template.CreatedUtc).IsRequired();
            entity.Property(template => template.UpdatedUtc).IsRequired();
            entity.HasOne(template => template.Household)
                .WithMany()
                .HasForeignKey(template => template.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(template => new { template.HouseholdId, template.IsArchived, template.Name });
        });

        modelBuilder.Entity<TaskTemplateItem>(entity =>
        {
            entity.ToTable("TaskTemplateItems");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Title).HasMaxLength(240).IsRequired();
            entity.Property(item => item.OwnershipKind).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(item => item.FamilyMemberId).HasMaxLength(120);
            entity.Property(item => item.RecurrenceFrequency).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(item => item.DueOffsetDays);
            entity.Property(item => item.Position).IsRequired();
            entity.HasOne(item => item.TaskTemplate)
                .WithMany(template => template.Items)
                .HasForeignKey(item => item.TaskTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<FamilyMember>()
                .WithMany()
                .HasForeignKey(item => item.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(item => new { item.TaskTemplateId, item.Position }).IsUnique();
        });

        modelBuilder.Entity<HouseholdTask>(entity =>
        {
            entity.ToTable("HouseholdTasks", table =>
            {
                table.HasCheckConstraint("CK_HouseholdTasks_DecorativeAvatar_NullablePair", "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
            });
            entity.HasKey(task => task.Id);
            entity.Property(task => task.Title).HasMaxLength(240).IsRequired();
            entity.Property(task => task.DueDate).HasColumnType("date");
            entity.Property(task => task.OwnershipKind).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(task => task.FamilyMemberId).HasMaxLength(120);
            entity.Property(task => task.IsCompleted).IsRequired();
            entity.Property(task => task.IsExpired).IsRequired();
            entity.Property(task => task.NoDateReviewState).HasConversion<string>().HasMaxLength(24).IsRequired();
            entity.Property(task => task.NoDateLastReviewedUtc);
            entity.Property(task => task.ArchivedUtc);
            entity.Property(task => task.RecurringTaskSeriesId);
            entity.Property(task => task.RecurrenceFrequency).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(task => task.DecorativeAvatarReferenceType).HasConversion<string>().HasMaxLength(32);
            entity.Property(task => task.DecorativeAvatarReferenceId).HasMaxLength(120);
            entity.Property(task => task.CreatedUtc).IsRequired();
            entity.Property(task => task.UpdatedUtc).IsRequired();
            entity.HasOne(task => task.Household)
                .WithMany()
                .HasForeignKey(task => task.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FamilyMember>()
                .WithMany()
                .HasForeignKey(task => task.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(task => task.RecurringTaskSeries)
                .WithMany(series => series.Tasks)
                .HasForeignKey(task => task.RecurringTaskSeriesId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(task => new { task.HouseholdId, task.NoDateReviewState, task.DueDate, task.CreatedUtc });
            entity.HasIndex(task => new { task.HouseholdId, task.IsCompleted, task.IsExpired, task.DueDate });
            entity.HasIndex(task => new { task.RecurringTaskSeriesId, task.DueDate }).IsUnique();
            entity.HasIndex(task => new { task.DecorativeAvatarReferenceType, task.DecorativeAvatarReferenceId });
        });

        modelBuilder.Entity<MotivationFamilyGoal>(entity =>
        {
            entity.ToTable("MotivationFamilyGoals");
            entity.HasKey(goal => goal.Id);
            entity.Property(goal => goal.Title).HasMaxLength(240).IsRequired();
            entity.Property(goal => goal.TargetCount).IsRequired();
            entity.Property(goal => goal.CurrentProgress).IsRequired();
            entity.Property(goal => goal.UnitLabel).HasMaxLength(80).IsRequired();
            entity.Property(goal => goal.CelebrationTitle).HasMaxLength(240);
            entity.Property(goal => goal.CelebrationDescription).HasMaxLength(500);
            entity.Property(goal => goal.CelebrationStatus).HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(goal => goal.CelebrationCelebratedUtc);
            entity.Property(goal => goal.IsActive).IsRequired();
            entity.HasOne(goal => goal.Household)
                .WithMany()
                .HasForeignKey(goal => goal.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(goal => new { goal.HouseholdId, goal.IsActive });
            entity.HasIndex(goal => goal.HouseholdId).IsUnique().HasFilter("\"IsActive\"");
        });

        modelBuilder.Entity<MotivationIndividualGoal>(entity =>
        {
            entity.ToTable("MotivationIndividualGoals");
            entity.HasKey(goal => goal.Id);
            entity.Property(goal => goal.FamilyMemberId).HasMaxLength(120).IsRequired();
            entity.Property(goal => goal.Title).HasMaxLength(240).IsRequired();
            entity.Property(goal => goal.TargetCount).IsRequired();
            entity.Property(goal => goal.CurrentProgress).IsRequired();
            entity.Property(goal => goal.UnitLabel).HasMaxLength(80).IsRequired();
            entity.Property(goal => goal.VisualKind).HasMaxLength(40).IsRequired();
            entity.Property(goal => goal.IsActive).IsRequired();
            entity.HasOne(goal => goal.Household)
                .WithMany()
                .HasForeignKey(goal => goal.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(goal => goal.FamilyMember)
                .WithMany()
                .HasForeignKey(goal => goal.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(goal => new { goal.HouseholdId, goal.IsActive });
            entity.HasIndex(goal => new { goal.HouseholdId, goal.FamilyMemberId, goal.IsActive });
            entity.HasIndex(goal => new { goal.HouseholdId, goal.FamilyMemberId }).IsUnique().HasFilter("\"IsActive\"");
        });

        modelBuilder.Entity<HelpfulMoment>(entity =>
        {
            entity.ToTable("HelpfulMoments");
            entity.HasKey(moment => moment.Id);
            entity.Property(moment => moment.FamilyMemberId).HasMaxLength(120).IsRequired();
            entity.Property(moment => moment.Title).HasMaxLength(160).IsRequired();
            entity.Property(moment => moment.Description).HasMaxLength(500);
            entity.Property(moment => moment.RecognitionTag).HasMaxLength(40).IsRequired();
            entity.Property(moment => moment.CreatedUtc).IsRequired();
            entity.HasOne(moment => moment.Household)
                .WithMany()
                .HasForeignKey(moment => moment.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(moment => moment.FamilyMember)
                .WithMany()
                .HasForeignKey(moment => moment.FamilyMemberId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(moment => new { moment.HouseholdId, moment.CreatedUtc });
            entity.HasIndex(moment => new { moment.HouseholdId, moment.FamilyMemberId, moment.CreatedUtc });
        });

        modelBuilder.Entity<WorkspaceLayout>(entity =>
        {
            entity.ToTable("WorkspaceLayouts");
            entity.HasKey(layout => layout.Id);
            entity.Property(layout => layout.WorkspaceKey).HasMaxLength(80).IsRequired();
            entity.Property(layout => layout.CreatedUtc).IsRequired();
            entity.Property(layout => layout.UpdatedUtc).IsRequired();
            entity.HasOne(layout => layout.Household)
                .WithMany()
                .HasForeignKey(layout => layout.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(layout => new { layout.HouseholdId, layout.WorkspaceKey }).IsUnique();
        });

        modelBuilder.Entity<WidgetPlacement>(entity =>
        {
            entity.ToTable("WidgetPlacements");
            entity.HasKey(placement => placement.Id);
            entity.Property(placement => placement.WidgetType).HasMaxLength(120).IsRequired();
            entity.Property(placement => placement.Position).IsRequired();
            entity.Property(placement => placement.Size).HasMaxLength(40).IsRequired();
            entity.Property(placement => placement.ConfigurationJson).HasColumnType("jsonb").IsRequired();
            entity.HasOne(placement => placement.WorkspaceLayout)
                .WithMany(layout => layout.Placements)
                .HasForeignKey(placement => placement.WorkspaceLayoutId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(placement => new { placement.WorkspaceLayoutId, placement.Position }).IsUnique();
        });

        Seed(modelBuilder);
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Household>().HasData(new Household
        {
            Id = SeedHousehold.Id,
            Name = SeedHousehold.Name,
            CreatedUtc = SeedLists.SeededUtc,
            TimeZoneId = SeedHousehold.TimeZoneId,
            OnboardingCompleted = true,
            UpdatedUtc = SeedLists.SeededUtc,
        });

        modelBuilder.Entity<Lists.List>().HasData(
            new Lists.List
            {
                Id = SeedLists.ShoppingListId,
                Name = "Shopping",
                CreatedUtc = SeedLists.SeededUtc,
                UpdatedUtc = SeedLists.SeededUtc,
                HouseholdId = SeedHousehold.Id,
            },
            new Lists.List
            {
                Id = SeedLists.VacationPackingListId,
                Name = "Vacation Packing",
                CreatedUtc = SeedLists.SeededUtc,
                UpdatedUtc = SeedLists.SeededUtc,
                HouseholdId = SeedHousehold.Id,
            });

        modelBuilder.Entity<ListItem>().HasData(
            SeedItem(SeedLists.BreadItemId, SeedLists.ShoppingListId, "Bread"),
            SeedItem(SeedLists.MilkItemId, SeedLists.ShoppingListId, "Milk"),
            SeedItem(SeedLists.CoffeeItemId, SeedLists.ShoppingListId, "Coffee"),
            SeedItem(SeedLists.PassportItemId, SeedLists.VacationPackingListId, "Passport"),
            SeedItem(SeedLists.ChargersItemId, SeedLists.VacationPackingListId, "Chargers"),
            SeedItem(SeedLists.SwimwearItemId, SeedLists.VacationPackingListId, "Swimwear"));

        modelBuilder.Entity<FamilyMember>().HasData(
            SeedFamilyMember("alex", "Alex", "#f8c8dc", "A", FamilyMemberKind.Adult, null),
            SeedFamilyMember("sam", "Sam", "#c7d2fe", "S", FamilyMemberKind.Adult, null),
            SeedFamilyMember("riley", "Riley", "#bbf7d0", "R", FamilyMemberKind.Child, new DateOnly(2018, 4, 12)),
            SeedFamilyMember("jordan", "Jordan", "#fde68a", "J", FamilyMemberKind.Child, new DateOnly(2020, 9, 3)));

        modelBuilder.Entity<MotivationFamilyGoal>().HasData(new MotivationFamilyGoal
        {
            Id = SeedMotivation.FamilyGoalId,
            HouseholdId = SeedHousehold.Id,
            Title = "Fill the family helper path",
            TargetCount = 20,
            CurrentProgress = 13,
            UnitLabel = "helpful actions",
            CelebrationTitle = "Board game night together",
            CelebrationDescription = "Choose a board game and celebrate helping as a family.",
            CelebrationStatus = FamilyCelebrationStatus.Planned,
            IsActive = true,
        });

        modelBuilder.Entity<MotivationIndividualGoal>().HasData(
            SeedIndividualMotivationGoal(SeedMotivation.AlexGoalId, "alex", "Finish morning routine", 5, 3, "checkmarks", "checkmarks"),
            SeedIndividualMotivationGoal(SeedMotivation.SamGoalId, "sam", "Help with dinner", 3, 2, "stars", "stars"),
            SeedIndividualMotivationGoal(SeedMotivation.RileyGoalId, "riley", "Tidy bedroom corner", 4, 2, "steps", "progress"),
            SeedIndividualMotivationGoal(SeedMotivation.JordanGoalId, "jordan", "Notice one helpful thing", 3, 1, "stars", "stars"));



        var templateIds = new[]
        {
            Guid.Parse("b0010000-0000-0000-0000-000000000001"), Guid.Parse("b0010000-0000-0000-0000-000000000002"), Guid.Parse("b0010000-0000-0000-0000-000000000003"), Guid.Parse("b0010000-0000-0000-0000-000000000004"), Guid.Parse("b0010000-0000-0000-0000-000000000005")
        };
        modelBuilder.Entity<TaskTemplate>().HasData(
            SeedTaskTemplate(templateIds[0], "Morning Routine", "Simple school-morning preparation."),
            SeedTaskTemplate(templateIds[1], "Bedtime Routine", "Simple end-of-day reset."),
            SeedTaskTemplate(templateIds[2], "Homework Routine", "Homework and reading basics."),
            SeedTaskTemplate(templateIds[3], "Pet Care", "Basic pet care tasks."),
            SeedTaskTemplate(templateIds[4], "Kitchen Reset", "Quick kitchen cleanup."));
        modelBuilder.Entity<TaskTemplateItem>().HasData(
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000001", templateIds[0], "Brush teeth", 0),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000002", templateIds[0], "Get dressed", 1),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000003", templateIds[0], "Pack school bag", 2),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000004", templateIds[1], "Brush teeth", 0),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000005", templateIds[1], "Put on pajamas", 1),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000006", templateIds[1], "Tidy room", 2),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000007", templateIds[2], "Homework", 0),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000008", templateIds[2], "Reading", 1),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000009", templateIds[3], "Feed pet", 0),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000010", templateIds[4], "Empty dishwasher", 0),
            SeedTaskTemplateItem("b1010000-0000-0000-0000-000000000011", templateIds[4], "Wipe counters", 1));

        modelBuilder.Entity<CalendarEvents.EventSource>().HasData(new CalendarEvents.EventSource
        {
            Id = SeedCalendarEvents.EventSourceId,
            HouseholdId = SeedHousehold.Id,
            Name = "HomeOps Calendar",
            SourceType = EventSourceTypes.Manual,
            IsWritable = true,
            IsSystem = true,
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        });

        modelBuilder.Entity<EventSeries>().HasData(
            SeedEventSeries(SeedCalendarEvents.DentistAppointmentId, "Dentist Appointment", "Routine check-up", new DateTimeOffset(2026, 6, 18, 9, 30, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 18, 10, 15, 0, TimeSpan.Zero), false),
            SeedEventSeries(SeedCalendarEvents.ParentEveningId, "Parent Evening", "School hall", new DateTimeOffset(2026, 6, 19, 18, 30, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 19, 20, 0, 0, TimeSpan.Zero), false),
            SeedEventSeries(SeedCalendarEvents.VacationId, "Vacation", "Family trip", new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero), new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero), true),
            SeedEventSeries(SeedCalendarEvents.PutBinsOutsideId, "Put Bins Outside", null, new DateTimeOffset(2026, 6, 21, 20, 0, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 21, 20, 10, 0, TimeSpan.Zero), false));

        modelBuilder.Entity<WorkspaceLayout>().HasData(
            SeedLayout(SeedWorkspaceLayouts.HomeLayoutId, "home"),
            SeedLayout(SeedWorkspaceLayouts.HouseLayoutId, "house"),
            SeedLayout(SeedWorkspaceLayouts.MediaLayoutId, "media"),
            SeedLayout(SeedWorkspaceLayouts.SettingsLayoutId, "settings"));

        modelBuilder.Entity<WidgetPlacement>().HasData(
            SeedPlacement(SeedWorkspaceLayouts.HomeAgendaPlacementId, SeedWorkspaceLayouts.HomeLayoutId, "agenda-mvp", 0, "large"),
            SeedPlacement(SeedWorkspaceLayouts.HomeShoppingPlacementId, SeedWorkspaceLayouts.HomeLayoutId, "shopping-list-mvp", 1, "medium"),
            SeedPlacement(SeedWorkspaceLayouts.HomeWelcomePlacementId, SeedWorkspaceLayouts.HomeLayoutId, "welcome-text", 2, "medium"),
            SeedPlacement(SeedWorkspaceLayouts.HousePlaceholderPlacementId, SeedWorkspaceLayouts.HouseLayoutId, "house-placeholder", 0, "medium"),
            SeedPlacement(SeedWorkspaceLayouts.MediaPlaceholderPlacementId, SeedWorkspaceLayouts.MediaLayoutId, "media-placeholder", 0, "medium"),
            SeedPlacement(SeedWorkspaceLayouts.SettingsPlaceholderPlacementId, SeedWorkspaceLayouts.SettingsLayoutId, "settings-placeholder", 0, "medium"));
    }

    private static FamilyMember SeedFamilyMember(string id, string name, string displayColor, string initials, FamilyMemberKind memberKind, DateOnly? dateOfBirth) => new()
    {
        Id = id,
        HouseholdId = SeedHousehold.Id,
        Name = name,
        DisplayColor = displayColor,
        Initials = initials,
        MemberKind = memberKind,
        DateOfBirth = dateOfBirth,
        IsDeleted = false,
        CreatedUtc = SeedFamilyMembers.SeededUtc,
        UpdatedUtc = SeedFamilyMembers.SeededUtc,
    };

    private static MotivationIndividualGoal SeedIndividualMotivationGoal(Guid id, string familyMemberId, string title, int targetCount, int currentProgress, string unitLabel, string visualKind) => new()
    {
        Id = id,
        HouseholdId = SeedHousehold.Id,
        FamilyMemberId = familyMemberId,
        Title = title,
        TargetCount = targetCount,
        CurrentProgress = currentProgress,
        UnitLabel = unitLabel,
        VisualKind = visualKind,
        IsActive = true,
    };

    private static ListItem SeedItem(Guid id, Guid listId, string text) => new()
    {
        Id = id,
        ListId = listId,
        Text = text,
        IsCompleted = false,
        CreatedUtc = SeedLists.SeededUtc,
        UpdatedUtc = SeedLists.SeededUtc,
    };



    private static TaskTemplate SeedTaskTemplate(Guid id, string name, string description) => new()
    {
        Id = id, HouseholdId = SeedHousehold.Id, Name = name, Description = description, IsArchived = false, CreatedUtc = SeedLists.SeededUtc, UpdatedUtc = SeedLists.SeededUtc,
    };

    private static TaskTemplateItem SeedTaskTemplateItem(string id, Guid templateId, string title, int position) => new()
    {
        Id = Guid.Parse(id), TaskTemplateId = templateId, Title = title, OwnershipKind = TaskOwnershipKind.Unassigned, RecurrenceFrequency = TaskRecurrenceFrequency.None, Position = position,
    };

    private static EventSeries SeedEventSeries(Guid id, string title, string? description, DateTimeOffset startUtc, DateTimeOffset? endUtc, bool isAllDay) => new()
    {
        Id = id,
        EventSourceId = SeedCalendarEvents.EventSourceId,
        Title = title,
        Description = description,
        IsAllDay = isAllDay,
        StartDate = DateOnly.FromDateTime(startUtc.UtcDateTime),
        StartTime = isAllDay ? null : TimeOnly.FromDateTime(startUtc.UtcDateTime),
        EndDate = DateOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime),
        EndTime = isAllDay ? null : TimeOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime),
        CreatedUtc = SeedCalendarEvents.SeededUtc,
        UpdatedUtc = SeedCalendarEvents.SeededUtc,
    };

    private static WorkspaceLayout SeedLayout(Guid id, string workspaceKey) => new()
    {
        Id = id,
        HouseholdId = SeedHousehold.Id,
        WorkspaceKey = workspaceKey,
        CreatedUtc = SeedWorkspaceLayouts.SeededUtc,
        UpdatedUtc = SeedWorkspaceLayouts.SeededUtc,
    };

    private static WidgetPlacement SeedPlacement(Guid id, Guid workspaceLayoutId, string widgetType, int position, string size) => new()
    {
        Id = id,
        WorkspaceLayoutId = workspaceLayoutId,
        WidgetType = widgetType,
        Position = position,
        Size = size,
        ConfigurationJson = "{}",
    };
}