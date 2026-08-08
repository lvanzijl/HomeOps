using HomeOps.Api.Data;
using HomeOps.Api.DecorativeAvatars;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Lists;

public static class ListEndpoints
{
    public static IEndpointRouteBuilder MapListEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lists").WithTags("Lists");

        group.MapGet("/", async (bool? includeArchived, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var includeArchivedLists = includeArchived == true;
            var lists = await dbContext.Lists
                .AsNoTracking()
                .Include(list => list.Items)
                .Where(list => list.HouseholdId == SeedHousehold.Id && !list.IsDeleted && (includeArchivedLists || !list.IsArchived))
                .OrderBy(list => list.IsArchived)
                .ThenBy(list => list.Name)
                .ToListAsync(cancellationToken);

            return Results.Ok(lists.Select(ToSummaryDto).ToList());
        }).WithName("GetLists").Produces<IReadOnlyCollection<ListSummaryDto>>();

        group.MapGet("/{listId:guid}", async (Guid listId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var list = await LoadList(dbContext, listId, cancellationToken);
            return list is null ? Results.NotFound() : Results.Ok(list);
        }).WithName("GetListById").Produces<ListDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateListRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var nameValidation = ValidateListName(request.Name);
            if (nameValidation.Error is not null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Name)] = [nameValidation.Error] });
            }

            if (await ActiveListNameExists(dbContext, nameValidation.Name, null, cancellationToken))
            {
                return Results.Conflict(new { error = "An active list with this name already exists." });
            }

            var now = DateTimeOffset.UtcNow;
            var list = new List
            {
                Id = Guid.NewGuid(),
                Name = nameValidation.Name,
                CreatedUtc = now,
                UpdatedUtc = now,
                HouseholdId = SeedHousehold.Id,
            };

            dbContext.Lists.Add(list);
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return Results.Conflict(new { error = "An active list with this name already exists." });
            }

            var dto = await LoadList(dbContext, list.Id, cancellationToken);
            return Results.Created($"/api/lists/{list.Id}", dto);
        }).WithName("CreateList").Produces<ListDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status409Conflict);

        group.MapPatch("/{listId:guid}/name", async (Guid listId, RenameListRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var nameValidation = ValidateListName(request.Name);
            if (nameValidation.Error is not null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Name)] = [nameValidation.Error] });
            }

            var list = await dbContext.Lists.FirstOrDefaultAsync(candidate => candidate.Id == listId && candidate.HouseholdId == SeedHousehold.Id && !candidate.IsArchived && !candidate.IsDeleted, cancellationToken);
            if (list is null)
            {
                return Results.NotFound();
            }

            if (await ActiveListNameExists(dbContext, nameValidation.Name, list.Id, cancellationToken))
            {
                return Results.Conflict(new { error = "An active list with this name already exists." });
            }

            list.Name = nameValidation.Name;
            list.UpdatedUtc = DateTimeOffset.UtcNow;
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return Results.Conflict(new { error = "An active list with this name already exists." });
            }

            return Results.Ok(await LoadList(dbContext, list.Id, cancellationToken));
        }).WithName("RenameList").Produces<ListDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        group.MapPost("/{listId:guid}/archive", async (Guid listId, ArchiveListRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (!request.Confirmed)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Confirmed)] = ["Archiving requires explicit confirmation."] });
            }

            var list = await dbContext.Lists.Include(candidate => candidate.Items).FirstOrDefaultAsync(candidate => candidate.Id == listId && candidate.HouseholdId == SeedHousehold.Id && !candidate.IsArchived && !candidate.IsDeleted, cancellationToken);
            if (list is null)
            {
                return Results.NotFound();
            }

            if (!MatchesExpectedUpdate(list.UpdatedUtc, request.ExpectedUpdatedUtc))
            {
                return Results.Conflict(new { error = "The list changed after the confirmation was opened." });
            }

            var now = DateTimeOffset.UtcNow;
            list.IsArchived = true;
            list.ArchivedUtc = now;
            list.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToSummaryDto(list));
        }).WithName("ArchiveList").Produces<ListSummaryDto>().ProducesValidationProblem().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        group.MapPost("/{listId:guid}/restore", async (Guid listId, RestoreListRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var list = await dbContext.Lists.Include(candidate => candidate.Items).FirstOrDefaultAsync(candidate => candidate.Id == listId && candidate.HouseholdId == SeedHousehold.Id && candidate.IsArchived && !candidate.IsDeleted, cancellationToken);
            if (list is null)
            {
                return Results.NotFound();
            }


            if (!MatchesExpectedUpdate(list.UpdatedUtc, request.ExpectedUpdatedUtc))
            {
                return Results.Conflict(new { error = "The list changed after it was loaded." });
            }

            if (await ActiveListNameExists(dbContext, list.Name, list.Id, cancellationToken))
            {
                return Results.Conflict(new { error = "Restore is blocked because an active list with this name already exists." });
            }

            var now = DateTimeOffset.UtcNow;
            list.IsArchived = false;
            list.ArchivedUtc = null;
            list.UpdatedUtc = now;
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return Results.Conflict(new { error = "Restore is blocked because an active list with this name already exists." });
            }

            return Results.Ok(ToSummaryDto(list));
        }).WithName("RestoreList").Produces<ListSummaryDto>().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        group.MapPost("/{listId:guid}/permanent-delete", async (Guid listId, PermanentDeleteListRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (!request.Confirmed)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Confirmed)] = ["Permanent deletion requires explicit confirmation."] });
            }

            var list = await dbContext.Lists
                .Include(candidate => candidate.Items)
                .FirstOrDefaultAsync(candidate => candidate.Id == listId && candidate.HouseholdId == SeedHousehold.Id && !candidate.IsDeleted, cancellationToken);
            if (list is null)
            {
                return Results.NotFound();
            }

            if (!MatchesExpectedUpdate(list.UpdatedUtc, request.ExpectedUpdatedUtc))
            {
                return Results.Conflict(new { error = "The list changed after the confirmation was opened." });
            }

            dbContext.ListItems.RemoveRange(list.Items);
            dbContext.Lists.Remove(list);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("PermanentlyDeleteList").Produces(StatusCodes.Status204NoContent).ProducesValidationProblem().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

        group.MapPost("/{listId:guid}/items", async (Guid listId, AddListItemRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var trimmedText = request.Text.Trim();
            if (trimmedText.Length == 0)
            {
                return Results.BadRequest(new { error = "Item text is required." });
            }

            if (trimmedText.Length > 240)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Text)] = ["Item text must be 240 characters or fewer."] });
            }

            var listExists = await dbContext.Lists.AnyAsync(list => list.Id == listId && list.HouseholdId == SeedHousehold.Id && !list.IsArchived && !list.IsDeleted, cancellationToken);
            if (!listExists)
            {
                return Results.NotFound();
            }

            var avatarValidation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!avatarValidation.IsValid)
            {
                return Results.BadRequest(new { error = avatarValidation.Error });
            }

            var now = DateTimeOffset.UtcNow;
            var item = new ListItem
            {
                Id = Guid.NewGuid(),
                ListId = listId,
                Text = trimmedText,
                IsCompleted = false,
                IsDeleted = false,
                DecorativeAvatarReferenceType = avatarValidation.ReferenceType,
                DecorativeAvatarReferenceId = avatarValidation.ReferenceId,
                CreatedUtc = now,
                UpdatedUtc = now,
            };

            dbContext.ListItems.Add(item);
            await RecordItemHistory(dbContext, item.Text, now, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/lists/{listId}/items/{item.Id}", await ToDto(dbContext, item, cancellationToken));
        }).WithName("AddListItem").Produces<ListItemDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapPatch("/{listId:guid}/items/{itemId:guid}", async (Guid listId, Guid itemId, UpdateListItemRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var text = request.Text.Trim();
            if (text.Length == 0 || text.Length > 240)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Text)] = [text.Length == 0 ? "Item text is required." : "Item text must be 240 characters or fewer."] });
            }

            var quantity = NormalizeOptional(request.Quantity);
            if (quantity is { Length: > 80 })
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Quantity)] = ["Quantity must be 80 characters or fewer."] });
            }

            var store = NormalizeStore(request.PreferredStore);
            if (store is { Length: > 120 })
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.PreferredStore)] = ["Store must be 120 characters or fewer."] });
            }

            var avatarValidation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!avatarValidation.IsValid)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.DecorativeAvatar)] = [avatarValidation.Error ?? "Decorative avatar is invalid."] });
            }

            var item = await dbContext.ListItems
                .Include(listItem => listItem.List)
                .FirstOrDefaultAsync(listItem => listItem.Id == itemId
                    && listItem.ListId == listId
                    && listItem.List!.HouseholdId == SeedHousehold.Id
                    && !listItem.List.IsArchived
                    && !listItem.List.IsDeleted,
                    cancellationToken);
            if (item is null)
            {
                return Results.NotFound();
            }

            if (!MatchesExpectedUpdate(item.UpdatedUtc, request.ExpectedUpdatedUtc))
            {
                return Results.Conflict(new { error = "The item changed after the editor was opened." });
            }

            var now = DateTimeOffset.UtcNow;
            var oldText = item.Text;
            var oldStore = item.PreferredStore;
            var textChanged = !string.Equals(NormalizeItemText(oldText), NormalizeItemText(text), StringComparison.Ordinal);
            if (request.PreservePurchaseHistory)
            {
                await ReattributeShoppingHistory(dbContext, oldText, text, now, cancellationToken);
            }
            else if (textChanged)
            {
                await RecordItemHistory(dbContext, text, now, cancellationToken);
            }

            if (store is not null && (!string.Equals(oldStore, store, StringComparison.OrdinalIgnoreCase) || (textChanged && !request.PreservePurchaseHistory)))
            {
                await RecordPurchaseHistory(dbContext, text, store, now, cancellationToken);
            }

            item.Text = text;
            item.Quantity = quantity;
            item.PreferredStore = store;
            item.DecorativeAvatarReferenceType = avatarValidation.ReferenceType;
            item.DecorativeAvatarReferenceId = avatarValidation.ReferenceId;
            item.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await ToDto(dbContext, item, cancellationToken));
        }).WithName("UpdateListItem").Produces<ListItemDto>().ProducesValidationProblem().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict);

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


        group.MapPatch("/{listId:guid}/items/{itemId:guid}/decorative-avatar", async (Guid listId, Guid itemId, UpdateListItemDecorativeAvatarRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var item = await dbContext.ListItems
                .Include(listItem => listItem.List)
                .FirstOrDefaultAsync(listItem => listItem.Id == itemId && listItem.ListId == listId && listItem.List!.HouseholdId == SeedHousehold.Id, cancellationToken);

            if (item is null)
            {
                return Results.NotFound();
            }

            var validation = await DecorativeAvatarReferenceValidation.Validate(dbContext, request.DecorativeAvatar, cancellationToken);
            if (!validation.IsValid)
            {
                return Results.BadRequest(new { error = validation.Error });
            }

            item.DecorativeAvatarReferenceType = validation.ReferenceType;
            item.DecorativeAvatarReferenceId = validation.ReferenceId;
            item.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await ToDto(dbContext, item, cancellationToken));
        }).WithName("UpdateListItemDecorativeAvatar").Produces<ListItemDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapGet("/shopping/suggestions", async (string text, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var suggestions = await LoadStoreSuggestions(dbContext, NormalizeItemText(text), cancellationToken);
            return Results.Ok(new ShoppingItemSuggestionDto(text.Trim(), suggestions));
        }).WithName("GetShoppingItemStoreSuggestions").Produces<ShoppingItemSuggestionDto>();

        group.MapGet("/shopping/history", async (string? query, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await LoadShoppingHistorySuggestions(dbContext, query, cancellationToken));
        }).WithName("GetShoppingHistorySuggestions").Produces<IReadOnlyCollection<ShoppingHistorySuggestionDto>>();

        group.MapPost("/shopping/history/import", async (ImportShoppingHistoryRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (!request.Confirmed)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Confirmed)] = ["Importing local history requires explicit confirmation."] });
            }

            if (request.Items is null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Items)] = ["Items are required."] });
            }

            var items = request.Items
                .Select(item => item?.Trim() ?? string.Empty)
                .Where(item => item.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (items.Count > 50 || items.Any(item => item.Length > 240))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.Items)] = ["Import at most 50 item names of 240 characters or fewer."] });
            }

            var now = DateTimeOffset.UtcNow;
            foreach (var item in items)
            {
                await RecordItemHistory(dbContext, item, now, cancellationToken);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await LoadShoppingHistorySuggestions(dbContext, null, cancellationToken));
        }).WithName("ImportShoppingHistory").Produces<IReadOnlyCollection<ShoppingHistorySuggestionDto>>().ProducesValidationProblem();

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
        new(item.Id, item.ListId, item.Text, item.Quantity, item.IsCompleted, item.CompletedUtc, item.IsDeleted, item.DeletedUtc, item.PreferredStore, ToDecorativeAvatarDto(item), await LoadStoreSuggestions(dbContext, NormalizeItemText(item.Text), cancellationToken), item.CreatedUtc, item.UpdatedUtc);

    private static DecorativeAvatarReferenceDto? ToDecorativeAvatarDto(ListItem item) =>
        item.DecorativeAvatarReferenceType is null || string.IsNullOrWhiteSpace(item.DecorativeAvatarReferenceId)
            ? null
            : new DecorativeAvatarReferenceDto(item.DecorativeAvatarReferenceType.Value, item.DecorativeAvatarReferenceId);

    private static async Task<IReadOnlyCollection<ShoppingStoreSuggestionDto>> LoadStoreSuggestions(HomeOpsDbContext dbContext, string normalizedText, CancellationToken cancellationToken) =>
        await dbContext.ShoppingPurchaseHistories
            .AsNoTracking()
            .Where(history => history.HouseholdId == SeedHousehold.Id && history.NormalizedText == normalizedText)
            .OrderByDescending(history => history.PurchaseCount)
            .ThenBy(history => history.Store)
            .Select(history => new ShoppingStoreSuggestionDto(history.Store, history.PurchaseCount))
            .ToListAsync(cancellationToken);

    private static string NormalizeItemText(string text) => text.Trim().ToUpperInvariant();

    private static ListSummaryDto ToSummaryDto(List list) => new(
        list.Id,
        list.Name,
        list.IsArchived,
        list.IsDeleted,
        list.ArchivedUtc,
        list.CreatedUtc,
        list.UpdatedUtc,
        list.HouseholdId,
        list.Items.Count(item => !item.IsDeleted && !item.IsCompleted),
        list.Items.Count(item => !item.IsDeleted && !item.IsCompleted),
        list.Items.Count(item => !item.IsDeleted && item.IsCompleted),
        list.Items.Count(item => item.IsDeleted),
        list.Items.Count);

    private static (string Name, string? Error) ValidateListName(string? name)
    {
        var trimmedName = name?.Trim() ?? string.Empty;
        if (trimmedName.Length == 0) return (trimmedName, "List name is required.");
        if (trimmedName.Length > 160) return (trimmedName, "List name must be 160 characters or fewer.");
        return (trimmedName, null);
    }

    private static Task<bool> ActiveListNameExists(HomeOpsDbContext dbContext, string name, Guid? exceptListId, CancellationToken cancellationToken) =>
        dbContext.Lists.AsNoTracking().AnyAsync(
            candidate => candidate.HouseholdId == SeedHousehold.Id
                && !candidate.IsArchived
                && !candidate.IsDeleted
                && (exceptListId == null || candidate.Id != exceptListId.Value)
                && candidate.Name.ToUpper() == name.ToUpper(),
            cancellationToken);

    private static bool MatchesExpectedUpdate(DateTimeOffset actual, DateTimeOffset expected)
    {
        // JavaScript Date preserves milliseconds, while PostgreSQL/.NET can retain finer precision.
        // Compare at the precision represented by the generated TypeScript client.
        return actual.ToUnixTimeMilliseconds() == expected.ToUnixTimeMilliseconds();
    }

    private static async Task<IReadOnlyCollection<ShoppingHistorySuggestionDto>> LoadShoppingHistorySuggestions(HomeOpsDbContext dbContext, string? query, CancellationToken cancellationToken)
    {
        var historyRows = await dbContext.ShoppingItemHistories
            .AsNoTracking()
            .Where(history => history.HouseholdId == SeedHousehold.Id)
            .ToListAsync(cancellationToken);
        var activeItems = await dbContext.ListItems
            .AsNoTracking()
            .Where(item => item.List!.HouseholdId == SeedHousehold.Id && !item.List.IsArchived && !item.List.IsDeleted && !item.IsDeleted)
            .Select(item => new { item.Text, item.UpdatedUtc })
            .ToListAsync(cancellationToken);

        var candidates = new Dictionary<string, (string Text, int UseCount, DateTimeOffset UpdatedUtc)>(StringComparer.Ordinal);
        foreach (var history in historyRows)
        {
            candidates[history.NormalizedText] = (history.ItemText, history.UseCount, history.UpdatedUtc);
        }

        foreach (var item in activeItems)
        {
            var normalized = NormalizeItemText(item.Text);
            if (!candidates.ContainsKey(normalized))
            {
                candidates[normalized] = (item.Text, 1, item.UpdatedUtc);
            }
        }

        var normalizedQuery = NormalizeItemText(query ?? string.Empty);
        var selected = candidates
            .Where(candidate => normalizedQuery.Length == 0 || candidate.Key.Contains(normalizedQuery, StringComparison.Ordinal))
            .OrderByDescending(candidate => normalizedQuery.Length > 0 && candidate.Key.StartsWith(normalizedQuery, StringComparison.Ordinal))
            .ThenByDescending(candidate => candidate.Value.UseCount)
            .ThenByDescending(candidate => candidate.Value.UpdatedUtc)
            .ThenBy(candidate => candidate.Value.Text)
            .Take(20)
            .ToList();
        var normalizedTexts = selected.Select(candidate => candidate.Key).ToList();
        var storeRows = await dbContext.ShoppingPurchaseHistories
            .AsNoTracking()
            .Where(history => history.HouseholdId == SeedHousehold.Id && normalizedTexts.Contains(history.NormalizedText))
            .OrderByDescending(history => history.PurchaseCount)
            .ThenBy(history => history.Store)
            .ToListAsync(cancellationToken);

        return selected.Select(candidate => new ShoppingHistorySuggestionDto(
            candidate.Value.Text,
            candidate.Value.UseCount,
            candidate.Value.UpdatedUtc,
            storeRows
                .Where(history => history.NormalizedText == candidate.Key)
                .Select(history => new ShoppingStoreSuggestionDto(history.Store, history.PurchaseCount))
                .ToList()))
            .ToList();
    }

    private static async Task RecordItemHistory(HomeOpsDbContext dbContext, string itemText, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var normalizedText = NormalizeItemText(itemText);
        var history = await dbContext.ShoppingItemHistories
            .FirstOrDefaultAsync(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == normalizedText, cancellationToken);
        if (history is null)
        {
            dbContext.ShoppingItemHistories.Add(new ShoppingItemHistory
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                NormalizedText = normalizedText,
                ItemText = itemText.Trim(),
                UseCount = 1,
                CreatedUtc = now,
                UpdatedUtc = now,
            });
            return;
        }

        history.ItemText = itemText.Trim();
        history.UseCount += 1;
        history.UpdatedUtc = now;
    }

    private static async Task ReattributeShoppingHistory(HomeOpsDbContext dbContext, string oldText, string newText, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var oldNormalized = NormalizeItemText(oldText);
        var newNormalized = NormalizeItemText(newText);
        if (oldNormalized == newNormalized)
        {
            var matchingItemHistory = await dbContext.ShoppingItemHistories
                .FirstOrDefaultAsync(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == oldNormalized, cancellationToken);
            if (matchingItemHistory is not null)
            {
                matchingItemHistory.ItemText = newText.Trim();
                matchingItemHistory.UpdatedUtc = now;
            }

            var matchingPurchaseHistory = await dbContext.ShoppingPurchaseHistories
                .Where(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == oldNormalized)
                .ToListAsync(cancellationToken);
            foreach (var entry in matchingPurchaseHistory)
            {
                entry.ItemText = newText.Trim();
                entry.UpdatedUtc = now;
            }
            return;
        }

        var oldItemHistory = await dbContext.ShoppingItemHistories
            .FirstOrDefaultAsync(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == oldNormalized, cancellationToken);
        var newItemHistory = await dbContext.ShoppingItemHistories
            .FirstOrDefaultAsync(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == newNormalized, cancellationToken);
        if (oldItemHistory is null)
        {
            await RecordItemHistory(dbContext, newText, now, cancellationToken);
        }
        else if (newItemHistory is null)
        {
            oldItemHistory.NormalizedText = newNormalized;
            oldItemHistory.ItemText = newText.Trim();
            oldItemHistory.UpdatedUtc = now;
        }
        else
        {
            newItemHistory.ItemText = newText.Trim();
            newItemHistory.UseCount += oldItemHistory.UseCount;
            newItemHistory.UpdatedUtc = now;
            dbContext.ShoppingItemHistories.Remove(oldItemHistory);
        }

        var oldStoreHistories = await dbContext.ShoppingPurchaseHistories
            .Where(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == oldNormalized)
            .ToListAsync(cancellationToken);
        foreach (var oldStoreHistory in oldStoreHistories)
        {
            var newStoreHistory = await dbContext.ShoppingPurchaseHistories
                .FirstOrDefaultAsync(entry => entry.HouseholdId == SeedHousehold.Id && entry.NormalizedText == newNormalized && entry.Store == oldStoreHistory.Store, cancellationToken);
            if (newStoreHistory is null)
            {
                oldStoreHistory.NormalizedText = newNormalized;
                oldStoreHistory.ItemText = newText.Trim();
                oldStoreHistory.UpdatedUtc = now;
            }
            else
            {
                newStoreHistory.ItemText = newText.Trim();
                newStoreHistory.PurchaseCount += oldStoreHistory.PurchaseCount;
                newStoreHistory.UpdatedUtc = now;
                dbContext.ShoppingPurchaseHistories.Remove(oldStoreHistory);
            }
        }
    }

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

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
