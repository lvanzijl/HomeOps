using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.Motivation;
using HomeOps.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.VisualReviewFixtures;

public static class VisualReviewFixtureService
{
    private static readonly DateTimeOffset AnchorUtc = new(2026, 6, 21, 9, 0, 0, TimeSpan.Zero);
    private static readonly DateOnly Today = new(2026, 6, 21);
    private static readonly Guid CalendarSourceId = Guid.Parse("77000000-0000-0000-0000-000000000001");
    public static readonly IReadOnlyCollection<VisualReviewScenarioDto> Scenarios =
    [
        new("visual-full", "Rich showcase state for full UX, asset, layout, shopping, motivation, celebration, memory, and weekly reset review."),
        new("visual-mixed", "Typical household state with active items, completed items, empty sections, and partial progress."),
        new("visual-empty", "Empty-state UX review for Home, Motivation, Lists, and Tasks surfaces."),
        new("visual-child-young", "Younger child workspace review with child tasks, helpful moments, goal progress, and celebration context."),
        new("visual-child-older", "Older child workspace review with a personal goal, contributions, helpful moments, and celebration context."),
        new("visual-weekly-reset", "Weekly Reset review with candidates, goal confirmation, shopping review, and contribution recap."),
        new("visual-shopping-lifecycle", "Shopping lifecycle review with active, completed, deleted, store-suggested, and archived list states."),
        new("visual-marketing-home", "Canonical Van Zijl marketing household opening-shot dashboard fixture."),
        new("visual-marketing-family", "Canonical Van Zijl marketing household family-member and avatar-editing fixture."),
        new("visual-marketing-agenda", "Canonical Van Zijl marketing household agenda fixture for month, week, and list review."),
        new("visual-marketing-tasks", "Canonical Van Zijl marketing household task completion and add-task fixture."),
        new("visual-marketing-shopping", "Canonical Van Zijl marketing household grouped-shopping fixture."),
        new("visual-marketing-motivation", "Canonical Van Zijl marketing household motivation, appreciation, celebration, and statistics fixture."),
        new("visual-marketing-weekly-reset", "Canonical Van Zijl marketing household Weekly Reset walkthrough fixture."),
        new("visual-marketing-settings", "Canonical Van Zijl marketing household reassuring settings fixture."),
    ];

    public static async Task<ApplyVisualReviewScenarioResponse?> ApplyScenario(HomeOpsDbContext db, string scenarioName, CancellationToken ct)
    {
        if (!Scenarios.Any(s => string.Equals(s.Name, scenarioName, StringComparison.OrdinalIgnoreCase))) return null;
        await ClearReviewData(db, ct);
        await EnsureHousehold(db, ct);
        if (TryApplyMarketingScenario(db, scenarioName))
        {
            await db.SaveChangesAsync(ct);
            return new(scenarioName, MarketingHouseholdFixtureBuilder.GetAnchorUtc(GetMarketingScene(scenarioName)!.Value), db.FamilyMembers.Local.Count, db.HouseholdTasks.Local.Count, db.Lists.Local.Count, db.ListItems.Local.Count, db.MotivationFamilyGoals.Local.Count, db.MotivationIndividualGoals.Local.Count, db.HelpfulMoments.Local.Count, db.EventSeries.Local.Count);
        }
        if (scenarioName != "visual-empty") AddFamily(db);
        AddCalendarSource(db);
        switch (scenarioName)
        {
            case "visual-full": AddFull(db); break;
            case "visual-mixed": AddMixed(db); break;
            case "visual-child-young": AddChildYoung(db); break;
            case "visual-child-older": AddChildOlder(db); break;
            case "visual-weekly-reset": AddWeeklyReset(db); break;
            case "visual-shopping-lifecycle": AddShoppingLifecycle(db); break;
        }
        await db.SaveChangesAsync(ct);
        return new(scenarioName, AnchorUtc, db.FamilyMembers.Local.Count, db.HouseholdTasks.Local.Count, db.Lists.Local.Count, db.ListItems.Local.Count, db.MotivationFamilyGoals.Local.Count, db.MotivationIndividualGoals.Local.Count, db.HelpfulMoments.Local.Count, db.EventSeries.Local.Count);
    }

