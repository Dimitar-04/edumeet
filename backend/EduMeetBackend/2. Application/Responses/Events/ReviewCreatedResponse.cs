namespace _2._Application.Responses;

public sealed record ReviewCreatedResponse(
    Guid EventId,
    EventReviewResponse Review,
    double AverageRating,
    int RatingCount);
