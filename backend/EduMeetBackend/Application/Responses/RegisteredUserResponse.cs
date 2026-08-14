using _1._Domain.Enums;

namespace _2._Application.Responses;

public sealed record RegisteredUserResponse(
    Guid Id,
    string UserName,
    string Email,
    string? PhoneNumber,
    AccountType AccountType,
    string? ImageUrl,
    IndividualProfileResponse? Individual,
    OrganizationProfileResponse? Organization);
