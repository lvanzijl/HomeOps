using System.Text.Json.Serialization;

namespace HomeOps.Api.AvatarCatalog;

public static class AvatarCatalogConstants
{
    public const string CatalogId = "familyboard.avatar";
    public const string SchemaVersion = "1.0";
}

public sealed record AvatarCatalogDefinition(
    string CatalogId,
    string SchemaVersion,
    string DefaultLocale,
    IReadOnlyList<string> SupportedLocales,
    IReadOnlyList<AvatarCatalogPalette> Palettes,
    IReadOnlyList<AvatarCatalogCategory> Categories,
    IReadOnlyList<AvatarCatalogItem> Items,
    IReadOnlyDictionary<string, string> Defaults,
    AvatarCatalogThemePlaceholder? Theme = null);

public sealed record AvatarCatalogThemePlaceholder(string Id, string Description);

public sealed record AvatarCatalogPalette(
    string Id,
    int Order,
    IReadOnlyDictionary<string, string> Labels,
    IReadOnlyList<string> CategoryIds);

public sealed record AvatarCatalogCategory(
    string Id,
    string Slot,
    AvatarCatalogCategoryKind Kind,
    bool Required,
    bool AllowsNone,
    bool MultiSelect,
    int Order,
    IReadOnlyDictionary<string, string> Labels,
    IReadOnlyDictionary<string, string> AccessibilityLabels,
    [property: JsonPropertyName("descriptions")] IReadOnlyDictionary<string, string> Description,
    AvatarCatalogPresentation Presentation,
    IReadOnlyList<string> Tags);

public sealed record AvatarCatalogPresentation(string Control, string Density);

public sealed record AvatarCatalogItem(
    string Id,
    string CategoryId,
    AvatarCatalogItemType Type,
    AvatarCatalogItemStatus Status,
    int Order,
    IReadOnlyDictionary<string, string> Labels,
    IReadOnlyDictionary<string, string> ShortLabels,
    IReadOnlyDictionary<string, string> AccessibilityLabels,
    [property: JsonPropertyName("descriptions")] IReadOnlyDictionary<string, string> Description,
    IReadOnlyList<string> Tags,
    AvatarCatalogRendererBinding? Renderer,
    AvatarCatalogColor? Color,
    string? DeprecatedSince,
    string? ReplacementId,
    IReadOnlyList<string> LegacyIds);

public sealed record AvatarCatalogRendererBinding(string RendererFamily, string RendererToken, string? Layer = null, string? MountPoint = null);

public sealed record AvatarCatalogColor(string Format, string Base, string Shade, string Highlight, string Line, string PaletteId);

public enum AvatarCatalogCategoryKind { RendererStyle, Color, System }
public enum AvatarCatalogItemType { RendererStyle, Color, None }
public enum AvatarCatalogItemStatus { Active, Deprecated, Hidden, Retired }