    private static MarketingScene? GetMarketingScene(string scenarioName) => scenarioName.ToLowerInvariant() switch
        {
            "visual-marketing-home" => MarketingScene.Home,
            "visual-marketing-family" => MarketingScene.Family,
            "visual-marketing-agenda" => MarketingScene.Agenda,
            "visual-marketing-tasks" => MarketingScene.Tasks,
            "visual-marketing-shopping" => MarketingScene.Shopping,
            "visual-marketing-motivation" => MarketingScene.Motivation,
            "visual-marketing-weekly-reset" => MarketingScene.WeeklyReset,
            "visual-marketing-settings" => MarketingScene.Settings,
            _ => (MarketingScene?)null,
        };

    private static bool TryApplyMarketingScenario(HomeOpsDbContext db, string scenarioName)
    {
        var scene = GetMarketingScene(scenarioName);
        if (scene is null) return false;
        MarketingHouseholdFixtureBuilder.Add(db, scene.Value);
        return true;
    }

    private static async Task ClearReviewData(HomeOpsDbContext db, CancellationToken ct)
    {
        db.EventExceptions.RemoveRange(await db.EventExceptions.ToListAsync(ct));
        db.EventSeries.RemoveRange(await db.EventSeries.ToListAsync(ct));
        db.EventSources.RemoveRange(await db.EventSources.ToListAsync(ct));
        db.HelpfulMoments.RemoveRange(await db.HelpfulMoments.ToListAsync(ct));
        db.MotivationIndividualGoals.RemoveRange(await db.MotivationIndividualGoals.ToListAsync(ct));
        db.MotivationFamilyGoals.RemoveRange(await db.MotivationFamilyGoals.ToListAsync(ct));
        db.HouseholdTasks.RemoveRange(await db.HouseholdTasks.ToListAsync(ct));
        db.RecurringTaskSeries.RemoveRange(await db.RecurringTaskSeries.ToListAsync(ct));
        db.TaskTemplateItems.RemoveRange(await db.TaskTemplateItems.ToListAsync(ct));
        db.TaskTemplates.RemoveRange(await db.TaskTemplates.ToListAsync(ct));
        db.ListItems.RemoveRange(await db.ListItems.ToListAsync(ct));
        db.ShoppingPurchaseHistories.RemoveRange(await db.ShoppingPurchaseHistories.ToListAsync(ct));
        db.Lists.RemoveRange(await db.Lists.ToListAsync(ct));
        db.FamilyMembers.RemoveRange(await db.FamilyMembers.ToListAsync(ct));
        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureHousehold(HomeOpsDbContext db, CancellationToken ct)
    {
        var household = await db.Households.FirstOrDefaultAsync(h => h.Id == SeedHousehold.Id, ct);
        if (household is null) db.Households.Add(new() { Id = SeedHousehold.Id, Name = "Gezinsbord voorbeeldgezin", TimeZoneId = "Europe/Amsterdam", OnboardingCompleted = true, CreatedUtc = AnchorUtc, UpdatedUtc = AnchorUtc });
        else { household.Name = "Gezinsbord voorbeeldgezin"; household.OnboardingCompleted = true; household.UpdatedUtc = AnchorUtc; }
    }

    private static void AddFamily(HomeOpsDbContext db) => db.FamilyMembers.AddRange(Member("alex", "Alex", FamilyMemberKind.Adult, "#f8c8dc", "A"), Member("sam", "Sam", FamilyMemberKind.Adult, "#c7d2fe", "S"), Member("riley", "Riley", FamilyMemberKind.Child, "#bbf7d0", "R"), Member("jordan", "Jordan", FamilyMemberKind.Child, "#fde68a", "J"));
    private static FamilyMember Member(string id, string name, FamilyMemberKind kind, string color, string initials) => new() { Id = id, HouseholdId = SeedHousehold.Id, Name = name, DisplayColor = color, Initials = initials, MemberKind = kind, DateOfBirth = kind == FamilyMemberKind.Child ? new DateOnly(id == "riley" ? 2017 : 2012, 4, 12) : null, CreatedUtc = AnchorUtc, UpdatedUtc = AnchorUtc };
    private static void AddCalendarSource(HomeOpsDbContext db) => db.EventSources.Add(new() { Id = CalendarSourceId, HouseholdId = SeedHousehold.Id, Name = "Gezinsagenda", SourceType = EventSourceTypes.Manual, IsWritable = true, IsSystem = true, CreatedUtc = AnchorUtc, UpdatedUtc = AnchorUtc });
    private static Guid Id(int i) => Guid.Parse($"77000000-0000-0000-0000-{i:000000000000}");

    private static void AddFull(HomeOpsDbContext db) { AddTasks(db, 10); AddShopping(db, true); AddGoals(db, FamilyCelebrationStatus.Celebrated); AddMoments(db, 5); AddEvents(db); }
    private static void AddMixed(HomeOpsDbContext db) { AddTasks(db, 5); AddShopping(db, false); AddGoals(db, FamilyCelebrationStatus.Planned); AddMoments(db, 2); }
    private static void AddChildYoung(HomeOpsDbContext db) { AddTasks(db, 4, "riley"); AddGoals(db, FamilyCelebrationStatus.Planned, "riley"); AddMoments(db, 3, "riley"); }
    private static void AddChildOlder(HomeOpsDbContext db) { AddTasks(db, 4, "jordan"); AddGoals(db, FamilyCelebrationStatus.ReadyToCelebrate, "jordan"); AddMoments(db, 3, "jordan"); }
    private static void AddWeeklyReset(HomeOpsDbContext db) { AddTasks(db, 8); AddShopping(db, true); AddGoals(db, FamilyCelebrationStatus.Celebrated); AddMoments(db, 4); }
    private static void AddShoppingLifecycle(HomeOpsDbContext db) { AddShopping(db, true); }

    private static void AddTasks(HomeOpsDbContext db, int count, string? member = null)
    {
        for (var i = 1; i <= count; i++) db.HouseholdTasks.Add(new() { Id = Id(100 + i), HouseholdId = SeedHousehold.Id, Title = i % 3 == 0 ? "Schooltas klaarzetten" : i % 2 == 0 ? "Was opvouwen" : "Ontbijtborden opruimen", DueDate = i % 4 == 0 ? null : Today.AddDays(i - 3), OwnershipKind = member is null ? TaskOwnershipKind.SharedHousehold : TaskOwnershipKind.FamilyMember, FamilyMemberId = member, IsCompleted = i % 5 == 0, CompletedUtc = i % 5 == 0 ? AnchorUtc.AddDays(-1) : null, NoDateReviewState = i % 4 == 0 ? NoDateTaskReviewState.NeedsReview : NoDateTaskReviewState.Active, CreatedUtc = AnchorUtc.AddDays(-30 + i), UpdatedUtc = AnchorUtc.AddDays(-7 + i), NoDateLastReviewedUtc = i % 4 == 0 ? AnchorUtc.AddDays(-22) : null });
    }

    private static void AddShopping(HomeOpsDbContext db, bool lifecycle)
    {
        var shopping = Id(200); db.Lists.Add(new() { Id = shopping, HouseholdId = SeedHousehold.Id, Name = "Boodschappen", CreatedUtc = AnchorUtc.AddDays(-10), UpdatedUtc = AnchorUtc });
        string[] items = ["Melk", "Appels", "Pasta", "Afwasmiddel", "Yoghurt", "Koffiebonen"];
        for (var i = 0; i < items.Length; i++) db.ListItems.Add(new() { Id = Id(201 + i), ListId = shopping, Text = items[i], PreferredStore = i % 2 == 0 ? "Albert Heijn" : "Buurtmarkt", IsCompleted = lifecycle && i is 2 or 4, CompletedUtc = lifecycle && i is 2 or 4 ? AnchorUtc.AddDays(-1) : null, IsDeleted = lifecycle && i == 5, DeletedUtc = lifecycle && i == 5 ? AnchorUtc.AddHours(-4) : null, CreatedUtc = AnchorUtc.AddDays(-6 + i), UpdatedUtc = AnchorUtc.AddDays(-1) });
        if (lifecycle) { db.Lists.Add(new() { Id = Id(220), HouseholdId = SeedHousehold.Id, Name = "Feestwinkel", IsArchived = true, ArchivedUtc = AnchorUtc.AddDays(-2), CreatedUtc = AnchorUtc.AddDays(-45), UpdatedUtc = AnchorUtc.AddDays(-35) }); db.ShoppingPurchaseHistories.Add(new() { Id = Id(230), HouseholdId = SeedHousehold.Id, NormalizedText = "melk", ItemText = "Melk", Store = "Albert Heijn", PurchaseCount = 4, CreatedUtc = AnchorUtc.AddDays(-40), UpdatedUtc = AnchorUtc.AddDays(-2) }); }
    }

    private static void AddGoals(HomeOpsDbContext db, FamilyCelebrationStatus status, string? focusMember = null)
    {
        db.MotivationFamilyGoals.Add(new() { Id = Id(300), HouseholdId = SeedHousehold.Id, Title = "Samen helpen deze week", TargetCount = 20, CurrentProgress = status == FamilyCelebrationStatus.ReadyToCelebrate ? 20 : 14, UnitLabel = "helpende momenten", CelebrationTitle = "Pannenkoekenontbijt", CelebrationDescription = "Vier samen een week vol hulp.", CelebrationStatus = status, CelebrationCelebratedUtc = status == FamilyCelebrationStatus.Celebrated ? AnchorUtc.AddDays(-2) : null, IsActive = true });
        foreach (var member in new[] { focusMember ?? "riley", "jordan" }.Distinct()) db.MotivationIndividualGoals.Add(new() { Id = Id(member == "riley" ? 301 : 302), HouseholdId = SeedHousehold.Id, FamilyMemberId = member, Title = member == "riley" ? "Rustige ochtendstart" : "Zelfstandig huiswerk", TargetCount = 5, CurrentProgress = member == focusMember ? 4 : 2, UnitLabel = "stappen", VisualKind = "stars", IsActive = true });
    }

    private static void AddMoments(HomeOpsDbContext db, int count, string? member = null)
    { for (var i = 1; i <= count; i++) db.HelpfulMoments.Add(new() { Id = Id(400 + i), HouseholdId = SeedHousehold.Id, FamilyMemberId = member ?? (i % 2 == 0 ? "jordan" : "riley"), Title = i % 2 == 0 ? "Hielp uit zichzelf mee" : "Lief opruimmoment", Description = i % 2 == 0 ? "Dacht er zelf aan en hielp meteen mee." : "Bleef rustig en hielp goed mee.", RecognitionTag = i % 2 == 0 ? HelpfulMomentTags.Initiative : HelpfulMomentTags.Kindness, CreatedUtc = AnchorUtc.AddDays(-i) }); }
    private static void AddEvents(HomeOpsDbContext db) => db.EventSeries.AddRange(new EventSeries { Id = Id(500), EventSourceId = CalendarSourceId, Title = "Gezinsreset", Description = "Wekelijkse gezinscheck", IsAllDay = false, StartDate = Today, StartTime = new TimeOnly(16, 0), EndDate = Today, EndTime = new TimeOnly(16, 45), CreatedUtc = AnchorUtc, UpdatedUtc = AnchorUtc }, new EventSeries { Id = Id(501), EventSourceId = CalendarSourceId, Title = "Schoolpicknick", IsAllDay = true, StartDate = Today.AddDays(2), EndDate = Today.AddDays(2), CreatedUtc = AnchorUtc, UpdatedUtc = AnchorUtc });
}
