namespace HomeOps.Api.WidgetLayouts;

public sealed class WidgetPlacement
{
    public Guid Id { get; set; }
    public Guid WorkspaceLayoutId { get; set; }
    public WorkspaceLayout? WorkspaceLayout { get; set; }
    public string WidgetType { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Size { get; set; } = string.Empty;
    public string ConfigurationJson { get; set; } = "{}";
}
