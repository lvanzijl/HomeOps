namespace HomeOps.Api.Motivation;

public sealed record HelpfulMomentDto(Guid Id, string HouseholdId, string FamilyMemberId, string FamilyMemberName, string FamilyMemberDisplayColor, string FamilyMemberInitials, string Title, string? Description, string RecognitionTag, DateTimeOffset CreatedUtc);
public sealed record CreateHelpfulMomentRequest(string FamilyMemberId, string Title, string? Description, string? RecognitionTag);
