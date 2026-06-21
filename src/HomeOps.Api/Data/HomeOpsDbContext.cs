using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.FamilyMembers;
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
    public DbSet<ShoppingItemPreference> ShoppingItemPreferences => Set<ShoppingItemPreference>();
    public DbSet<CalendarEvents.EventSource> EventSources => Set<CalendarEvents.EventSource>();
    public DbSet<EventSeries> EventSeries => Set<EventSeries>();
    public DbSet<EventException> EventExceptions => Set<EventException>();
    public DbSet<WorkspaceLayout> WorkspaceLayouts => Set<WorkspaceLayout>();
    public DbSet<WidgetPlacement> WidgetPlacements => Set<WidgetPlacement>();
    public DbSet<HouseholdTask> HouseholdTasks => Set<HouseholdTask>();
    public DbSet<RecurringTaskSeries> RecurringTaskSeries => Set<RecurringTaskSeries>();
    public DbSet<TaskTemplate> TaskTemplates => Set<TaskTemplate>();
    public DbSet<TaskTemplateItem> TaskTemplateItems => Set<TaskTemplateItem>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<MotivationFamilyGoal> MotivationFamilyGoals => Set<MotivationFamilyGoal>();
    public DbSet<MotivationIndividualGoal> MotivationIndividualGoals => Set<MotivationIndividualGoal>();
    public DbSet<HelpfulMoment> HelpfulMoments => Set<HelpfulMoment>();

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
            entity.Property(item => item.PreferredStore).HasMaxLength(120);
            entity.Property(item => item.CreatedUtc).IsRequired();
            entity.Property(item => item.UpdatedUtc).IsRequired();
            entity.HasOne(item => item.List)
                .WithMany(list => list.Items)
                .HasForeignKey(item => item.ListId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(item => new { item.ListId, item.CreatedUtc });
        });


        modelBuilder.Entity<ShoppingItemPreference>(entity =>
        {
            entity.ToTable("ShoppingItemPreferences");
            entity.HasKey(preference => preference.Id);
            entity.Property(preference => preference.NormalizedText).HasMaxLength(240).IsRequired();
            entity.Property(preference => preference.ItemText).HasMaxLength(240).IsRequired();
            entity.Property(preference => preference.PreferredStore).HasMaxLength(120).IsRequired();
            entity.Property(preference => preference.StoreObservationCount).IsRequired();
            entity.Property(preference => preference.CreatedUtc).IsRequired();
            entity.Property(preference => preference.UpdatedUtc).IsRequired();
            entity.HasIndex(preference => new { preference.HouseholdId, preference.NormalizedText }).IsUnique();
        });


        modelBuilder.Entity<CalendarEvents.EventSource>(entity =>
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

        modelBuilder.Entity<EventSeries>(entity =>
        {
            entity.ToTable("EventSeries");
            entity.HasKey(eventSeries => eventSeries.Id);
            entity.Property(eventSeries => eventSeries.Title).HasMaxLength(240).IsRequired();
            entity.Property(eventSeries => eventSeries.Description).HasMaxLength(1000);
            entity.Property(eventSeries => eventSeries.StartDate).HasColumnType("date").IsRequired();
            entity.Property(eventSeries => eventSeries.StartTime).HasColumnType("time without time zone");
            entity.Property(eventSeries => eventSeries.EndDate).HasColumnType("date").IsRequired();
            entity.Property(eventSeries => eventSeries.EndTime).HasColumnType("time without time zone");
            entity.Property(eventSeries => eventSeries.IsAllDay).IsRequired();
            entity.Property(eventSeries => eventSeries.RecurrenceType).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(eventSeries => eventSeries.CreatedUtc).IsRequired();
            entity.Property(eventSeries => eventSeries.UpdatedUtc).IsRequired();
            entity.HasOne(eventSeries => eventSeries.EventSource)
                .WithMany(source => source.EventSeries)
                .HasForeignKey(eventSeries => eventSeries.EventSourceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(eventSeries => new { eventSeries.EventSourceId, eventSeries.StartDate });
        });

        modelBuilder.Entity<EventException>(entity =>
        {
            entity.ToTable("EventExceptions");
            entity.HasKey(exception => exception.Id);
            entity.Property(exception => exception.OccurrenceDate).HasColumnType("date").IsRequired();
            entity.Property(exception => exception.IsSkipped).IsRequired();
            entity.Property(exception => exception.Title).HasMaxLength(240);
            entity.Property(exception => exception.Description).HasMaxLength(1000);
            entity.Property(exception => exception.StartDate).HasColumnType("date");
            entity.Property(exception => exception.StartTime).HasColumnType("time without time zone");
            entity.Property(exception => exception.EndDate).HasColumnType("date");
            entity.Property(exception => exception.EndTime).HasColumnType("time without time zone");
            entity.Property(exception => exception.CreatedUtc).IsRequired();
            entity.Property(exception => exception.UpdatedUtc).IsRequired();
            entity.HasOne(exception => exception.EventSeries)
                .WithMany(series => series.Exceptions)
                .HasForeignKey(exception => exception.EventSeriesId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(exception => new { exception.EventSeriesId, exception.OccurrenceDate }).IsUnique();
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
            entity.Property(member => member.AgeGroup).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(member => member.Presentation).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(member => member.SkinTone).HasMaxLength(32).IsRequired();
            entity.Property(member => member.HairColor).HasMaxLength(32).IsRequired();
            entity.Property(member => member.HairStyle).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(member => member.Glasses).IsRequired();
            entity.Property(member => member.ShirtColor).HasMaxLength(32).IsRequired();
            entity.Property(member => member.CreatedUtc).IsRequired();
            entity.Property(member => member.UpdatedUtc).IsRequired();
            entity.HasOne(member => member.Household)
                .WithMany()
                .HasForeignKey(member => member.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(member => new { member.HouseholdId, member.Name });
            entity.HasIndex(member => new { member.HouseholdId, member.IsDeleted, member.Name });
        });

        modelBuilder.Entity<RecurringTaskSeries>(entity =>
        {
            entity.ToTable("RecurringTaskSeries");
            entity.HasKey(series => series.Id);
            entity.Property(series => series.Title).HasMaxLength(240).IsRequired();
            entity.Property(series => series.StartDate).HasColumnType("date").IsRequired();
            entity.Property(series => series.Frequency).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(series => series.OwnershipKind).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(series => series.FamilyMemberId).HasMaxLength(120);
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
            entity.ToTable("HouseholdTasks");
            entity.HasKey(task => task.Id);
            entity.Property(task => task.Title).HasMaxLength(240).IsRequired();
            entity.Property(task => task.DueDate).HasColumnType("date");
            entity.Property(task => task.OwnershipKind).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(task => task.FamilyMemberId).HasMaxLength(120);
            entity.Property(task => task.IsCompleted).IsRequired();
            entity.Property(task => task.RecurringTaskSeriesId);
            entity.Property(task => task.RecurrenceFrequency).HasConversion<string>().HasMaxLength(16).IsRequired();
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
            entity.HasIndex(task => new { task.HouseholdId, task.IsCompleted, task.DueDate });
            entity.HasIndex(task => new { task.RecurringTaskSeriesId, task.DueDate }).IsUnique();
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
            SeedFamilyMember("alex", "Alex", "#f8c8dc", "A", FamilyMemberKind.Adult, null, FamilyMemberAgeGroup.Adult, FamilyMemberPresentation.Feminine, "#c68642", "#3b2416", FamilyMemberHairStyle.Long, false, "#f472b6"),
            SeedFamilyMember("sam", "Sam", "#c7d2fe", "S", FamilyMemberKind.Adult, null, FamilyMemberAgeGroup.Adult, FamilyMemberPresentation.Masculine, "#f1c27d", "#4b5563", FamilyMemberHairStyle.Short, true, "#60a5fa"),
            SeedFamilyMember("riley", "Riley", "#bbf7d0", "R", FamilyMemberKind.Child, new DateOnly(2018, 4, 12), FamilyMemberAgeGroup.Child, FamilyMemberPresentation.Neutral, "#8d5524", "#111827", FamilyMemberHairStyle.Curly, false, "#34d399"),
            SeedFamilyMember("jordan", "Jordan", "#fde68a", "J", FamilyMemberKind.Child, new DateOnly(2020, 9, 3), FamilyMemberAgeGroup.Child, FamilyMemberPresentation.Neutral, "#ffdbac", "#92400e", FamilyMemberHairStyle.Top, true, "#fbbf24"));

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
            SourceType = "manual",
            IsWritable = true,
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

    private static FamilyMember SeedFamilyMember(string id, string name, string displayColor, string initials, FamilyMemberKind memberKind, DateOnly? dateOfBirth, FamilyMemberAgeGroup ageGroup, FamilyMemberPresentation presentation, string skinTone, string hairColor, FamilyMemberHairStyle hairStyle, bool glasses, string shirtColor) => new()
    {
        Id = id,
        HouseholdId = SeedHousehold.Id,
        Name = name,
        DisplayColor = displayColor,
        Initials = initials,
        MemberKind = memberKind,
        DateOfBirth = dateOfBirth,
        IsDeleted = false,
        AgeGroup = ageGroup,
        Presentation = presentation,
        SkinTone = skinTone,
        HairColor = hairColor,
        HairStyle = hairStyle,
        Glasses = glasses,
        ShirtColor = shirtColor,
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
