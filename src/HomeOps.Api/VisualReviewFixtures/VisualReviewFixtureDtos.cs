namespace HomeOps.Api.VisualReviewFixtures;

public sealed record VisualReviewScenarioDto(string Name, string Purpose);
public sealed record ApplyVisualReviewScenarioResponse(string ScenarioName, DateTimeOffset AnchorUtc, int FamilyMembers, int Tasks, int Lists, int ListItems, int FamilyGoals, int IndividualGoals, int HelpfulMoments, int Events);
