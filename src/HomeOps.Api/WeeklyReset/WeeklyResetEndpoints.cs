using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Motivation;
using HomeOps.Api.Tasks;
using HomeOps.Api.VisualReviewFixtures;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.WeeklyReset;

public static class WeeklyResetEndpoints
{
    public static IEndpointRouteBuilder MapWeeklyResetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/weekly-reset").WithTags("Weekly Reset");

        group.MapGet("/", async (
            HomeOpsDbContext dbContext,
            VisualReviewMarketingTimeProvider visualReviewTimeProvider,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var now = GetNow(visualReviewTimeProvider, timeProvider);
            var household = await dbContext.Households.AsNoTracking()
                .FirstAsync(item => item.Id == SeedHousehold.Id, cancellationToken);
            var weekStart = GetWeekStart(now, household.TimeZoneId);
            var session = await LoadSession(dbContext, weekStart, cancellationToken)
                ?? await CreateSession(dbContext, weekStart, now, cancellationToken);
            var candidates = await ToCandidateDtos(dbContext, session, cancellationToken);
            var recap = await LoadContributionRecap(dbContext, weekStart, household.TimeZoneId, cancellationToken);
            return Results.Ok(new WeeklyResetDto(ToSessionDto(session), candidates, recap));
        }).WithName("GetWeeklyReset").Produces<WeeklyResetDto>();

