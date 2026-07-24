namespace _2._Application.Auth.Responses;

public sealed record OrganizationProfileResponse(
    Guid Id,
    string Name,
    string? Website);
