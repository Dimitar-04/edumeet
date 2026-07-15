using _1._Domain.Enums;
using _1._Domain.Models;
using _2._Application.Auth.Requests;
using _2._Application.Auth.Responses;
using _2._Application.Auth.Results;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace _3._Infrastracture.Services;

public sealed class AuthService(
    IAppUserRepository appUserRepository,
    IIndividualProfileRepository individualProfileRepository,
    IOrganizationProfileRepository organizationProfileRepository,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<RegistrationResult> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var requestErrors = ValidateRequest(request);

        if (requestErrors.Count > 0)
        {
            return RegistrationResult.Failure(requestErrors);
        }

        try
        {
            var user = mapper.Map<AppUser>(request);

            
            var userCreationResult = await appUserRepository.AddAsync(
                user,
                request.Password);

            if (!userCreationResult.Succeeded)
            {
                return RegistrationResult.Failure(
                    userCreationResult.Errors);
            }

            IndividualProfile? individualProfile = null;
            OrganizationProfile? organizationProfile = null;

            switch (request.AccountType)
            {
                case AccountType.Individual:
                {
                    individualProfile = mapper.Map<IndividualProfile>(
                        request.Individual!);
                    individualProfile.AppUserId = user.Id;

                    individualProfileRepository.Add(individualProfile);
                    break;
                }

                case AccountType.Organization:
                {
                    organizationProfile = mapper.Map<OrganizationProfile>(
                        request.Organization!);
                    organizationProfile.AppUserId = user.Id;

                    organizationProfileRepository.Add(organizationProfile);
                    break;
                }
            }
            
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = new RegisteredUserResponse(
                user.Id,
                user.UserName!,
                user.Email!,
                user.PhoneNumber,
                user.AccountType,
                individualProfile is null
                    ? null
                    : new IndividualProfileResponse(
                        individualProfile.Id,
                        individualProfile.FirstName,
                        individualProfile.LastName),
                organizationProfile is null
                    ? null
                    : new OrganizationProfileResponse(
                        organizationProfile.Id,
                        organizationProfile.Name,
                        organizationProfile.Website,
                        organizationProfile.LogoUrl));

            return RegistrationResult.Success(response);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "An unexpected error occurred while registering user {UserName}.",
                request.UserName);

            throw;
        }
    }

    private static List<string> ValidateRequest(RegisterRequest request)
    {
        var errors = new List<string>();

        if (request.Password != request.ConfirmPassword)
        {
            errors.Add("Password and confirmation password must match.");
        }

        switch (request.AccountType)
        {
            case AccountType.Individual:
                if (request.Individual is null)
                {
                    errors.Add("Individual profile information is required.");
                }

                if (request.Organization is not null)
                {
                    errors.Add(
                        "Organization information cannot be provided for an individual account.");
                }

                break;

            case AccountType.Organization:
                if (request.Organization is null)
                {
                    errors.Add("Organization profile information is required.");
                }

                if (request.Individual is not null)
                {
                    errors.Add(
                        "Individual information cannot be provided for an organization account.");
                }

                break;

            default:
                errors.Add("The selected account type is invalid.");
                break;
        }

        return errors;
    }
}
