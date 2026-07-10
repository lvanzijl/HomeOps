using HomeOps.Api.FamilyMembers;

namespace HomeOps.Api.AvatarCatalog;

public sealed class AvatarSelection
{
    public string SchemaVersion { get; set; } = AvatarCatalogConstants.SchemaVersion;
    public Dictionary<string, string> Selections { get; set; } = [];

    public static AvatarSelection FromSelections(IReadOnlyDictionary<string, string> selections) => new()
    {
        SchemaVersion = AvatarCatalogConstants.SchemaVersion,
        Selections = selections.ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal)
    };
}

public sealed record AvatarSelectionDto(string SchemaVersion, IReadOnlyDictionary<string, string> Selections);

public static class AvatarSelectionSlots
{
    public const string HeadVariant = "headVariant";
    public const string SkinTone = "skinTone";
    public const string HairStyle = "hairStyle";
    public const string HairColor = "hairColor";
    public const string ClothingStyle = "clothingStyle";
    public const string ClothingColor = "clothingColor";
    public const string MouthStyle = "mouthStyle";
    public const string EyewearStyle = "eyewearStyle";
    public const string AccessoryStyle = "accessoryStyle";
    public const string AccessoryColor = "accessoryColor";

    public static readonly IReadOnlyDictionary<string, string> LegacyAvatarV2Fields = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        [HeadVariant] = nameof(AvatarV2Config.HeadVariant),
        [HairStyle] = nameof(AvatarV2Config.HairStyle),
        [HairColor] = nameof(AvatarV2Config.HairColor),
        [ClothingStyle] = nameof(AvatarV2Config.ClothingStyle),
        [ClothingColor] = nameof(AvatarV2Config.ClothingColor),
        [AccessoryStyle] = nameof(AvatarV2Config.Accessory),
        [AccessoryColor] = nameof(AvatarV2Config.AccessoryColor),
    };
}