        group.MapGet("/history", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var sessions = await dbContext.WeeklyResetSessions.AsNoTracking()
                .Include(item => item.Candidates)
                .Where(item => item.HouseholdId == SeedHousehold.Id && item.Status == WeeklyResetStatus.Completed)
                .OrderByDescending(item => item.WeekStart)
                .Take(52)
                .ToListAsync(cancellationToken);
            return Results.Ok(new WeeklyResetHistoryDto(sessions.Select(ToSessionDto).ToList()));
        }).WithName("GetWeeklyResetHistory").Produces<WeeklyResetHistoryDto>();

        group.MapGet("/history/{sessionId:guid}", async (Guid sessionId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var session = await dbContext.WeeklyResetSessions.AsNoTracking()
                .Include(item => item.Candidates)
                .FirstOrDefaultAsync(item => item.Id == sessionId && item.HouseholdId == SeedHousehold.Id && item.Status == WeeklyResetStatus.Completed, cancellationToken);
            if (session is null) return Results.NotFound();
            var candidates = session.Candidates
                .OrderBy(item => item.CandidateType)
                .ThenBy(item => item.DisplayLabel)
                .Select(item => ToCandidateDto(item, false, []))
                .ToList();
            return Results.Ok(new WeeklyResetHistoryDetailDto(ToSessionDto(session), candidates));
        }).WithName("GetWeeklyResetHistoryDetail").Produces<WeeklyResetHistoryDetailDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/candidates/{candidateId:guid}/decision", async (
            Guid candidateId,
            DecideWeeklyResetCandidateRequest request,
            HomeOpsDbContext dbContext,
            VisualReviewMarketingTimeProvider visualReviewTimeProvider,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var actorValidation = ValidateActorLabel(request.ActorLabel);
            if (actorValidation is not null) return actorValidation;
            var candidate = await dbContext.WeeklyResetCandidates
                .Include(item => item.WeeklyResetSession)
                .FirstOrDefaultAsync(item => item.Id == candidateId && item.WeeklyResetSession!.HouseholdId == SeedHousehold.Id, cancellationToken);
            if (candidate is null) return Results.NotFound();
            if (candidate.WeeklyResetSession!.Status != WeeklyResetStatus.Open)
                return Results.Conflict(new { error = "Completed weekly resets are read-only." });

            var now = GetNow(visualReviewTimeProvider, timeProvider);
            if (candidate.Decision != request.Decision)
            {
                var allowed = await GetAllowedDecisions(dbContext, candidate, cancellationToken);
                if (!allowed.Contains(request.Decision))
                    return Results.ValidationProblem(new Dictionary<string, string[]> { ["decision"] = ["This decision is not valid for the candidate's current source state."] });
                var mutationError = await ApplyDecision(dbContext, candidate, request.Decision, now, cancellationToken);
                if (mutationError is not null) return mutationError;
                candidate.Decision = request.Decision;
                candidate.ActorLabel = NormalizeActorLabel(request.ActorLabel);
                candidate.DecidedUtc = now;
                candidate.WeeklyResetSession.UpdatedUtc = now;
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var refreshedAllowed = await GetAllowedDecisions(dbContext, candidate, cancellationToken);
            return Results.Ok(ToCandidateDto(candidate, SourceIsAvailable(refreshedAllowed), refreshedAllowed));
        }).WithName("DecideWeeklyResetCandidate").Produces<WeeklyResetCandidateDto>().ProducesValidationProblem().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        group.MapPost("/complete", async (
            HomeOpsDbContext dbContext,
            VisualReviewMarketingTimeProvider visualReviewTimeProvider,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var now = GetNow(visualReviewTimeProvider, timeProvider);
            var household = await dbContext.Households.AsNoTracking().FirstAsync(item => item.Id == SeedHousehold.Id, cancellationToken);
            var weekStart = GetWeekStart(now, household.TimeZoneId);
            var session = await LoadSession(dbContext, weekStart, cancellationToken)
                ?? await CreateSession(dbContext, weekStart, now, cancellationToken);
            if (session.Status == WeeklyResetStatus.Completed)
            {
                return session.Outcome == WeeklyResetOutcome.Reviewed
                    ? Results.Ok(ToSessionDto(session))
                    : Results.Conflict(new { error = "This week was already skipped." });
            }

            var unresolved = session.Candidates.Count(item => item.Decision is null);
            if (unresolved > 0) return Results.Conflict(new { error = "Resolve every weekly reset candidate before completing the week.", remainingCount = unresolved });
            Complete(session, WeeklyResetOutcome.Reviewed, now);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToSessionDto(session));
        }).WithName("CompleteWeeklyReset").Produces<WeeklyResetSessionDto>().Produces(StatusCodes.Status409Conflict);

        group.MapPost("/skip", async (
            SkipWeeklyResetRequest request,
            HomeOpsDbContext dbContext,
            VisualReviewMarketingTimeProvider visualReviewTimeProvider,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            if (!request.Confirmed)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["confirmed"] = ["Confirm that this week's reset should be skipped."] });
            var actorValidation = ValidateActorLabel(request.ActorLabel);
            if (actorValidation is not null) return actorValidation;
            var now = GetNow(visualReviewTimeProvider, timeProvider);
            var household = await dbContext.Households.AsNoTracking().FirstAsync(item => item.Id == SeedHousehold.Id, cancellationToken);
            var weekStart = GetWeekStart(now, household.TimeZoneId);
            var session = await LoadSession(dbContext, weekStart, cancellationToken)
                ?? await CreateSession(dbContext, weekStart, now, cancellationToken);
            if (session.Status == WeeklyResetStatus.Completed)
            {
                return session.Outcome == WeeklyResetOutcome.Skipped
                    ? Results.Ok(ToSessionDto(session))
                    : Results.Conflict(new { error = "This weekly reset was already completed." });
            }
            Complete(session, WeeklyResetOutcome.Skipped, now);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToSessionDto(session));
        }).WithName("SkipWeeklyReset").Produces<WeeklyResetSessionDto>().ProducesValidationProblem().Produces(StatusCodes.Status409Conflict);

        return app;
    }

    private static DateTimeOffset GetNow(VisualReviewMarketingTimeProvider visualReviewTimeProvider, TimeProvider timeProvider) =>
        visualReviewTimeProvider.ActiveMarketingAnchorUtc ?? timeProvider.GetUtcNow();

    private static DateOnly GetWeekStart(DateTimeOffset now, string timeZoneId)
    {
        var localDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(timeZoneId)).DateTime);
        var daysSinceMonday = ((int)localDate.DayOfWeek + 6) % 7;
        return localDate.AddDays(-daysSinceMonday);
    }

    private static Task<WeeklyResetSession?> LoadSession(HomeOpsDbContext dbContext, DateOnly weekStart, CancellationToken cancellationToken) =>
        dbContext.WeeklyResetSessions.Include(item => item.Candidates)
            .FirstOrDefaultAsync(item => item.HouseholdId == SeedHousehold.Id && item.WeekStart == weekStart, cancellationToken);

    private static async Task<WeeklyResetSession> CreateSession(HomeOpsDbContext dbContext, DateOnly weekStart, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var session = new WeeklyResetSession
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            WeekStart = weekStart,
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        var oldActiveTaskCutoff = now.AddDays(-21);
        var somedayCutoff = now.AddDays(-30);
        var tasks = await dbContext.HouseholdTasks.AsNoTracking()
            .Where(item => item.HouseholdId == SeedHousehold.Id && !item.IsCompleted && !item.IsExpired && item.NoDateReviewState != NoDateTaskReviewState.Archived)
            .Where(item => item.NoDateReviewState == NoDateTaskReviewState.NeedsReview
                || (item.NoDateReviewState == NoDateTaskReviewState.Active && (item.NoDateLastReviewedUtc ?? item.CreatedUtc) <= oldActiveTaskCutoff)
                || (item.NoDateReviewState == NoDateTaskReviewState.Someday && (item.NoDateLastReviewedUtc ?? item.UpdatedUtc) <= somedayCutoff))
            .OrderBy(item => item.NoDateReviewState == NoDateTaskReviewState.NeedsReview ? 0 : item.NoDateReviewState == NoDateTaskReviewState.Active ? 1 : 2)
            .ThenBy(item => item.NoDateLastReviewedUtc ?? item.CreatedUtc)
            .ToListAsync(cancellationToken);
        foreach (var task in tasks)
            session.Candidates.Add(Candidate(session.Id, WeeklyResetCandidateType.Task, task.Id, task.Title, "Taak zonder datum"));

        var familyGoals = await dbContext.MotivationFamilyGoals.AsNoTracking()
            .Where(item => item.HouseholdId == SeedHousehold.Id && item.IsActive)
            .OrderBy(item => item.Id)
            .ToListAsync(cancellationToken);
        foreach (var goal in familyGoals)
        {
            var progress = await MotivationProgress.GetProjectedAsync(dbContext, MotivationGoalType.Family, goal.Id, goal.TargetCount, goal.CurrentProgress, cancellationToken);
            session.Candidates.Add(Candidate(session.Id, WeeklyResetCandidateType.FamilyGoal, goal.Id, goal.Title, $"Gezinsdoel · {progress} / {goal.TargetCount} {goal.UnitLabel}"));
        }

        var individualGoals = await dbContext.MotivationIndividualGoals.AsNoTracking()
            .Include(item => item.FamilyMember)
            .Where(item => item.HouseholdId == SeedHousehold.Id && item.IsActive && item.FamilyMember != null && !item.FamilyMember.IsDeleted)
            .OrderBy(item => item.FamilyMember!.Name)
            .ToListAsync(cancellationToken);
        foreach (var goal in individualGoals)
        {
            var progress = await MotivationProgress.GetProjectedAsync(dbContext, MotivationGoalType.Individual, goal.Id, goal.TargetCount, goal.CurrentProgress, cancellationToken);
            session.Candidates.Add(Candidate(session.Id, WeeklyResetCandidateType.IndividualGoal, goal.Id, goal.Title, $"{goal.FamilyMember!.Name} · {progress} / {goal.TargetCount} {goal.UnitLabel}"));
        }

        var duplicateNames = await dbContext.Lists.AsNoTracking()
            .Where(item => item.HouseholdId == SeedHousehold.Id && !item.IsDeleted)
            .GroupBy(item => item.Name.ToLower())
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToListAsync(cancellationToken);
        var shoppingLists = await dbContext.Lists.AsNoTracking()
            .Where(item => item.HouseholdId == SeedHousehold.Id && !item.IsDeleted
                && (item.IsArchived || item.UpdatedUtc <= now.AddDays(-30) || duplicateNames.Contains(item.Name.ToLower())))
            .OrderByDescending(item => item.IsArchived)
            .ThenBy(item => item.UpdatedUtc)
            .Select(item => new { item.Id, item.Name, item.IsArchived, ItemCount = item.Items.Count(child => !child.IsDeleted) })
            .ToListAsync(cancellationToken);
        foreach (var list in shoppingLists)
        {
            var reason = list.IsArchived ? "staat al in het archief" : "is oud of lijkt op een ander lijstje";
            session.Candidates.Add(Candidate(session.Id, WeeklyResetCandidateType.ShoppingList, list.Id, list.Name, $"{list.ItemCount} items · {reason}"));
        }

        dbContext.WeeklyResetSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);
        return session;
    }

    private static WeeklyResetCandidate Candidate(Guid sessionId, WeeklyResetCandidateType type, Guid sourceId, string label, string context) => new()
    {
        Id = Guid.NewGuid(),
        WeeklyResetSessionId = sessionId,
        CandidateType = type,
        SourceId = sourceId,
        DisplayLabel = label,
        ContextLabel = context,
    };

    private static async Task<IReadOnlyCollection<WeeklyResetCandidateDto>> ToCandidateDtos(HomeOpsDbContext dbContext, WeeklyResetSession session, CancellationToken cancellationToken)
    {
        var result = new List<WeeklyResetCandidateDto>();
        foreach (var candidate in session.Candidates.OrderBy(item => item.CandidateType).ThenBy(item => item.DisplayLabel))
        {
            var allowed = session.Status == WeeklyResetStatus.Open
                ? await GetAllowedDecisions(dbContext, candidate, cancellationToken)
                : [];
            result.Add(ToCandidateDto(candidate, SourceIsAvailable(allowed), allowed));
        }
        return result;
    }

    private static async Task<IReadOnlyCollection<WeeklyResetDecision>> GetAllowedDecisions(HomeOpsDbContext dbContext, WeeklyResetCandidate candidate, CancellationToken cancellationToken)
    {
        switch (candidate.CandidateType)
        {
            case WeeklyResetCandidateType.Task:
            {
                var task = await dbContext.HouseholdTasks.AsNoTracking().FirstOrDefaultAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id && !item.IsCompleted && !item.IsExpired, cancellationToken);
                if (task is null) return [WeeklyResetDecision.Acknowledge];
                return task.RecurringTaskSeriesId is null
                    ? [WeeklyResetDecision.CarryForward, WeeklyResetDecision.Later, WeeklyResetDecision.Archive]
                    : [WeeklyResetDecision.CarryForward, WeeklyResetDecision.Later];
            }
            case WeeklyResetCandidateType.FamilyGoal:
                return await dbContext.MotivationFamilyGoals.AsNoTracking().AnyAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken)
                    ? [WeeklyResetDecision.CarryForward, WeeklyResetDecision.Archive]
                    : [WeeklyResetDecision.Acknowledge];
            case WeeklyResetCandidateType.IndividualGoal:
                return await dbContext.MotivationIndividualGoals.AsNoTracking().AnyAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken)
                    ? [WeeklyResetDecision.CarryForward, WeeklyResetDecision.Archive]
                    : [WeeklyResetDecision.Acknowledge];
            case WeeklyResetCandidateType.ShoppingList:
                return await dbContext.Lists.AsNoTracking().AnyAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id && !item.IsDeleted, cancellationToken)
                    ? [WeeklyResetDecision.CarryForward, WeeklyResetDecision.Archive]
                    : [WeeklyResetDecision.Acknowledge];
            default:
                return [WeeklyResetDecision.Acknowledge];
        }
    }

    private static async Task<IResult?> ApplyDecision(HomeOpsDbContext dbContext, WeeklyResetCandidate candidate, WeeklyResetDecision decision, DateTimeOffset now, CancellationToken cancellationToken)
    {
        switch (candidate.CandidateType)
        {
            case WeeklyResetCandidateType.Task:
            {
                var task = await dbContext.HouseholdTasks.FirstOrDefaultAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id && !item.IsCompleted && !item.IsExpired, cancellationToken);
                if (task is null) return decision == WeeklyResetDecision.Acknowledge ? null : Results.NotFound();
                if (decision == WeeklyResetDecision.CarryForward)
                {
                    task.NoDateReviewState = NoDateTaskReviewState.Active;
                    task.ArchivedUtc = null;
                    task.NoDateLastReviewedUtc = now;
                }
                else if (decision == WeeklyResetDecision.Later)
                {
                    task.DueDate = null;
                    task.NoDateReviewState = NoDateTaskReviewState.Someday;
                    task.ArchivedUtc = null;
                    task.NoDateLastReviewedUtc = now;
                }
                else if (decision == WeeklyResetDecision.Archive)
                {
                    task.NoDateReviewState = NoDateTaskReviewState.Archived;
                    task.ArchivedUtc = now;
                }
                task.UpdatedUtc = now;
                break;
            }
            case WeeklyResetCandidateType.FamilyGoal:
            {
                var goal = await dbContext.MotivationFamilyGoals.FirstOrDefaultAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
                if (goal is null) return decision == WeeklyResetDecision.Acknowledge ? null : Results.NotFound();
                goal.IsActive = decision != WeeklyResetDecision.Archive;
                break;
            }
            case WeeklyResetCandidateType.IndividualGoal:
            {
                var goal = await dbContext.MotivationIndividualGoals.FirstOrDefaultAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
                if (goal is null) return decision == WeeklyResetDecision.Acknowledge ? null : Results.NotFound();
                goal.IsActive = decision != WeeklyResetDecision.Archive;
                break;
            }
            case WeeklyResetCandidateType.ShoppingList:
            {
                var list = await dbContext.Lists.FirstOrDefaultAsync(item => item.Id == candidate.SourceId && item.HouseholdId == SeedHousehold.Id && !item.IsDeleted, cancellationToken);
                if (list is null) return decision == WeeklyResetDecision.Acknowledge ? null : Results.NotFound();
                if (decision == WeeklyResetDecision.Archive)
                {
                    list.IsArchived = true;
                    list.ArchivedUtc ??= now;
                    list.UpdatedUtc = now;
                }
                break;
            }
        }
        return null;
    }

    private static async Task<WeeklyContributionRecapDto> LoadContributionRecap(HomeOpsDbContext dbContext, DateOnly weekStart, string timeZoneId, CancellationToken cancellationToken)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var localStart = DateTime.SpecifyKind(weekStart.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified);
        var weekStartUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localStart, zone), TimeSpan.Zero);
        var completedTaskCount = await dbContext.HouseholdTasks.AsNoTracking()
            .CountAsync(item => item.HouseholdId == SeedHousehold.Id && item.IsCompleted && item.CompletedUtc >= weekStartUtc, cancellationToken);
        var helpfulMoments = await dbContext.HelpfulMoments.AsNoTracking()
            .Include(item => item.FamilyMember)
            .Where(item => item.HouseholdId == SeedHousehold.Id && item.CreatedUtc >= weekStartUtc && item.FamilyMember != null && !item.FamilyMember.IsDeleted)
            .OrderByDescending(item => item.CreatedUtc)
            .Take(8)
            .Select(item => new HelpfulMomentDto(item.Id, item.HouseholdId.ToString(), item.FamilyMemberId, item.FamilyMember!.Name, item.FamilyMember.DisplayColor, item.FamilyMember.Initials, item.Title, item.Description, item.RecognitionTag, item.CreatedUtc))
            .ToListAsync(cancellationToken);
        var memories = await dbContext.MotivationFamilyGoals.AsNoTracking()
            .Where(item => item.HouseholdId == SeedHousehold.Id && item.CelebrationStatus == FamilyCelebrationStatus.Celebrated && item.CelebrationCelebratedUtc >= weekStartUtc && item.CelebrationTitle != null)
            .OrderByDescending(item => item.CelebrationCelebratedUtc)
            .Select(item => new MotivationFamilyCelebrationMemoryDto(item.Id, item.CelebrationTitle!, item.CelebrationDescription, item.CelebrationCelebratedUtc!.Value))
            .ToListAsync(cancellationToken);
        return new WeeklyContributionRecapDto(completedTaskCount, helpfulMoments.Count, helpfulMoments, memories);
    }

    private static WeeklyResetSessionDto ToSessionDto(WeeklyResetSession session) => new(
        session.Id,
        session.WeekStart,
        session.WeekStart.AddDays(6),
        session.Status,
        session.Outcome,
        session.CreatedUtc,
        session.CompletedUtc,
        session.Candidates.Count(item => item.Decision is not null),
        session.Candidates.Count);

    private static WeeklyResetCandidateDto ToCandidateDto(WeeklyResetCandidate candidate, bool sourceAvailable, IReadOnlyCollection<WeeklyResetDecision> allowed) => new(
        candidate.Id,
        candidate.CandidateType,
        candidate.SourceId,
        candidate.DisplayLabel,
        candidate.ContextLabel,
        candidate.Decision,
        candidate.ActorLabel,
        candidate.DecidedUtc,
        sourceAvailable,
        allowed);

    private static bool SourceIsAvailable(IReadOnlyCollection<WeeklyResetDecision> allowed) =>
        allowed.Any(decision => decision != WeeklyResetDecision.Acknowledge);

    private static IResult? ValidateActorLabel(string? actorLabel) => actorLabel?.Trim().Length > 120
        ? Results.ValidationProblem(new Dictionary<string, string[]> { ["actorLabel"] = ["Actor label must be 120 characters or fewer."] })
        : null;

    private static string? NormalizeActorLabel(string? actorLabel) => string.IsNullOrWhiteSpace(actorLabel) ? null : actorLabel.Trim();

    private static void Complete(WeeklyResetSession session, WeeklyResetOutcome outcome, DateTimeOffset now)
    {
        session.Status = WeeklyResetStatus.Completed;
        session.Outcome = outcome;
        session.CompletedUtc = now;
        session.UpdatedUtc = now;
    }
}
