namespace _2._Application.Responses;

public sealed record EducationalEventResponse(
    Guid Id,
    string Title,
    string Description,
    string Category,
    string Format,
    string? ImageUrl,
    DateTime Date,
    string LocationName,
    string Address,
    double Latitude,
    double Longitude,
    string? GooglePlaceId,
    Guid OrganizerId,
    string OrganizerName,
    string? OrganizerImageUrl,
    int RegisteredPeopleCount,
    int AttendedPeopleCount,
    bool IsCurrentUserRegistered,
    bool HasCurrentUserAttended,
    double? AverageRating,
    int RatingCount,
    bool HasCurrentUserReviewed,
    IReadOnlyList<EventReviewResponse> Reviews
);
