using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;
using HomeOps.Api.Lists;
using HomeOps.Api.Motivation;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.VisualReviewFixtures;

public static class LegacySeedTestFixture
{
    public static async Task ApplyAsync(HomeOpsDbContext dbContext, CancellationToken cancellationToken = default)
    {
        if (await HasHouseholdContentAsync(dbContext, cancellationToken))
        {
            return;
        }

        var household = await dbContext.Households.SingleAsync(
            candidate => candidate.Id == SeedHousehold.Id,
            cancellationToken);
        household.Name = SeedHousehold.Name;
        household.OnboardingCompleted = true;
        household.LegacyDemoDataReviewRequired = false;
        household.UpdatedUtc = SeedLists.SeededUtc;

        dbContext.Lists.AddRange(
            DemoList(SeedLists.ShoppingListId, "Shopping"),
            DemoList(SeedLists.VacationPackingListId, "Vacation Packing"));
        dbContext.ListItems.AddRange(
            DemoItem(SeedLists.BreadItemId, SeedLists.ShoppingListId, "Bread"),
            DemoItem(SeedLists.MilkItemId, SeedLists.ShoppingListId, "Milk"),
            DemoItem(SeedLists.CoffeeItemId, SeedLists.ShoppingListId, "Coffee"),
            DemoItem(SeedLists.PassportItemId, SeedLists.VacationPackingListId, "Passport"),
            DemoItem(SeedLists.ChargersItemId, SeedLists.VacationPackingListId, "Chargers"),
            DemoItem(SeedLists.SwimwearItemId, SeedLists.VacationPackingListId, "Swimwear"));

        dbContext.FamilyMembers.AddRange(
            DemoMember("alex", "Alex", "#f8c8dc", "A", FamilyMemberKind.Adult, null),
            DemoMember("sam", "Sam", "#c7d2fe", "S", FamilyMemberKind.Adult, null),
            DemoMember("riley", "Riley", "#bbf7d0", "R", FamilyMemberKind.Child, new DateOnly(2018, 4, 12)),
            DemoMember("jordan", "Jordan", "#fde68a", "J", FamilyMemberKind.Child, new DateOnly(2020, 9, 3)));

        dbContext.MotivationFamilyGoals.Add(new MotivationFamilyGoal
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
        dbContext.MotivationIndividualGoals.AddRange(
            DemoIndividualGoal(SeedMotivation.AlexGoalId, "alex", "Finish morning routine", 5, 3, "checkmarks", "checkmarks"),
            DemoIndividualGoal(SeedMotivation.SamGoalId, "sam", "Help with dinner", 3, 2, "stars", "stars"),
            DemoIndividualGoal(SeedMotivation.RileyGoalId, "riley", "Tidy bedroom corner", 4, 2, "steps", "progress"),
            DemoIndividualGoal(SeedMotivation.JordanGoalId, "jordan", "Notice one helpful thing", 3, 1, "stars", "stars"));
        dbContext.MotivationProgressLedgerEntries.AddRange(
            Baseline(MotivationGoalType.Family, SeedMotivation.FamilyGoalId, 13),
            Baseline(MotivationGoalType.Individual, SeedMotivation.AlexGoalId, 3),
            Baseline(MotivationGoalType.Individual, SeedMotivation.SamGoalId, 2),
            Baseline(MotivationGoalType.Individual, SeedMotivation.RileyGoalId, 2),
            Baseline(MotivationGoalType.Individual, SeedMotivation.JordanGoalId, 1));

        dbContext.EventSeries.AddRange(
            DemoEvent(SeedCalendarEvents.DentistAppointmentId, "Dentist Appointment", "Routine check-up", new DateTimeOffset(2026, 6, 18, 9, 30, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 18, 10, 15, 0, TimeSpan.Zero), false),
            DemoEvent(SeedCalendarEvents.ParentEveningId, "Parent Evening", "School hall", new DateTimeOffset(2026, 6, 19, 18, 30, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 19, 20, 0, 0, TimeSpan.Zero), false),
            DemoEvent(SeedCalendarEvents.VacationId, "Vacation", "Family trip", new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero), new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero), true),
            DemoEvent(SeedCalendarEvents.PutBinsOutsideId, "Put Bins Outside", null, new DateTimeOffset(2026, 6, 21, 20, 0, 0, TimeSpan.Zero), new DateTimeOffset(2026, 6, 21, 20, 10, 0, TimeSpan.Zero), false));

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task<bool> HasHouseholdContentAsync(HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        await dbContext.FamilyMembers.AnyAsync(cancellationToken) ||
        await dbContext.Lists.AnyAsync(cancellationToken) ||
        await dbContext.MotivationFamilyGoals.AnyAsync(cancellationToken) ||
        await dbContext.MotivationIndividualGoals.AnyAsync(cancellationToken) ||
        await dbContext.EventSeries.AnyAsync(cancellationToken);

    private static Lists.List DemoList(Guid id, string name) => new()
    {
        Id = id,
        HouseholdId = SeedHousehold.Id,
        Name = name,
        CreatedUtc = SeedLists.SeededUtc,
        UpdatedUtc = SeedLists.SeededUtc,
    };

    private static ListItem DemoItem(Guid id, Guid listId, string text) => new()
    {
        Id = id,
        ListId = listId,
        Text = text,
        CreatedUtc = SeedLists.SeededUtc,
        UpdatedUtc = SeedLists.SeededUtc,
    };

    private static FamilyMember DemoMember(
        string id,
        string name,
        string displayColor,
        string initials,
        FamilyMemberKind memberKind,
        DateOnly? dateOfBirth) => new()
    {
        Id = id,
        HouseholdId = SeedHousehold.Id,
        Name = name,
        DisplayColor = displayColor,
        Initials = initials,
        MemberKind = memberKind,
        DateOfBirth = dateOfBirth,
        CreatedUtc = SeedFamilyMembers.SeededUtc,
        UpdatedUtc = SeedFamilyMembers.SeededUtc,
    };

    private static MotivationIndividualGoal DemoIndividualGoal(
        Guid id,
        string familyMemberId,
        string title,
        int targetCount,
        int currentProgress,
        string unitLabel,
        string visualKind) => new()
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

    private static MotivationProgressLedgerEntry Baseline(MotivationGoalType goalType, Guid goalId, int progress) =>
        new(Guid.NewGuid(), SeedHousehold.Id, goalType, goalId, MotivationProgressSourceType.MigrationBaseline, goalId.ToString("D"), progress, SeedMotivation.SeededUtc, MotivationProgress.BaselineReason);

    private static EventSeries DemoEvent(
        Guid id,
        string title,
        string? description,
        DateTimeOffset startUtc,
        DateTimeOffset? endUtc,
        bool isAllDay) => new()
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
}
