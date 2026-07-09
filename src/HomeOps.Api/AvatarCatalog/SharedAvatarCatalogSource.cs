using System.Text.Json;
using System.Text.Json.Serialization;

namespace HomeOps.Api.AvatarCatalog;

public interface IAvatarCatalogSource
{
    AvatarCatalogDefinition LoadCatalog();
}

public sealed class SharedAvatarCatalogSource : IAvatarCatalogSource
{
    private const string CatalogFileName = "avatar-catalog.json";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    public AvatarCatalogDefinition LoadCatalog()
    {
        var catalogPath = Path.Combine(AppContext.BaseDirectory, CatalogFileName);
        if (!File.Exists(catalogPath))
        {
            throw new FileNotFoundException($"Shared avatar catalog source was not found at '{catalogPath}'.", catalogPath);
        }

        using var stream = File.OpenRead(catalogPath);
        return JsonSerializer.Deserialize<AvatarCatalogDefinition>(stream, JsonOptions)
            ?? throw new InvalidOperationException("Shared avatar catalog source could not be deserialized.");
    }
}
