using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Tasks;

namespace HomeOps.Api.Tests.Lists;

public sealed class TaskTemplateApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task StarterTemplatesAreAvailable()
    {
        var templates = await _client.GetFromJsonAsync<IReadOnlyCollection<TaskTemplateDto>>("/api/task-templates");

        Assert.NotNull(templates);
        Assert.Contains(templates, template => template.Name == "Morning Routine" && template.Items.Any(item => item.Title == "Brush teeth"));
        Assert.Contains(templates, template => template.Name == "Kitchen Reset" && template.Items.Any(item => item.Title == "Wipe counters"));
    }

    [Fact]
    public async Task TemplateCanBeCreatedAndEdited()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/task-templates", new CreateTaskTemplateRequest("Weekend Reset", "Saturday chores", new[]
        {
            new TaskTemplateItemRequest("Vacuum", TaskOwnershipKind.SharedHousehold, null, TaskRecurrenceFrequency.None, 0),
        }));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<TaskTemplateDto>();
        Assert.NotNull(created);

        var updateResponse = await _client.PutAsJsonAsync($"/api/task-templates/{created.Id}", new UpdateTaskTemplateRequest("Weekend Reset Updated", null, true, new[]
        {
            new TaskTemplateItemRequest("Vacuum downstairs", TaskOwnershipKind.FamilyMember, "riley", TaskRecurrenceFrequency.Weekly, 1),
            new TaskTemplateItemRequest("Take out trash", TaskOwnershipKind.Unassigned, null, TaskRecurrenceFrequency.None, null),
        }));

        updateResponse.EnsureSuccessStatusCode();
        var updated = await updateResponse.Content.ReadFromJsonAsync<TaskTemplateDto>();
        Assert.NotNull(updated);
        Assert.Equal("Weekend Reset Updated", updated.Name);
        Assert.Equal(2, updated.Items.Count);
        Assert.Contains(updated.Items, item => item.Title == "Vacuum downstairs" && item.FamilyMemberId == "riley" && item.RecurrenceFrequency == TaskRecurrenceFrequency.Weekly && item.DueOffsetDays == 1);
    }

    [Fact]
    public async Task TemplateCanBeArchivedAndDisappearsFromNormalSelection()
    {
        var created = await CreateTemplate("Archive Me", new TaskTemplateItemRequest("Temporary task", null, null, null, null));

        var archiveResponse = await _client.PostAsync($"/api/task-templates/{created.Id}/archive", null);
        Assert.Equal(HttpStatusCode.NoContent, archiveResponse.StatusCode);

        var templates = await _client.GetFromJsonAsync<IReadOnlyCollection<TaskTemplateDto>>("/api/task-templates");
        Assert.DoesNotContain(templates!, template => template.Id == created.Id);
    }

    [Fact]
    public async Task ApplyingTemplateCreatesNormalTasksAndCanBeRepeated()
    {
        var created = await CreateTemplate("Apply Me", new TaskTemplateItemRequest("One-off chore", TaskOwnershipKind.SharedHousehold, null, TaskRecurrenceFrequency.None, 2));

        var first = await _client.PostAsJsonAsync($"/api/task-templates/{created.Id}/apply", new ApplyTaskTemplateRequest(new DateOnly(2026, 6, 20)));
        var second = await _client.PostAsJsonAsync($"/api/task-templates/{created.Id}/apply", new ApplyTaskTemplateRequest(new DateOnly(2026, 6, 20)));
        first.EnsureSuccessStatusCode(); second.EnsureSuccessStatusCode();

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        Assert.Equal(2, tasks!.Count(task => task.Title == "One-off chore" && task.DueDate == new DateOnly(2026, 6, 22) && task.RecurringTaskSeriesId is null));
    }

    [Fact]
    public async Task ApplyingRecurringTemplateItemCreatesRecurringTaskSeries()
    {
        var created = await CreateTemplate("Recurring Template", new TaskTemplateItemRequest("Feed pet", TaskOwnershipKind.FamilyMember, "riley", TaskRecurrenceFrequency.Daily, 0));

        var apply = await _client.PostAsJsonAsync($"/api/task-templates/{created.Id}/apply", new ApplyTaskTemplateRequest(new DateOnly(2026, 6, 20)));
        apply.EnsureSuccessStatusCode();
        var result = await apply.Content.ReadFromJsonAsync<ApplyTaskTemplateResponse>();

        var tasks = await _client.GetFromJsonAsync<IReadOnlyCollection<HouseholdTaskDto>>("/api/tasks");
        var seriesId = result!.CreatedTasks.Single().RecurringTaskSeriesId;
        Assert.NotNull(seriesId);
        Assert.Contains(tasks!, task => task.RecurringTaskSeriesId == seriesId && task.RecurrenceFrequency == TaskRecurrenceFrequency.Daily && task.FamilyMemberId == "riley");
        Assert.True(tasks!.Count(task => task.RecurringTaskSeriesId == seriesId) > 1);
    }

    private async Task<TaskTemplateDto> CreateTemplate(string name, params TaskTemplateItemRequest[] items)
    {
        var response = await _client.PostAsJsonAsync("/api/task-templates", new CreateTaskTemplateRequest(name, null, items));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TaskTemplateDto>())!;
    }
}
