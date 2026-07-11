namespace HomeOps.Api.Lists;

public sealed class ListItem
{
    public Guid Id { get; set; }
    public Guid ListId { get; set; }
    public List? List { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTimeOffset? CompletedUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedUtc { get; set; }
    public string? PreferredStore { get; set; }
    public DecorativeAvatarReferenceType? DecorativeAvatarReferenceType { get; set; }
    public string? DecorativeAvatarReferenceId { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
