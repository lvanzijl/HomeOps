using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.ManualEvents;
using HomeOps.Api.WidgetLayouts;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Data;

public sealed class HomeOpsDbContext(DbContextOptions<HomeOpsDbContext> options) : DbContext(options)
{
    public DbSet<AgendaLayerSetting> AgendaLayerSettings => Set<AgendaLayerSetting>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<Lists.List> Lists => Set<Lists.List>();
    public DbSet<ListItem> ListItems => Set<ListItem>();
    public DbSet<ManualEvents.EventSource> EventSources => Set<ManualEvents.EventSource>();
    public DbSet<ManualEvent> ManualEvents => Set<ManualEvent>();
    public DbSet<WorkspaceLayout> WorkspaceLayouts => Set<WorkspaceLayout>();
    public DbSet<WidgetPlacement> WidgetPlacements => Set<WidgetPlacement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


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
            entity.Property(household => household.CreatedUtc).IsRequired();
            entity.Property(household => household.UpdatedUtc).IsRequired();
        });

        modelBuilder.Entity<Lists.List>(entity =>
        {
            entity.ToTable("Lists");
            entity.HasKey(list => list.Id);
            entity.Property(list => list.Name).HasMaxLength(160).IsRequired();
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
            entity.ToTable("ListItems");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Text).HasMaxLength(240).IsRequired();
            entity.Property(item => item.IsCompleted).IsRequired();
            entity.Property(item => item.CreatedUtc).IsRequired();
            entity.Property(item => item.UpdatedUtc).IsRequired();
            entity.HasOne(item => item.List)
                .WithMany(list => list.Items)
                .HasForeignKey(item => item.ListId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(item => new { item.ListId, item.CreatedUtc });
        });


        modelBuilder.Entity<ManualEvents.EventSource>(entity =>
        {
            entity.ToTable("EventSources");
            entity.HasKey(source => source.Id);
            entity.Property(source => source.Name).HasMaxLength(160).IsRequired();
            entity.Property(source => source.SourceType).HasMaxLength(80).IsRequired();
            entity.Property(source => source.IsWritable).IsRequired();
            entity.Property(source => source.CreatedUtc).IsRequired();
            entity.Property(source => source.UpdatedUtc).IsRequired();
            entity.HasOne(source => source.Household)
                .WithMany()
                .HasForeignKey(source => source.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(source => new { source.HouseholdId, source.SourceType }).IsUnique();
        });

        modelBuilder.Entity<ManualEvent>(entity =>
        {
            entity.ToTable("ManualEvents");
            entity.HasKey(manualEvent => manualEvent.Id);
            entity.Property(manualEvent => manualEvent.Title).HasMaxLength(240).IsRequired();
            entity.Property(manualEvent => manualEvent.Description).HasMaxLength(1000);
            entity.Property(manualEvent => manualEvent.StartUtc).IsRequired();
            entity.Property(manualEvent => manualEvent.EndUtc);
            entity.Property(manualEvent => manualEvent.IsAllDay).IsRequired();
            entity.Property(manualEvent => manualEvent.CreatedUtc).IsRequired();
            entity.Property(manualEvent => manualEvent.UpdatedUtc).IsRequired();
            entity.HasOne(manualEvent => manualEvent.EventSource)
                .WithMany(source => source.Events)
                .HasForeignKey(manualEvent => manualEvent.EventSourceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(manualEvent => new { manualEvent.EventSourceId, manualEvent.StartUtc });
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

        modelBuilder.Entity<ManualEvents.EventSource>().HasData(new ManualEvents.EventSource
        {
            Id = SeedManualEvents.ManualEventSourceId,
            HouseholdId = SeedHousehold.Id,
            Name = "HomeOps Manual Events",
            SourceType = "manual",
            IsWritable = true,
            CreatedUtc = SeedManualEvents.SeededUtc,
            UpdatedUtc = SeedManualEvents.SeededUtc,
        });

        modelBuilder.Entity<ManualEvent>().HasData(
            SeedManualEvent(SeedManualEvents.DentistAppointmentId, "Dentist Appointment", "Routine check-up", new DateTimeOffset(2026, 6, 18, 9, 30, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 18, 10, 15, 0, TimeSpan.Zero), false),
            SeedManualEvent(SeedManualEvents.ParentEveningId, "Parent Evening", "School hall", new DateTimeOffset(2026, 6, 19, 18, 30, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 19, 20, 0, 0, TimeSpan.Zero), false),
            SeedManualEvent(SeedManualEvents.VacationId, "Vacation", "Family trip", new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero), new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero), true),
            SeedManualEvent(SeedManualEvents.PutBinsOutsideId, "Put Bins Outside", null, new DateTimeOffset(2026, 6, 21, 20, 0, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 21, 20, 10, 0, TimeSpan.Zero), false));

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

    private static ListItem SeedItem(Guid id, Guid listId, string text) => new()
    {
        Id = id,
        ListId = listId,
        Text = text,
        IsCompleted = false,
        CreatedUtc = SeedLists.SeededUtc,
        UpdatedUtc = SeedLists.SeededUtc,
    };


    private static ManualEvent SeedManualEvent(Guid id, string title, string? description, DateTimeOffset startUtc, DateTimeOffset? endUtc, bool isAllDay) => new()
    {
        Id = id,
        EventSourceId = SeedManualEvents.ManualEventSourceId,
        Title = title,
        Description = description,
        StartUtc = startUtc,
        EndUtc = endUtc,
        IsAllDay = isAllDay,
        CreatedUtc = SeedManualEvents.SeededUtc,
        UpdatedUtc = SeedManualEvents.SeededUtc,
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
