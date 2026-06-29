using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.Motivation;
using HomeOps.Api.Tasks;

namespace HomeOps.Api.VisualReviewFixtures;

internal static class MarketingHouseholdFixtureBuilder
{
    public static readonly DateTimeOffset AnchorUtc = new(2026, 6, 16, 7, 5, 0, TimeSpan.Zero);
    public static readonly DateTimeOffset WeeklyResetAnchorUtc = new(2026, 6, 21, 17, 35, 0, TimeSpan.Zero);
    private static readonly DateOnly CanonicalTuesday = new(2026, 6, 16);
    private static readonly Guid CalendarSourceId = Guid.Parse("88000000-0000-0000-0000-000000000001");

    public static DateTimeOffset GetAnchorUtc(MarketingScene scene) => scene is MarketingScene.WeeklyReset ? WeeklyResetAnchorUtc : AnchorUtc;

    public static void Add(HomeOpsDbContext db, MarketingScene scene)
    {
        var anchorUtc = GetAnchorUtc(scene);
        var household = db.Households.Local.FirstOrDefault(household => household.Id == SeedHousehold.Id);
        if (household is not null)
        {
            household.Name = "Van Zijl family";
            household.UpdatedUtc = anchorUtc;
        }
        AddFamily(db, anchorUtc);
        AddCalendarSource(db, anchorUtc);
        AddAgenda(db, scene, anchorUtc);
        AddTasks(db, scene, anchorUtc);
        AddShopping(db, scene, anchorUtc);
        AddMotivation(db, scene, anchorUtc);
    }

    private static Guid Id(int i) => Guid.Parse($"88000000-0000-0000-0000-{i:000000000000}");

    private static void AddFamily(HomeOpsDbContext db, DateTimeOffset anchorUtc) => db.FamilyMembers.AddRange(
        Member("dad", "Dad", FamilyMemberKind.Adult, "#93c5fd", "D", null, new() { HeadVariant = "oval", HairStyle = "softCrop", HairColor = "hairCocoa", ClothingStyle = "hoodie", ClothingColor = "shirtSky", Accessory = "none", AccessoryColor = "accessoryLilac" }, anchorUtc),
        Member("mom", "Mom", FamilyMemberKind.Adult, "#86efac", "M", null, new() { HeadVariant = "oval", HairStyle = "longSoft", HairColor = "hairChestnut", ClothingStyle = "sweater", ClothingColor = "shirtMint", Accessory = "none", AccessoryColor = "accessoryLilac" }, anchorUtc),
        Member("thomas", "Thomas", FamilyMemberKind.Child, "#60a5fa", "T", new DateOnly(2020, 4, 12), new() { HeadVariant = "round", HairStyle = "shortMessy", HairColor = "hairChestnut", ClothingStyle = "tShirt", ClothingColor = "shirtSky", Accessory = "star", AccessoryColor = "accessoryCoral" }, anchorUtc),
        Member("robin", "Robin", FamilyMemberKind.Child, "#fde68a", "R", new DateOnly(2024, 2, 8), new() { HeadVariant = "round", HairStyle = "curlyCloud", HairColor = "hairCocoa", ClothingStyle = "overall", ClothingColor = "shirtSun", Accessory = "none", AccessoryColor = "accessoryLilac" }, anchorUtc));

    private static FamilyMember Member(string id, string name, FamilyMemberKind kind, string color, string initials, DateOnly? dob, AvatarV2Config avatar, DateTimeOffset anchorUtc) => new() { Id = id, HouseholdId = SeedHousehold.Id, Name = name, DisplayColor = color, Initials = initials, MemberKind = kind, DateOfBirth = dob, AvatarV2Config = avatar, CreatedUtc = anchorUtc, UpdatedUtc = anchorUtc };

    private static void AddCalendarSource(HomeOpsDbContext db, DateTimeOffset anchorUtc) => db.EventSources.Add(new() { Id = CalendarSourceId, HouseholdId = SeedHousehold.Id, Name = "Van Zijl Family Calendar", SourceType = "manual", IsWritable = true, CreatedUtc = anchorUtc, UpdatedUtc = anchorUtc });

