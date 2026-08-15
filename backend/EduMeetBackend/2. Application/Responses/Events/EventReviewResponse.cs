namespace _2._Application.Responses;

public sealed record EventReviewResponse(
    Guid ReviewerId,
    string ReviewerName,
    string? ReviewerImageUrl,
    int Grade,
    string Description);
