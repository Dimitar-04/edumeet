namespace _2._Application.Responses;

public sealed record ReviewDeletedResponse(
    Guid EventId,
    double? AverageRating,
    int RatingCount);
