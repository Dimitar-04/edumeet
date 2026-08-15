namespace _2._Application.Responses;

public sealed record OrganizationProfileResponse(
    Guid Id,
    string Name,
    string? Website);
