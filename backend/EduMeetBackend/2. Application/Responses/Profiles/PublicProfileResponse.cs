using _1._Domain.Enums;

namespace _2._Application.Responses;

public sealed record PublicUserProfileResponse(
    Guid Id,
    string UserName,
    AccountType AccountType,
    string DisplayName,
    string? ImageUrl,
    IndividualProfileResponse? Individual,
    OrganizationProfileResponse? Organization,
    ProfileStatisticsResponse Statistics);
