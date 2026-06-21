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
                .Where(list => list.HouseholdId == SeedHousehold.Id && !list.IsArchived && !list.IsDeleted)
                .OrderBy(list => list.Name)
                .Select(list => new ListSummaryDto(
                    list.Id,
                    list.Name,
                    list.IsArchived,
                    list.IsDeleted,
                    list.CreatedUtc,
                    list.UpdatedUtc,
                    list.HouseholdId,
                    list.Items.Count(item => !item.IsDeleted && (!item.IsCompleted || item.CompletedUtc == null || item.CompletedUtc >= DateTimeOffset.UtcNow.AddHours(-24)))))
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

        group.MapPatch("/{listId:guid}/name", async (Guid listId, RenameListRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var trimmedName = request.Name.Trim();
            if (trimmedName.Length == 0)
            {
                return Results.BadRequest(new { error = "List name is required." });
            }

            var list = await dbContext.Lists.FirstOrDefaultAsync(candidate => candidate.Id == listId && candidate.HouseholdId == SeedHousehold.Id && !candidate.IsDeleted, cancellationToken);
            if (list is null)
            {
                return Results.NotFound();
            }

            list.Name = trimmedName;
            list.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await LoadList(dbContext, list.Id, cancellationToken));
        }).WithName("RenameList").Produces<ListDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{listId:guid}/archive", async (Guid listId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var list = await dbContext.Lists.FirstOrDefaultAsync(candidate => candidate.Id == listId && candidate.HouseholdId == SeedHousehold.Id && !candidate.IsDeleted, cancellationToken);
            if (list is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            list.IsArchived = true;
            list.ArchivedUtc = now;
            list.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await LoadList(dbContext, list.Id, cancellationToken, includeInactiveList: true));
        }).WithName("ArchiveList").Produces<ListDto>().Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{listId:guid}", async (Guid listId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var list = await dbContext.Lists.FirstOrDefaultAsync(candidate => candidate.Id == listId && candidate.HouseholdId == SeedHousehold.Id && !candidate.IsDeleted, cancellationToken);
            if (list is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            list.IsDeleted = true;
            list.DeletedUtc = now;
            list.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteList").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{listId:guid}/items", async (Guid listId, AddListItemRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var trimmedText = request.Text.Trim();
            if (trimmedText.Length == 0)
            {
                return Results.BadRequest(new { error = "Item text is required." });
            }

            var listExists = await dbContext.Lists.AnyAsync(list => list.Id == listId && list.HouseholdId == SeedHousehold.Id && !list.IsArchived && !list.IsDeleted, cancellationToken);
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
                IsDeleted = false,
                CreatedUtc = now,
                UpdatedUtc = now,
            };

            dbContext.ListItems.Add(item);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/lists/{listId}/items/{item.Id}", await ToDto(dbContext, item, cancellationToken));
        }).WithName("AddListItem").Produces<ListItemDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPatch("/{listId:guid}/items/{itemId:guid}/store", async (Guid listId, Guid itemId, UpdateListItemStoreRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var item = await dbContext.ListItems
                .Include(listItem => listItem.List)
                .FirstOrDefaultAsync(listItem => listItem.Id == itemId && listItem.ListId == listId && listItem.List!.HouseholdId == SeedHousehold.Id, cancellationToken);

            if (item is null)
            {
                return Results.NotFound();
            }

            var store = NormalizeStore(request.PreferredStore);
            item.PreferredStore = store;
            item.UpdatedUtc = DateTimeOffset.UtcNow;

            if (store is not null)
            {
                await RecordPurchaseHistory(dbContext, item.Text, store, item.UpdatedUtc, cancellationToken);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await ToDto(dbContext, item, cancellationToken));
        }).WithName("UpdateListItemStore").Produces<ListItemDto>().Produces(StatusCodes.Status404NotFound);

        group.MapGet("/shopping/suggestions", async (string text, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var suggestions = await LoadStoreSuggestions(dbContext, NormalizeItemText(text), cancellationToken);
            return Results.Ok(new ShoppingItemSuggestionDto(text.Trim(), suggestions));
        }).WithName("GetShoppingItemStoreSuggestions").Produces<ShoppingItemSuggestionDto>();

        group.MapPost("/{listId:guid}/items/{itemId:guid}/toggle", async (Guid listId, Guid itemId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var item = await dbContext.ListItems
                .Include(listItem => listItem.List)
                .FirstOrDefaultAsync(listItem => listItem.Id == itemId && listItem.ListId == listId && listItem.List!.HouseholdId == SeedHousehold.Id, cancellationToken);

            if (item is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            item.IsCompleted = !item.IsCompleted;
            item.CompletedUtc = item.IsCompleted ? now : null;
            item.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(await ToDto(dbContext, item, cancellationToken));
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

            var now = DateTimeOffset.UtcNow;
            item.IsDeleted = true;
            item.DeletedUtc = now;
            item.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(await ToDto(dbContext, item, cancellationToken));
        }).WithName("RemoveListItem").Produces<ListItemDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{listId:guid}/items/{itemId:guid}/undo", async (Guid listId, Guid itemId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var item = await dbContext.ListItems
                .Include(listItem => listItem.List)
                .FirstOrDefaultAsync(listItem => listItem.Id == itemId && listItem.ListId == listId && listItem.List!.HouseholdId == SeedHousehold.Id, cancellationToken);

            if (item is null)
            {
                return Results.NotFound();
            }

            item.IsCompleted = false;
            item.CompletedUtc = null;
            item.IsDeleted = false;
            item.DeletedUtc = null;
            item.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await ToDto(dbContext, item, cancellationToken));
        }).WithName("UndoListItemLifecycle").Produces<ListItemDto>().Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static async Task<ListDto?> LoadList(HomeOpsDbContext dbContext, Guid listId, CancellationToken cancellationToken, bool includeInactiveList = false)
    {
        var now = DateTimeOffset.UtcNow;
        var list = await dbContext.Lists
            .AsNoTracking()
            .Include(list => list.Items)
            .Where(list => list.Id == listId && list.HouseholdId == SeedHousehold.Id && (includeInactiveList || (!list.IsArchived && !list.IsDeleted)))
            .FirstOrDefaultAsync(cancellationToken);

        if (list is null)
        {
            return null;
        }

        var visibleItems = list.Items
            .Where(item => !item.IsDeleted || (item.DeletedUtc != null && item.DeletedUtc >= now.AddHours(-24)))
            .Where(item => !item.IsCompleted || item.CompletedUtc == null || item.CompletedUtc >= now.AddHours(-24))
            .OrderBy(item => item.IsDeleted)
            .ThenBy(item => item.IsCompleted)
            .ThenBy(item => item.CreatedUtc)
            .ThenBy(item => item.Text)
            .ToList();

        var itemDtos = new List<ListItemDto>();
        foreach (var item in visibleItems)
        {
            itemDtos.Add(await ToDto(dbContext, item, cancellationToken));
        }

        return new ListDto(list.Id, list.Name, list.IsArchived, list.IsDeleted, list.CreatedUtc, list.UpdatedUtc, list.HouseholdId, itemDtos);
    }

    private static async Task<ListItemDto> ToDto(HomeOpsDbContext dbContext, ListItem item, CancellationToken cancellationToken) =>
        new(item.Id, item.ListId, item.Text, item.IsCompleted, item.CompletedUtc, item.IsDeleted, item.DeletedUtc, item.PreferredStore, await LoadStoreSuggestions(dbContext, NormalizeItemText(item.Text), cancellationToken), item.CreatedUtc, item.UpdatedUtc);

    private static async Task<IReadOnlyCollection<ShoppingStoreSuggestionDto>> LoadStoreSuggestions(HomeOpsDbContext dbContext, string normalizedText, CancellationToken cancellationToken) =>
        await dbContext.ShoppingPurchaseHistories
            .AsNoTracking()
            .Where(history => history.HouseholdId == SeedHousehold.Id && history.NormalizedText == normalizedText)
            .OrderByDescending(history => history.PurchaseCount)
            .ThenBy(history => history.Store)
            .Select(history => new ShoppingStoreSuggestionDto(history.Store, history.PurchaseCount))
            .ToListAsync(cancellationToken);

    private static string NormalizeItemText(string text) => text.Trim().ToUpperInvariant();

    private static string? NormalizeStore(string? store)
    {
        var trimmed = store?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static async Task RecordPurchaseHistory(HomeOpsDbContext dbContext, string itemText, string store, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var normalizedText = NormalizeItemText(itemText);
        var history = await dbContext.ShoppingPurchaseHistories
            .FirstOrDefaultAsync(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == normalizedText && entry.Store == store, cancellationToken);

        if (history is null)
        {
            dbContext.ShoppingPurchaseHistories.Add(new ShoppingPurchaseHistory
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                NormalizedText = normalizedText,
                ItemText = itemText.Trim(),
                Store = store,
                PurchaseCount = 1,
                CreatedUtc = now,
                UpdatedUtc = now,
            });
            return;
        }

        history.ItemText = itemText.Trim();
        history.PurchaseCount += 1;
        history.UpdatedUtc = now;
    }
}
