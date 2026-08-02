namespace _2._Application.Auth.Responses;

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
    string? OrganizerImageUrl
);
