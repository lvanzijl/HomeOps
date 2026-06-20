using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tasks;

public static class TaskTemplateEndpoints
{
    private const int GenerationHorizonDays = 60;

    public static IEndpointRouteBuilder MapTaskTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/task-templates").WithTags("Task Templates");

        group.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var templates = await dbContext.TaskTemplates.AsNoTracking().Include(template => template.Items)
                .Where(template => template.HouseholdId == SeedHousehold.Id && !template.IsArchived)
                .OrderBy(template => template.Name).Select(template => ToDto(template)).ToListAsync(cancellationToken);
            return Results.Ok(templates);
        }).WithName("GetTaskTemplates").Produces<IReadOnlyCollection<TaskTemplateDto>>();

        group.MapPost("/", async (CreateTaskTemplateRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = await ValidateTemplate(request.Name, request.Items, dbContext, cancellationToken);
            if (validation.Error is not null) return Results.BadRequest(new { error = validation.Error });
            var now = DateTimeOffset.UtcNow;
            var template = new TaskTemplate { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = validation.Name, Description = Clean(request.Description), CreatedUtc = now, UpdatedUtc = now };
            AddItems(template, validation.Items, now);
            dbContext.TaskTemplates.Add(template);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/task-templates/{template.Id}", ToDto(template));
        }).WithName("CreateTaskTemplate").Produces<TaskTemplateDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{templateId:guid}", async (Guid templateId, UpdateTaskTemplateRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var template = await dbContext.TaskTemplates.Include(t => t.Items).FirstOrDefaultAsync(t => t.Id == templateId && t.HouseholdId == SeedHousehold.Id, cancellationToken);
            if (template is null) return Results.NotFound();
            var validation = await ValidateTemplate(request.Name, request.Items, dbContext, cancellationToken);
            if (validation.Error is not null) return Results.BadRequest(new { error = validation.Error });
            template.Name = validation.Name; template.Description = Clean(request.Description); template.IsArchived = request.Active == false; template.UpdatedUtc = DateTimeOffset.UtcNow;
            var existingItems = template.Items.OrderBy(item => item.Position).ToList();
            var requestedItems = validation.Items.ToList();
            for (var index = 0; index < requestedItems.Count; index++)
            {
                var requestItem = requestedItems[index];
                var item = index < existingItems.Count ? existingItems[index] : new TaskTemplateItem { Id = Guid.NewGuid(), TaskTemplateId = template.Id };
                item.Title = requestItem.Title.Trim(); item.OwnershipKind = requestItem.OwnershipKind ?? TaskOwnershipKind.Unassigned; item.FamilyMemberId = item.OwnershipKind == TaskOwnershipKind.FamilyMember ? Clean(requestItem.FamilyMemberId) : null; item.RecurrenceFrequency = requestItem.RecurrenceFrequency ?? TaskRecurrenceFrequency.None; item.DueOffsetDays = requestItem.DueOffsetDays; item.Position = index;
                if (index >= existingItems.Count) dbContext.TaskTemplateItems.Add(item);
            }
            if (existingItems.Count > requestedItems.Count) dbContext.TaskTemplateItems.RemoveRange(existingItems.Skip(requestedItems.Count));
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(template));
        }).WithName("UpdateTaskTemplate").Produces<TaskTemplateDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{templateId:guid}/archive", async (Guid templateId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var template = await dbContext.TaskTemplates.FirstOrDefaultAsync(t => t.Id == templateId && t.HouseholdId == SeedHousehold.Id, cancellationToken);
            if (template is null) return Results.NotFound();
            template.IsArchived = true; template.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("ArchiveTaskTemplate").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{templateId:guid}/apply", async (Guid templateId, ApplyTaskTemplateRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var template = await dbContext.TaskTemplates.Include(t => t.Items).FirstOrDefaultAsync(t => t.Id == templateId && t.HouseholdId == SeedHousehold.Id && !t.IsArchived, cancellationToken);
            if (template is null) return Results.NotFound();
            var startDate = request.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            var created = new List<HouseholdTask>();
            foreach (var item in template.Items.OrderBy(item => item.Position))
            {
                var dueDate = item.DueOffsetDays is null ? (DateOnly?)null : startDate.AddDays(item.DueOffsetDays.Value);
                if (item.RecurrenceFrequency == TaskRecurrenceFrequency.None)
                {
                    var task = CreateTask(item.Title, dueDate, item.OwnershipKind, item.FamilyMemberId, null, TaskRecurrenceFrequency.None);
                    dbContext.HouseholdTasks.Add(task); created.Add(task);
                }
                else
                {
                    var series = new RecurringTaskSeries { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = item.Title, StartDate = dueDate ?? startDate, Frequency = item.RecurrenceFrequency, OwnershipKind = item.OwnershipKind, FamilyMemberId = item.FamilyMemberId, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow };
                    dbContext.RecurringTaskSeries.Add(series);
                    var first = CreateTask(item.Title, series.StartDate, item.OwnershipKind, item.FamilyMemberId, series.Id, item.RecurrenceFrequency);
                    dbContext.HouseholdTasks.Add(first); created.Add(first);
                    for (var due = NextDueDate(series.StartDate, series.Frequency); due <= startDate.AddDays(GenerationHorizonDays); due = NextDueDate(due, series.Frequency)) dbContext.HouseholdTasks.Add(CreateTask(item.Title, due, item.OwnershipKind, item.FamilyMemberId, series.Id, item.RecurrenceFrequency));
                }
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new ApplyTaskTemplateResponse(template.Id, created.Select(ToTaskDto).ToList()));
        }).WithName("ApplyTaskTemplate").Produces<ApplyTaskTemplateResponse>().Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static void AddItems(TaskTemplate template, IReadOnlyCollection<TaskTemplateItemRequest> items, DateTimeOffset now)
    {
        var position = 0;
        foreach (var item in items) template.Items.Add(new TaskTemplateItem { Id = Guid.NewGuid(), TaskTemplateId = template.Id, Title = item.Title.Trim(), OwnershipKind = item.OwnershipKind ?? TaskOwnershipKind.Unassigned, FamilyMemberId = item.OwnershipKind == TaskOwnershipKind.FamilyMember ? Clean(item.FamilyMemberId) : null, RecurrenceFrequency = item.RecurrenceFrequency ?? TaskRecurrenceFrequency.None, DueOffsetDays = item.DueOffsetDays, Position = position++ });
    }

    private static async Task<(string Name, IReadOnlyCollection<TaskTemplateItemRequest> Items, string? Error)> ValidateTemplate(string nameInput, IReadOnlyCollection<TaskTemplateItemRequest> items, HomeOpsDbContext dbContext, CancellationToken cancellationToken)
    {
        var name = nameInput.Trim(); if (name.Length == 0) return (name, items, "Template name is required.");
        if (items.Count == 0) return (name, items, "Template must contain at least one task.");
        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.Title)) return (name, items, "Template task title is required.");
            var member = Clean(item.FamilyMemberId); var kind = item.OwnershipKind ?? TaskOwnershipKind.Unassigned;
            if (kind == TaskOwnershipKind.FamilyMember && member is null) return (name, items, "Family member id is required for assigned template tasks.");
            if (kind == TaskOwnershipKind.FamilyMember && !await dbContext.FamilyMembers.AnyAsync(m => m.Id == member && m.HouseholdId == SeedHousehold.Id && !m.IsDeleted, cancellationToken)) return (name, items, "Family member id must reference an existing family member.");
            if (item.DueOffsetDays is < 0 or > 365) return (name, items, "Due timing must be between 0 and 365 days.");
        }
        return (name, items, null);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static HouseholdTask CreateTask(string title, DateOnly? dueDate, TaskOwnershipKind ownershipKind, string? familyMemberId, Guid? seriesId, TaskRecurrenceFrequency frequency) { var now = DateTimeOffset.UtcNow; return new HouseholdTask { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Title = title, DueDate = dueDate, OwnershipKind = ownershipKind, FamilyMemberId = familyMemberId, RecurringTaskSeriesId = seriesId, RecurrenceFrequency = frequency, CreatedUtc = now, UpdatedUtc = now }; }
    private static DateOnly NextDueDate(DateOnly date, TaskRecurrenceFrequency frequency) => frequency switch { TaskRecurrenceFrequency.Daily => date.AddDays(1), TaskRecurrenceFrequency.Weekly => date.AddDays(7), TaskRecurrenceFrequency.Monthly => date.AddMonths(1), _ => date.AddYears(100) };
    private static HouseholdTaskDto ToTaskDto(HouseholdTask task) => new(task.Id, task.Title, task.DueDate, task.OwnershipKind, task.FamilyMemberId, task.IsCompleted, task.CompletedUtc, task.CreatedUtc, task.UpdatedUtc, task.RecurringTaskSeriesId, task.RecurrenceFrequency);
    private static TaskTemplateDto ToDto(TaskTemplate template) => new(template.Id, template.Name, template.Description, !template.IsArchived, template.CreatedUtc, template.UpdatedUtc, template.Items.OrderBy(i => i.Position).Select(i => new TaskTemplateItemDto(i.Id, i.Title, i.OwnershipKind, i.FamilyMemberId, i.RecurrenceFrequency, i.DueOffsetDays, i.Position)).ToList());
}
