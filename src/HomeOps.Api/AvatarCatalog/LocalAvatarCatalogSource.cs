namespace HomeOps.Api.AvatarCatalog;

public interface IAvatarCatalogSource
{
    AvatarCatalogDefinition LoadCatalog();
}

public sealed class LocalAvatarCatalogSource : IAvatarCatalogSource
{
    public AvatarCatalogDefinition LoadCatalog()
    {
        var categories = new[]
        {
            Category("head.variant", AvatarSelectionSlots.HeadVariant, AvatarCatalogCategoryKind.RendererStyle, false, 10, "Hoofdvorm", "Head shape", "tile", "body"),
            Category("skin.tone", AvatarSelectionSlots.SkinTone, AvatarCatalogCategoryKind.Color, false, 15, "Huidskleur", "Skin tone", "swatch", "body"),
            Category("hair.style", AvatarSelectionSlots.HairStyle, AvatarCatalogCategoryKind.RendererStyle, false, 20, "Haar", "Hair", "tile", "hair"),
            Category("hair.color", AvatarSelectionSlots.HairColor, AvatarCatalogCategoryKind.Color, false, 30, "Haarkleur", "Hair color", "swatch", "hair"),
            Category("clothing.style", AvatarSelectionSlots.ClothingStyle, AvatarCatalogCategoryKind.RendererStyle, false, 40, "Kleding", "Clothing", "tile", "clothing"),
            Category("clothing.color", AvatarSelectionSlots.ClothingColor, AvatarCatalogCategoryKind.Color, false, 50, "Kledingkleur", "Clothing color", "swatch", "clothing"),
            Category("accessory.style", AvatarSelectionSlots.AccessoryStyle, AvatarCatalogCategoryKind.RendererStyle, true, 60, "Accessoire", "Accessory", "tile", "accessory"),
            Category("accessory.color", AvatarSelectionSlots.AccessoryColor, AvatarCatalogCategoryKind.Color, false, 70, "Accessoirekleur", "Accessory color", "swatch", "accessory"),
        };
        var items = new List<AvatarCatalogItem>();
        AddStyles(items, "head.variant", "head", [ ("round", "Rond", "Round"), ("oval", "Ovaal", "Oval"), ("wide", "Breed", "Wide") ]);
        AddColors(items, "skin.tone", "skin", "skin", [ ("peach", "Perzik", "Peach", "skinPeach", "#f5c7a9", "#e2a783", "#ffe0c8", "#9a684e"), ("golden", "Goudbruin", "Golden", "skinGolden", "#d8a06f", "#b97f50", "#efc59a", "#7b4f31"), ("deep", "Diep bruin", "Deep brown", "skinDeep", "#8f5a3c", "#6f3f29", "#b77a54", "#4f2d1f") ]);
        AddStyles(items, "hair.style", "hair", [ ("softCrop", "Zacht kort", "Soft crop"), ("curlyCloud", "Krullenwolk", "Curly cloud"), ("sideBob", "Bob", "Side bob"), ("swoop", "Lok", "Swoop"), ("layeredMessy", "Laagjes", "Layered messy"), ("shortMessy", "Kort warrig", "Short messy"), ("longSoft", "Lang zacht", "Long soft"), ("curlyPlayful", "Speelse krullen", "Playful curls") ]);
        AddColors(items, "hair.color", "hair", "hair", [ ("cocoa", "Cacao", "Cocoa", "hairCocoa", "#5b3926", "#3f2418", "#8a5b3d", "#2a1810"), ("chestnut", "Kastanje", "Chestnut", "hairChestnut", "#8c4a2f", "#65311f", "#b56c48", "#3d1e14"), ("plum", "Pruim", "Plum", "hairPlum", "#5b3a67", "#41284d", "#7a5590", "#2a1933") ]);
        AddStyles(items, "clothing.style", "shirt", [ ("roundedTee", "Rond shirt", "Rounded tee"), ("collar", "Kraag", "Collar"), ("hoodie", "Hoodie", "Hoodie"), ("sweater", "Trui", "Sweater"), ("tShirt", "T-shirt", "T-shirt"), ("overall", "Tuinbroek", "Overall") ]);
        AddClothingPalette(items, "clothing.color", "clothing");
        AddStyles(items, "accessory.style", "accessory", [ ("none", "Geen", "None"), ("star", "Ster", "Star"), ("flower", "Bloem", "Flower"), ("headband", "Haarband", "Headband"), ("bow", "Strik", "Bow"), ("chestStar", "Borstster", "Chest star"), ("leafPin", "Blaadje", "Leaf pin"), ("tinyCrown", "Kroontje", "Tiny crown") ]);
        AddClothingPalette(items, "accessory.color", "accessory");

        var defaults = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [AvatarSelectionSlots.HeadVariant] = "head.variant.round",
            [AvatarSelectionSlots.SkinTone] = "skin.tone.peach",
            [AvatarSelectionSlots.HairStyle] = "hair.style.short-messy",
            [AvatarSelectionSlots.HairColor] = "hair.color.cocoa",
            [AvatarSelectionSlots.ClothingStyle] = "clothing.style.hoodie",
            [AvatarSelectionSlots.ClothingColor] = "clothing.color.sky",
            [AvatarSelectionSlots.AccessoryStyle] = "accessory.style.star",
            [AvatarSelectionSlots.AccessoryColor] = "accessory.color.mint",
        };
        return new AvatarCatalogDefinition(AvatarCatalogConstants.CatalogId, AvatarCatalogConstants.SchemaVersion, "nl-NL", ["nl-NL", "en-US"], categories, items, defaults, new("catalog-theme-placeholder", "Reserved for future catalog theming metadata; no runtime themes are implemented."));
    }

    private static AvatarCatalogCategory Category(string id, string slot, AvatarCatalogCategoryKind kind, bool allowsNone, int order, string nl, string en, string control, string tag) => new(id, slot, kind, true, allowsNone, false, order, Text(nl, en), Text($"{nl} keuzes", $"{en} choices"), Text($"Kies {nl.ToLowerInvariant()}.", $"Choose {en.ToLowerInvariant()}."), new(control, "compact"), ["editor", tag]);
    private static IReadOnlyDictionary<string, string> Text(string nl, string en) => new Dictionary<string, string> { ["nl-NL"] = nl, ["en-US"] = en };
    private static string Kebab(string token) => string.Concat(token.Select((ch, i) => char.IsUpper(ch) && i > 0 ? "-" + char.ToLowerInvariant(ch) : char.ToLowerInvariant(ch).ToString()));
    private static void AddStyles(List<AvatarCatalogItem> items, string categoryId, string layer, (string Token, string Nl, string En)[] values) { var order=10; foreach (var value in values) { var id = $"{categoryId}.{Kebab(value.Token)}"; items.Add(new(id, categoryId, value.Token == "none" ? AvatarCatalogItemType.None : AvatarCatalogItemType.RendererStyle, AvatarCatalogItemStatus.Active, order, Text(value.Nl, value.En), Text(value.Nl, value.En), Text($"{value.Nl} optie", $"{value.En} option"), new Dictionary<string, string>(), [layer], new("avatar-v2-svg", value.Token, layer), null, null, null, [value.Token])); order += 10; } }
    private static void AddColors(List<AvatarCatalogItem> items, string categoryId, string layer, string palette, (string Name, string Nl, string En, string Token, string Base, string Shade, string Highlight, string Line)[] values) { var order=10; foreach (var value in values) { items.Add(new($"{categoryId}.{value.Name}", categoryId, AvatarCatalogItemType.Color, AvatarCatalogItemStatus.Active, order, Text(value.Nl, value.En), new Dictionary<string, string>(), Text($"{value.Nl} {layer}kleur", $"{value.En} {layer} color"), new Dictionary<string, string>(), ["color", layer, $"palette.{palette}"], new("avatar-v2-svg", value.Token, layer), new("expandedSwatch", value.Base, value.Shade, value.Highlight, value.Line, palette), null, null, [value.Token])); order += 10; } }
    private static void AddClothingPalette(List<AvatarCatalogItem> items, string categoryId, string layer) => AddColors(items, categoryId, layer, "clothing", [ ("sky", "Hemelsblauw", "Sky blue", layer == "clothing" ? "shirtSky" : "accessoryLilac", "#8fc8ef", "#67a8d8", "#b6ddf6", "#417895"), ("mint", "Mintgroen", "Mint", layer == "clothing" ? "shirtMint" : "accessoryCoral", "#9edfc0", "#72bf9a", "#c5efd9", "#4f8f70"), ("rose", "Roze", "Rose", "shirtRose", "#f0a8bd", "#d97f9c", "#f7c8d7", "#9a5268"), ("sun", "Zonnig geel", "Sun", "shirtSun", "#f7d56e", "#e6b94b", "#ffe89a", "#9a7a2f") ]);
}
