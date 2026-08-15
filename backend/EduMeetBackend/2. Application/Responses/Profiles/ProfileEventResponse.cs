namespace _2._Application.Responses;

public sealed record ProfileEventResponse(
    Guid Id,
    string Title,
    string Category,
    string Format,
    string? ImageUrl,
    DateTime Date,
    string LocationName,
    double? AverageRating,
    int RatingCount,
    List<ReviewResponse> Reviews);