    private static void AddAgenda(HomeOpsDbContext db, MarketingScene scene, DateTimeOffset anchorUtc)
    {
        var events = new List<EventSeries>();
        void Event(int id, string title, DateOnly date, TimeOnly start, TimeOnly end, string? description = null) => events.Add(new() { Id = Id(id), EventSourceId = CalendarSourceId, Title = title, Description = description, StartDate = date, EndDate = date, StartTime = start, EndTime = end, CreatedUtc = anchorUtc, UpdatedUtc = anchorUtc });
        void AllDay(int id, string title, DateOnly date, string? description = null) => events.Add(new() { Id = Id(id), EventSourceId = CalendarSourceId, Title = title, Description = description, IsAllDay = true, StartDate = date, EndDate = date, CreatedUtc = anchorUtc, UpdatedUtc = anchorUtc });

        for (var day = 15; day <= 19; day++) Event(500 + day, "School Thomas", new DateOnly(2026, 6, day), new TimeOnly(8, 20), new TimeOnly(14, 45), "Groep 3 schoolweek voor Thomas.");
        foreach (var day in new[] { 15, 16, 18 }) Event(540 + day, "Daycare Robin", new DateOnly(2026, 6, day), new TimeOnly(8, 35), new TimeOnly(17, 15), "Reservekleren en knuffel mee.");
        Event(560, "Weekplanning ouders", new DateOnly(2026, 6, 15), new TimeOnly(19, 30), new TimeOnly(20, 0));
        Event(561, "Playdate: Thomas bij Noor", CanonicalTuesday, new TimeOnly(15, 15), new TimeOnly(17, 0), "Pickup at Noor's house at 17:00.");
        Event(562, "Snelle pasta voor zwemles", CanonicalTuesday, new TimeOnly(17, 30), new TimeOnly(18, 0));
        Event(563, "Zwemles Thomas", CanonicalTuesday, new TimeOnly(18, 15), new TimeOnly(18, 45), "Bring towel, goggles, and clean clothes.");
        Event(564, "Football training Thomas", new DateOnly(2026, 6, 17), new TimeOnly(16, 30), new TimeOnly(17, 30));
        Event(565, "Weekboodschappen", new DateOnly(2026, 6, 19), new TimeOnly(17, 0), new TimeOnly(17, 45));
        AllDay(566, "Bring library books to school", new DateOnly(2026, 6, 18));
        Event(567, "Football match/training", new DateOnly(2026, 6, 20), new TimeOnly(9, 30), new TimeOnly(10, 30));
        Event(568, "Noor's birthday party", new DateOnly(2026, 6, 20), new TimeOnly(11, 0), new TimeOnly(13, 0));
        Event(569, "Father's Day breakfast", new DateOnly(2026, 6, 21), new TimeOnly(10, 0), new TimeOnly(12, 0), "Pancake celebration if the goal is complete.");
        Event(570, "Weekly Reset", new DateOnly(2026, 6, 21), new TimeOnly(19, 30), new TimeOnly(19, 50), "Close the canonical marketing week.");
        if (scene is MarketingScene.Agenda) Event(571, "Oma Jolanda komt langs", new DateOnly(2026, 6, 18), new TimeOnly(15, 30), new TimeOnly(16, 30), "Natural extra event for demo recording.");
        db.EventSeries.AddRange(events);
    }

    private static void AddTasks(HomeOpsDbContext db, MarketingScene scene, DateTimeOffset anchorUtc)
    {
        var weeklyResetComplete = scene is MarketingScene.WeeklyReset;
        AddTask(db, 101, "Zwemtas klaarzetten", "dad", CanonicalTuesday, weeklyResetComplete || scene is MarketingScene.Motivation, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 102, "Fruitbakje en drinkbeker school", "mom", CanonicalTuesday, weeklyResetComplete, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 103, "Cadeau voor Noor inpakken", "thomas", CanonicalTuesday, weeklyResetComplete, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 104, "Reservekleren daycare tas", "mom", CanonicalTuesday, weeklyResetComplete, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 105, "Pasta saus uit vriezer halen", "dad", CanonicalTuesday, scene is not MarketingScene.Tasks, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 106, "Football shirt wassen", "dad", CanonicalTuesday.AddDays(1), weeklyResetComplete, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 107, "Bibliotheekboeken zoeken", "thomas", CanonicalTuesday.AddDays(1), weeklyResetComplete, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 108, "Daycare forms checken", "mom", CanonicalTuesday.AddDays(1), false, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 109, "Cadeauzakje en kaart voor Noor kopen", "mom", new DateOnly(2026, 6, 19), weeklyResetComplete, TaskOwnershipKind.FamilyMember, anchorUtc);
        AddTask(db, 110, "Father's Day pancake ingredients checken", null, new DateOnly(2026, 6, 20), weeklyResetComplete, TaskOwnershipKind.SharedHousehold, anchorUtc);
        AddTask(db, 111, "Picknickkleed wassen", "dad", new DateOnly(2026, 6, 25), false, TaskOwnershipKind.FamilyMember, anchorUtc);
    }

    private static void AddTask(HomeOpsDbContext db, int id, string title, string? member, DateOnly due, bool complete, TaskOwnershipKind ownership, DateTimeOffset anchorUtc) => db.HouseholdTasks.Add(new() { Id = Id(id), HouseholdId = SeedHousehold.Id, Title = title, DueDate = due, OwnershipKind = ownership, FamilyMemberId = member, IsCompleted = complete, CompletedUtc = complete ? anchorUtc.AddDays(-1).AddMinutes(id - 100) : null, CreatedUtc = AnchorUtc.AddDays(-4), UpdatedUtc = anchorUtc });

