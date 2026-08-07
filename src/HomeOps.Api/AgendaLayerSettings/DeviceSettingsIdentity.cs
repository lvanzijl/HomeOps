namespace HomeOps.Api.AgendaLayerSettings;

public sealed class DeviceSettingsIdentity
{
    public string DeviceId { get; set; } = string.Empty;
    public int SchemaVersion { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset LastSeenUtc { get; set; }
    public ICollection<AgendaLayerSetting> LayerSettings { get; set; } = [];
}
