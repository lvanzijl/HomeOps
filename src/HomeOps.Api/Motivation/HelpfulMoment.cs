using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;

namespace HomeOps.Api.Motivation;

public sealed class HelpfulMoment
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public string FamilyMemberId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RecognitionTag { get; set; } = HelpfulMomentTags.Kindness;
    public DateTimeOffset CreatedUtc { get; set; }
    public Household? Household { get; set; }
    public FamilyMember? FamilyMember { get; set; }
}

public static class HelpfulMomentTags
{
    public const string Kindness = "Kindness";
    public const string Initiative = "Initiative";
    public const string Teamwork = "Teamwork";
    public const string Responsibility = "Responsibility";
    public const string Routine = "Routine";

    public static readonly string[] All = [Kindness, Initiative, Teamwork, Responsibility, Routine];
}