    private static void AddShopping(HomeOpsDbContext db, MarketingScene scene, DateTimeOffset anchorUtc)
    {
        var shopping = Id(200); db.Lists.Add(new() { Id = shopping, HouseholdId = SeedHousehold.Id, Name = "Boodschappen", CreatedUtc = AnchorUtc.AddDays(-6), UpdatedUtc = AnchorUtc });
        (string Store, string[] Items)[] groups = [("Albert Heijn", ["Volkoren pasta", "Passata", "Bloem", "Vanillesuiker", "Griekse yoghurt", "Koffiefilters"]), ("Jumbo", ["Mini wraps", "Milde geraspte kaas", "Komkommer", "Appelsap pakjes", "Zwemluiers voor Robin"]), ("Kruidvat", ["Kindertandpasta", "Kids sunscreen SPF 50", "Pleisters"]), ("Bakker", ["Croissants voor Vaderdag", "Zachte bolletjes voor zaterdag"]), ("HEMA", ["Verjaardagskaart voor Noor", "Sticker sheet voor Thomas", "Cadeauzakje", "Roomboter", "Chocoladestukjes"])];
        var id = 201;
        foreach (var (store, items) in groups) foreach (var item in items) db.ListItems.Add(new() { Id = Id(id++), ListId = shopping, Text = item, PreferredStore = store, IsCompleted = scene is MarketingScene.WeeklyReset && store is "Albert Heijn" && item.Contains("pasta", StringComparison.OrdinalIgnoreCase), CompletedUtc = scene is MarketingScene.WeeklyReset ? anchorUtc.AddDays(-1) : null, CreatedUtc = AnchorUtc.AddDays(-3), UpdatedUtc = AnchorUtc });
    }

    private static void AddMotivation(HomeOpsDbContext db, MarketingScene scene, DateTimeOffset anchorUtc)
    {
        var complete = scene is MarketingScene.WeeklyReset;
        db.MotivationFamilyGoals.Add(new() { Id = Id(300), HouseholdId = SeedHousehold.Id, Title = "20 helpful moments before Sunday pancake breakfast", TargetCount = 20, CurrentProgress = complete ? 20 : 12, UnitLabel = "helpful moments", CelebrationTitle = "Sunday pancake breakfast", CelebrationDescription = "Celebrate a week of helping together.", CelebrationStatus = complete ? FamilyCelebrationStatus.Celebrated : FamilyCelebrationStatus.Planned, CelebrationCelebratedUtc = complete ? new DateTimeOffset(2026, 6, 21, 10, 30, 0, TimeSpan.Zero) : null, IsActive = true });
        db.MotivationIndividualGoals.AddRange(
            new MotivationIndividualGoal { Id = Id(301), HouseholdId = SeedHousehold.Id, FamilyMemberId = "thomas", Title = "Read together 4 times this week", TargetCount = 4, CurrentProgress = complete ? 4 : 2, UnitLabel = "reads", VisualKind = "stars", IsActive = true },
            new MotivationIndividualGoal { Id = Id(302), HouseholdId = SeedHousehold.Id, FamilyMemberId = "robin", Title = "Smooth daycare goodbyes", TargetCount = 3, CurrentProgress = complete ? 3 : 1, UnitLabel = "calm mornings", VisualKind = "stars", IsActive = true });
        AddMoment(db, 401, "Thomas helped Robin find bunny", "Thomas helped Robin find her bunny before daycare, even though his own shoes were still missing.", "thomas", HelpfulMomentTags.Kindness, -1, anchorUtc);
        AddMoment(db, 402, "Mom packed the daycare bag early", "Dad appreciated Mom for packing the daycare bag before breakfast when Robin had a hard morning.", "mom", HelpfulMomentTags.Teamwork, -2, anchorUtc);
        AddMoment(db, 403, "Towel and goggles by the door", "Mom appreciated Dad for keeping swimming calm by putting the towel and goggles near the door.", "dad", HelpfulMomentTags.Responsibility, -3, anchorUtc);
        AddMoment(db, 404, "Grocery bags back on the hook", "Mom appreciated Thomas for putting the grocery bags back on the hallway hook.", "thomas", HelpfulMomentTags.Initiative, -4, anchorUtc);
        if (complete || scene is MarketingScene.Motivation) AddMoment(db, 405, "Robin tried shoes by herself", "Dad appreciated Robin for trying to put her shoes by the mat, even though they were on the wrong feet.", "robin", HelpfulMomentTags.Routine, -5, anchorUtc);
    }

    private static void AddMoment(HomeOpsDbContext db, int id, string title, string description, string member, string tag, int days, DateTimeOffset anchorUtc) => db.HelpfulMoments.Add(new() { Id = Id(id), HouseholdId = SeedHousehold.Id, FamilyMemberId = member, Title = title, Description = description, RecognitionTag = tag, CreatedUtc = anchorUtc.AddDays(days) });
}

internal enum MarketingScene { Home, Family, Agenda, Tasks, Shopping, Motivation, WeeklyReset, Settings }
