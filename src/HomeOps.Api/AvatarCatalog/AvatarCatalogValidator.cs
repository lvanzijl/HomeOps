namespace HomeOps.Api.AvatarCatalog;

public static class AvatarCatalogValidator
{
    private static readonly HashSet<string> SupportedControls = ["tile", "swatch", "compactList"];

    public static void Validate(AvatarCatalogDefinition catalog)
    {
        var errors = new List<string>();
        if (catalog.CatalogId != AvatarCatalogConstants.CatalogId) errors.Add("Catalog ID is invalid.");
        if (catalog.SchemaVersion != AvatarCatalogConstants.SchemaVersion) errors.Add("Catalog schema version is invalid.");
        var categoryIds = new HashSet<string>(StringComparer.Ordinal);
        var slots = new HashSet<string>(StringComparer.Ordinal);
        foreach (var category in catalog.Categories)
        {
            if (!categoryIds.Add(category.Id)) errors.Add($"Duplicate category ID '{category.Id}'.");
            if (!slots.Add(category.Slot)) errors.Add($"Duplicate category slot '{category.Slot}'.");
            RequireLocale(errors, category.Labels, catalog.DefaultLocale, $"Category '{category.Id}' label");
            RequireLocale(errors, category.AccessibilityLabels, catalog.DefaultLocale, $"Category '{category.Id}' accessibility label");
            if (!SupportedControls.Contains(category.Presentation.Control)) errors.Add($"Category '{category.Id}' uses unsupported presentation control '{category.Presentation.Control}'.");
        }
        foreach (var duplicateOrder in catalog.Categories.GroupBy(category => category.Order).Where(group => group.Count() > 1)) errors.Add($"Duplicate category order '{duplicateOrder.Key}'.");

        var itemIds = new HashSet<string>(StringComparer.Ordinal);
        var legacyIds = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var item in catalog.Items)
        {
            if (!itemIds.Add(item.Id)) errors.Add($"Duplicate item ID '{item.Id}'.");
            if (!categoryIds.Contains(item.CategoryId)) errors.Add($"Item '{item.Id}' references unknown category '{item.CategoryId}'.");
            RequireLocale(errors, item.AccessibilityLabels, catalog.DefaultLocale, $"Item '{item.Id}' accessibility label");
            if (item.Status == AvatarCatalogItemStatus.Active && item.Type == AvatarCatalogItemType.RendererStyle && item.Renderer is null) errors.Add($"Item '{item.Id}' is missing renderer metadata.");
            if (item.Status == AvatarCatalogItemStatus.Active && item.Type == AvatarCatalogItemType.Color && item.Color is null) errors.Add($"Color item '{item.Id}' is missing color metadata.");
            if (item.ReplacementId is not null && !itemIds.Contains(item.ReplacementId) && catalog.Items.All(candidate => candidate.Id != item.ReplacementId)) errors.Add($"Item '{item.Id}' references missing replacement '{item.ReplacementId}'.");
            foreach (var legacyId in item.LegacyIds)
            {
                var key = $"{item.CategoryId}:{legacyId}";
                if (legacyIds.TryGetValue(key, out var existing)) errors.Add($"Legacy ID '{legacyId}' maps to both '{existing}' and '{item.Id}' in category '{item.CategoryId}'.");
                else legacyIds[key] = item.Id;
            }
        }
        foreach (var orderGroup in catalog.Items.GroupBy(item => item.CategoryId))
        foreach (var duplicateOrder in orderGroup.GroupBy(item => item.Order).Where(group => group.Count() > 1)) errors.Add($"Duplicate item order '{duplicateOrder.Key}' in category '{orderGroup.Key}'.");
        foreach (var pair in catalog.Defaults)
        {
            var category = catalog.Categories.FirstOrDefault(candidate => candidate.Slot == pair.Key);
            if (category is null) { errors.Add($"Default slot '{pair.Key}' has no category."); continue; }
            var item = catalog.Items.FirstOrDefault(candidate => candidate.Id == pair.Value);
            if (item is null) { errors.Add($"Default for slot '{pair.Key}' references unknown item '{pair.Value}'."); continue; }
            if (item.CategoryId != category.Id) errors.Add($"Default item '{pair.Value}' does not belong to category '{category.Id}'.");
            if (item.Status != AvatarCatalogItemStatus.Active) errors.Add($"Default item '{pair.Value}' is not active.");
        }
        if (errors.Count > 0) throw new InvalidOperationException("Avatar catalog validation failed: " + string.Join("; ", errors));
    }

    private static void RequireLocale(List<string> errors, IReadOnlyDictionary<string, string> values, string locale, string field)
    {
        if (!values.TryGetValue(locale, out var value) || string.IsNullOrWhiteSpace(value)) errors.Add($"{field} is missing locale '{locale}'.");
    }
}
