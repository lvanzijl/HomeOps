using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Lists;

public static class ListEndpoints
{
    public static IEndpointRouteBuilder MapListEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lists").WithTags("Lists");

        group.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var lists = await dbContext.Lists
                .AsNoTracking()
                .Where(list => list.HouseholdId == SeedHousehold.Id)
                .OrderBy(list => list.Name)
                .Select(list => new ListSummaryDto(
                    list.Id,
                    list.Name,
                    list.CreatedUtc,
                    list.UpdatedUtc,
                    list.HouseholdId,
                    list.Items.Count))
                .ToListAsync(cancellationToken);

            return Results.Ok(lists);
        }).WithName("GetLists").Produces<IReadOnlyCollection<ListSummaryDto>>();

        group.MapGet("/{listId:guid}", async (Guid listId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var list = await LoadList(dbContext, listId, cancellationToken);
            return list is null ? Results.NotFound() : Results.Ok(list);
        }).WithName("GetListById").Produces<ListDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateListRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var trimmedName = request.Name.Trim();
            if (trimmedName.Length == 0)
            {
                return Results.BadRequest(new { error = "List name is required." });
            }

            var now = DateTimeOffset.UtcNow;
            var list = new List
            {
                Id = Guid.NewGuid(),
                Name = trimmedName,
                CreatedUtc = now,
                UpdatedUtc = now,
                HouseholdId = SeedHousehold.Id,
            };

            dbContext.Lists.Add(list);
            await dbContext.SaveChangesAsync(cancellationToken);

            var dto = await LoadList(dbContext, list.Id, cancellationToken);
            return Results.Created($"/api/lists/{list.Id}", dto);
        }).WithName("CreateList").Produces<ListDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest);

        group.MapPost("/{listId:guid}/items", async (Guid listId, AddListItemRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var trimmedText = request.Text.Trim();
            if (trimmedText.Length == 0)
            {
                return Results.BadRequest(new { error = "Item text is required." });
            }

            var listExists = await dbContext.Lists.AnyAsync(list => list.Id == listId && list.HouseholdId == SeedHousehold.Id, cancellationToken);
            if (!listExists)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            var item = new ListItem
            {
                Id = Guid.NewGuid(),
                ListId = listId,
                Text = trimmedText,
                IsCompleted = false,
                CreatedUtc = now,
                UpdatedUtc = now,
            };

            dbContext.ListItems.Add(item);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/lists/{listId}/items/{item.Id}", ToDto(item));
        }).WithName("AddListItem").Produces<ListItemDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{listId:guid}/items/{itemId:guid}/toggle", async (Guid listId, Guid itemId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var item = await dbContext.ListItems
                .Include(listItem => listItem.List)
                .FirstOrDefaultAsync(listItem => listItem.Id == itemId && listItem.ListId == listId && listItem.List!.HouseholdId == SeedHousehold.Id, cancellationToken);

            if (item is null)
            {
                return Results.NotFound();
            }

            item.IsCompleted = !item.IsCompleted;
            item.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToDto(item));
        }).WithName("ToggleListItemCompletion").Produces<ListItemDto>().Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{listId:guid}/items/{itemId:guid}", async (Guid listId, Guid itemId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var item = await dbContext.ListItems
                .Include(listItem => listItem.List)
                .FirstOrDefaultAsync(listItem => listItem.Id == itemId && listItem.ListId == listId && listItem.List!.HouseholdId == SeedHousehold.Id, cancellationToken);

            if (item is null)
            {
                return Results.NotFound();
            }

            dbContext.ListItems.Remove(item);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.NoContent();
        }).WithName("RemoveListItem").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static async Task<ListDto?> LoadList(HomeOpsDbContext dbContext, Guid listId, CancellationToken cancellationToken)
    {
        return await dbContext.Lists
            .AsNoTracking()
            .Where(list => list.Id == listId && list.HouseholdId == SeedHousehold.Id)
            .Select(list => new ListDto(
                list.Id,
                list.Name,
                list.CreatedUtc,
                list.UpdatedUtc,
                list.HouseholdId,
                list.Items
                    .OrderBy(item => item.CreatedUtc)
                    .ThenBy(item => item.Text)
                    .Select(item => ToDto(item))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static ListItemDto ToDto(ListItem item) => new(item.Id, item.ListId, item.Text, item.IsCompleted, item.CreatedUtc, item.UpdatedUtc);
}
