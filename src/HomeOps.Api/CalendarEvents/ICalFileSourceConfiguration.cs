namespace HomeOps.Api.CalendarEvents;

public sealed class ICalFileSourceConfiguration : EventSourceConfiguration
{
    public string FileReference { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public DateTimeOffset UploadedUtc { get; set; }
}
