using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Tasks;
using HomeOps.Api.WeeklyReset;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Lists;

public sealed class WeeklyResetApiTests
{
    [Fact]
    public async Task CurrentWeekIsCreatedOnceWithSnapshottedCandidatesAndRecap()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();

        var first = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        var second = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(first.Session.Id, second.Session.Id);
        Assert.Equal(first.Candidates.Select(item => item.Id), second.Candidates.Select(item => item.Id));
        Assert.Equal(WeeklyResetStatus.Open, first.Session.Status);
        Assert.Equal(first.Candidates.Count, first.Session.TotalCount);
        Assert.Contains(first.Candidates, item => item.CandidateType == WeeklyResetCandidateType.FamilyGoal);
        Assert.Contains(first.Candidates, item => item.CandidateType == WeeklyResetCandidateType.IndividualGoal);
        Assert.True(first.ContributionRecap.CompletedTaskCount >= 0);
    }

    [Fact]
    public async Task CandidateDecisionMutatesSourceAndPersistsProgressAcrossRefresh()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        await AddTaskCandidate(factory, "Boeken terugbrengen");
        var reset = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        var candidate = Assert.Single(reset!.Candidates, item => item.DisplayLabel == "Boeken terugbrengen");

        var response = await client.PostAsJsonAsync($"/api/weekly-reset/candidates/{candidate.Id}/decision", new DecideWeeklyResetCandidateRequest(WeeklyResetDecision.Later, "Gezin"));

        response.EnsureSuccessStatusCode();
        var decided = await response.Content.ReadFromJsonAsync<WeeklyResetCandidateDto>();
        Assert.Equal(WeeklyResetDecision.Later, decided!.Decision);
        Assert.Equal("Gezin", decided.ActorLabel);
        var refreshed = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        Assert.Equal(WeeklyResetDecision.Later, refreshed!.Candidates.Single(item => item.Id == candidate.Id).Decision);
        Assert.Equal(1, refreshed.Session.ResolvedCount);
        using var scope = factory.Services.CreateScope();
        var task = await scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>().HouseholdTasks.FindAsync(candidate.SourceId);
        Assert.Equal(NoDateTaskReviewState.Someday, task!.NoDateReviewState);
    }

    [Fact]
    public async Task EveryCandidateCanBeResolvedThenCompletedAndReviewedFromHistory()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        await AddTaskCandidate(factory, "Label blijft bewaard");
        var reset = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        Assert.NotNull(reset);

        var premature = await client.PostAsync("/api/weekly-reset/complete", null);
        Assert.Equal(HttpStatusCode.Conflict, premature.StatusCode);

        foreach (var candidate in reset.Candidates)
        {
            var decision = candidate.AllowedDecisions.Contains(WeeklyResetDecision.CarryForward)
                ? WeeklyResetDecision.CarryForward
                : candidate.AllowedDecisions.Single();
            var decisionResponse = await client.PostAsJsonAsync($"/api/weekly-reset/candidates/{candidate.Id}/decision", new DecideWeeklyResetCandidateRequest(decision, null));
            decisionResponse.EnsureSuccessStatusCode();
        }

        var completedResponse = await client.PostAsync("/api/weekly-reset/complete", null);
        completedResponse.EnsureSuccessStatusCode();
        var completed = await completedResponse.Content.ReadFromJsonAsync<WeeklyResetSessionDto>();
        Assert.Equal(WeeklyResetStatus.Completed, completed!.Status);
        Assert.Equal(WeeklyResetOutcome.Reviewed, completed.Outcome);
        Assert.Equal(completed.TotalCount, completed.ResolvedCount);

        var repeat = await client.PostAsync("/api/weekly-reset/complete", null);
        repeat.EnsureSuccessStatusCode();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var source = await db.HouseholdTasks.FindAsync(reset.Candidates.Single(item => item.DisplayLabel == "Label blijft bewaard").SourceId);
            source!.Title = "Bron is later gewijzigd";
            await db.SaveChangesAsync();
        }

        var history = await client.GetFromJsonAsync<WeeklyResetHistoryDto>("/api/weekly-reset/history");
        Assert.Contains(history!.Sessions, item => item.Id == completed.Id);
        var detail = await client.GetFromJsonAsync<WeeklyResetHistoryDetailDto>($"/api/weekly-reset/history/{completed.Id}");
        Assert.Contains(detail!.Candidates, item => item.DisplayLabel == "Label blijft bewaard");
        Assert.DoesNotContain(detail.Candidates, item => item.DisplayLabel == "Bron is later gewijzigd");
    }

    [Fact]
    public async Task MissingSourceGetsAnHonestAcknowledgeDecision()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        await AddTaskCandidate(factory, "Verdwenen taak");
        var reset = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        var candidate = reset!.Candidates.Single(item => item.DisplayLabel == "Verdwenen taak");
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            db.HouseholdTasks.Remove((await db.HouseholdTasks.FindAsync(candidate.SourceId))!);
            await db.SaveChangesAsync();
        }

        var refreshed = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        var stale = refreshed!.Candidates.Single(item => item.Id == candidate.Id);
        Assert.False(stale.SourceAvailable);
        Assert.Equal([WeeklyResetDecision.Acknowledge], stale.AllowedDecisions);
        var response = await client.PostAsJsonAsync($"/api/weekly-reset/candidates/{candidate.Id}/decision", new DecideWeeklyResetCandidateRequest(WeeklyResetDecision.Acknowledge, null));
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task SkipRequiresConfirmationAndSurvivesRefreshIdempotently()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var reset = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");

        var rejected = await client.PostAsJsonAsync("/api/weekly-reset/skip", new SkipWeeklyResetRequest(false, null));
        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
        var skippedResponse = await client.PostAsJsonAsync("/api/weekly-reset/skip", new SkipWeeklyResetRequest(true, null));
        skippedResponse.EnsureSuccessStatusCode();
        var repeated = await client.PostAsJsonAsync("/api/weekly-reset/skip", new SkipWeeklyResetRequest(true, null));
        repeated.EnsureSuccessStatusCode();

        var refreshed = await client.GetFromJsonAsync<WeeklyResetDto>("/api/weekly-reset");
        Assert.Equal(reset!.Session.Id, refreshed!.Session.Id);
        Assert.Equal(WeeklyResetStatus.Completed, refreshed.Session.Status);
        Assert.Equal(WeeklyResetOutcome.Skipped, refreshed.Session.Outcome);
        Assert.NotNull(refreshed.Session.CompletedUtc);
    }

    private static async Task AddTaskCandidate(HomeOpsWebApplicationFactory factory, string title)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var now = DateTimeOffset.UtcNow;
        db.HouseholdTasks.Add(new HouseholdTask
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            Title = title,
            DueDate = null,
            NoDateReviewState = NoDateTaskReviewState.NeedsReview,
            CreatedUtc = now.AddDays(-30),
            UpdatedUtc = now.AddDays(-30),
        });
        await db.SaveChangesAsync();
    }
}
