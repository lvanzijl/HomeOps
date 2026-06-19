namespace HomeOps.Api.AgendaLayerSettings;

public sealed class AgendaLayerSetting
{
    public Guid Id { get; set; }
    public string DeviceKey { get; set; } = string.Empty;
    public string ViewType { get; set; } = string.Empty;
    public string SourceId { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
