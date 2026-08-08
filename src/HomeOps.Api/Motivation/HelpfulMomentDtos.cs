namespace HomeOps.Api.Motivation;

public sealed record HelpfulMomentDto(Guid Id, string HouseholdId, string FamilyMemberId, string FamilyMemberName, string FamilyMemberDisplayColor, string FamilyMemberInitials, bool FamilyMemberIsRemoved, string Title, string? Description, string RecognitionTag, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record CreateHelpfulMomentRequest(string FamilyMemberId, string Title, string? Description, string? RecognitionTag);
public sealed record UpdateHelpfulMomentRequest(string FamilyMemberId, string Title, string? Description, string? RecognitionTag, DateTimeOffset ExpectedUpdatedUtc);
