using HomeOps.Api.FamilyMembers;

namespace HomeOps.Api.AvatarCatalog;

public sealed class AvatarCatalogService
{
    private readonly AvatarCatalogDefinition _catalog;
    private readonly IReadOnlyDictionary<string, AvatarCatalogCategory> _categoriesBySlot;
    private readonly IReadOnlyDictionary<string, AvatarCatalogCategory> _categoriesById;
    private readonly IReadOnlyDictionary<string, AvatarCatalogItem> _itemsById;
    private readonly IReadOnlyDictionary<string, string> _legacyItemIds;

    public AvatarCatalogService(IAvatarCatalogSource source)
    {
        _catalog = source.LoadCatalog();
        AvatarCatalogValidator.Validate(_catalog);
        _categoriesBySlot = _catalog.Categories.ToDictionary(category => category.Slot, StringComparer.Ordinal);
        _categoriesById = _catalog.Categories.ToDictionary(category => category.Id, StringComparer.Ordinal);
        _itemsById = _catalog.Items.ToDictionary(item => item.Id, StringComparer.Ordinal);
        _legacyItemIds = _catalog.Items.SelectMany(item => item.LegacyIds.Select(legacy => new { item.CategoryId, LegacyId = legacy, item.Id }))
            .ToDictionary(item => $"{item.CategoryId}:{item.LegacyId}", item => item.Id, StringComparer.Ordinal);
    }

    public AvatarCatalogDefinition Catalog => _catalog;

    public AvatarSelection DefaultSelection() => AvatarSelection.FromSelections(_catalog.Defaults);

    public AvatarSelection MapLegacyAvatarV2(AvatarV2Config? config)
    {
        config ??= new AvatarV2Config();
        var values = new Dictionary<string, string?>(StringComparer.Ordinal)
        {
            [AvatarSelectionSlots.HeadVariant] = config.HeadVariant,
            [AvatarSelectionSlots.HairStyle] = config.HairStyle,
            [AvatarSelectionSlots.HairColor] = config.HairColor,
            [AvatarSelectionSlots.ClothingStyle] = config.ClothingStyle,
            [AvatarSelectionSlots.ClothingColor] = config.ClothingColor,
            [AvatarSelectionSlots.AccessoryStyle] = config.Accessory,
            [AvatarSelectionSlots.AccessoryColor] = config.AccessoryColor,
        };
        var selections = _catalog.Defaults.ToDictionary(StringComparer.Ordinal);
        foreach (var pair in values)
        {
            if (!_categoriesBySlot.TryGetValue(pair.Key, out var category)) continue;
            if (pair.Value is not { Length: > 0 } legacy) continue;
            if (_legacyItemIds.TryGetValue($"{category.Id}:{legacy.Trim()}", out var catalogId)) selections[pair.Key] = catalogId;
        }
        return AvatarSelection.FromSelections(selections);
    }

    public AvatarV2Config ToLegacyAvatarV2(AvatarSelection? selection)
    {
        var normalized = NormalizeWithDefaults(selection);
        return new AvatarV2Config
        {
            HeadVariant = RendererToken(normalized, AvatarSelectionSlots.HeadVariant),
            HairStyle = RendererToken(normalized, AvatarSelectionSlots.HairStyle),
            HairColor = RendererToken(normalized, AvatarSelectionSlots.HairColor),
            ClothingStyle = RendererToken(normalized, AvatarSelectionSlots.ClothingStyle),
            ClothingColor = RendererToken(normalized, AvatarSelectionSlots.ClothingColor),
            Accessory = RendererToken(normalized, AvatarSelectionSlots.AccessoryStyle),
            AccessoryColor = RendererToken(normalized, AvatarSelectionSlots.AccessoryColor),
        };
    }

    public AvatarSelectionValidationResult ValidateForWrite(AvatarSelection? selection)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);
        if (selection is null) return AvatarSelectionValidationResult.Valid(DefaultSelection());
        if (selection.SchemaVersion != AvatarCatalogConstants.SchemaVersion) errors["avatarSelection.schemaVersion"] = [$"Schema version '{selection.SchemaVersion}' is not supported."];
        foreach (var slot in selection.Selections.Keys.Where(slot => !_categoriesBySlot.ContainsKey(slot))) errors[$"avatarSelection.selections.{slot}"] = ["Unknown avatar selection slot."];
        foreach (var category in _catalog.Categories.Where(category => category.Required))
        {
            if (!selection.Selections.TryGetValue(category.Slot, out var itemId) || string.IsNullOrWhiteSpace(itemId))
            {
                errors[$"avatarSelection.selections.{category.Slot}"] = ["A selection is required."];
                continue;
            }
            if (!_itemsById.TryGetValue(itemId, out var item)) { errors[$"avatarSelection.selections.{category.Slot}"] = ["Unknown catalog item ID."]; continue; }
            if (item.CategoryId != category.Id) { errors[$"avatarSelection.selections.{category.Slot}"] = ["Catalog item does not belong to the selected category."]; continue; }
            if (item.Status == AvatarCatalogItemStatus.Retired) errors[$"avatarSelection.selections.{category.Slot}"] = ["Retired catalog items cannot be selected."];
        }
        return errors.Count == 0 ? AvatarSelectionValidationResult.Valid(NormalizeWithDefaults(selection)) : AvatarSelectionValidationResult.Invalid(errors);
    }

    private AvatarSelection NormalizeWithDefaults(AvatarSelection? selection)
    {
        var normalized = _catalog.Defaults.ToDictionary(StringComparer.Ordinal);
        if (selection is not null) foreach (var pair in selection.Selections) normalized[pair.Key] = pair.Value;
        return AvatarSelection.FromSelections(normalized);
    }

    private string RendererToken(AvatarSelection selection, string slot)
    {
        var itemId = selection.Selections[slot];
        return _itemsById[itemId].Renderer?.RendererToken ?? itemId;
    }
}

public sealed record AvatarSelectionValidationResult(bool IsValid, AvatarSelection? Selection, IReadOnlyDictionary<string, string[]> Errors)
{
    public static AvatarSelectionValidationResult Valid(AvatarSelection selection) => new(true, selection, new Dictionary<string, string[]>());
    public static AvatarSelectionValidationResult Invalid(IReadOnlyDictionary<string, string[]> errors) => new(false, null, errors);
}
