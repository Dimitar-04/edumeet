using _1._Domain.Enums;
using _1._Domain.Models;
using _2._Application.Auth.Requests;
using _2._Application.Auth.Responses;
using _2._Application.Auth.Results;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace _3._Infrastracture.Services;

public sealed class AuthService(
    IAppUserRepository appUserRepository,
    IIndividualProfileRepository individualProfileRepository,
    IOrganizationProfileRepository organizationProfileRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    ITokenService tokenService,
    TimeProvider timeProvider,
    IMapper mapper,
    ILogger<AuthService> logger,
    SignInManager<AppUser> signInManager) : IAuthService
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


            var refreshToken = tokenService.CreateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                AppUserId = user.Id,
                AppUser = user,
                TokenHash = refreshToken.Hash,
                CreatedAtUtc = timeProvider.GetUtcNow(),
                ExpiresAtUtc = refreshToken.ExpiresAtUtc
            };

            refreshTokenRepository.Add(refreshTokenEntity);
            
            
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var accessToken = tokenService.CreateAccessToken(user);
            
            var issuedTokens = new IssuedTokens(
                accessToken.Value,
                accessToken.ExpiresAtUtc,
                refreshToken.Value,
                refreshToken.ExpiresAtUtc);

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

            return RegistrationResult.Success(response, issuedTokens);
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
    
    
    public async Task<LoginResult> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await appUserRepository.FindByLoginAsync(
            request.Login.Trim(),
            cancellationToken);

        if (user is null)
        {
            return LoginResult.Failure(
                "Invalid username/email or password.");
        }

        var passwordResult =
            await signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
                lockoutOnFailure: true);

        if (!passwordResult.Succeeded)
        {
            await unitOfWork.SaveChangesAsync(
                cancellationToken);

            return LoginResult.Failure(
                "Invalid username/email or password.");
        }

        var refreshToken =
            tokenService.CreateRefreshToken();

        refreshTokenRepository.Add(
            new RefreshToken
            {
                AppUserId = user.Id,
                TokenHash = refreshToken.Hash,
                CreatedAtUtc =
                    timeProvider.GetUtcNow(),
                ExpiresAtUtc =
                    refreshToken.ExpiresAtUtc
            });

        await unitOfWork.SaveChangesAsync(
            cancellationToken);

        var accessToken =
            tokenService.CreateAccessToken(user);

        var tokens = new IssuedTokens(
            accessToken.Value,
            accessToken.ExpiresAtUtc,
            refreshToken.Value,
            refreshToken.ExpiresAtUtc);

        return LoginResult.Success(
            CreateUserResponse(user),
            tokens);
    }

    public async Task<RegisteredUserResponse?> GetCurrentUserAsync(string username, CancellationToken ct = default)
    {
        var user = await appUserRepository.FindByUsernameAsync(username, ct);
        if (user is null)
        {
            return null;
        }

        return CreateUserResponse(user);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var tokenHash = tokenService.HashRefreshToken(refreshToken);
        var storedToken = await refreshTokenRepository
                .GetByHashWithUserAsync(
                    tokenHash,
                    ct);
        
        if (storedToken is null ||
            storedToken.RevokedAtUtc is not null)
        {
            return;
        }
        
        storedToken.RevokedAtUtc = timeProvider.GetUtcNow();

        await unitOfWork.SaveChangesAsync(ct);
    }

    public async Task<RefreshResult> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(
                refreshToken))
        {
            return RefreshResult.Failure();
        }

        var tokenHash = tokenService.HashRefreshToken(refreshToken);

        var storedToken = await refreshTokenRepository.GetByHashWithUserAsync(tokenHash);
        
        var now = timeProvider.GetUtcNow();

        if (storedToken is null ||
            !storedToken.IsActive(now))
        {
            return RefreshResult.Failure();
        }
        
        storedToken.RevokedAtUtc = now;

        var replacement = tokenService.CreateRefreshToken(storedToken.ExpiresAtUtc); //why pass this
        
        refreshTokenRepository.Add(new RefreshToken
        {
            AppUserId = storedToken.AppUserId,
            TokenHash = replacement.Hash,
            CreatedAtUtc = now,
            ExpiresAtUtc = replacement.ExpiresAtUtc
        });
        
        await unitOfWork.SaveChangesAsync(
            ct);

        var accessToken =
            tokenService.CreateAccessToken(
                storedToken.AppUser);

        var issuedTokens =
            new IssuedTokens(
                accessToken.Value,
                accessToken.ExpiresAtUtc,
                replacement.Value,
                replacement.ExpiresAtUtc);

        return RefreshResult.Success(
            issuedTokens);
    }

    private static RegisteredUserResponse CreateUserResponse(AppUser user)
    {
        return new RegisteredUserResponse(
            user.Id,
            user.UserName!,
            user.Email!,
            user.PhoneNumber,
            user.AccountType,
            user.IndividualProfile is null
                ? null
                : new IndividualProfileResponse(
                    user.IndividualProfile.Id,
                    user.IndividualProfile.FirstName,
                    user.IndividualProfile.LastName),
            user.OrganizationProfile is null
                ? null
                : new OrganizationProfileResponse(
                    user.OrganizationProfile.Id,
                    user.OrganizationProfile.Name,
                    user.OrganizationProfile.Website,
                    user.OrganizationProfile.LogoUrl));
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
