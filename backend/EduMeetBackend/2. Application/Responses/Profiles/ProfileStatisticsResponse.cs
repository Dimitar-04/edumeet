namespace _2._Application.Responses;

public sealed record ProfileStatisticsResponse(
    int HostedEventsCount,
    double? AverageRating,
    int ReviewCount,
    string? FavoriteCategory);
