using _1._Domain.Enums;
using _1._Domain.Models;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Requests;
using _2._Application.Responses;
using _2._Application.Results;

namespace _2._Application.Services.Implementations;

public class AppUserService:IAppUserService
{
    private readonly IAppUserRepository _appUserRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly  IFileUploadService _fileUploadService;
    private readonly ITokenService _tokenService;
    private readonly TimeProvider _timeProvider;

    public AppUserService(
        IAppUserRepository appUserRepository,
        IUnitOfWork unitOfWork,
        IFileUploadService fileUploadService,
        ITokenService tokenService,
        TimeProvider timeProvider)
    {
        _appUserRepository = appUserRepository;
        _unitOfWork = unitOfWork;
        _fileUploadService = fileUploadService;
        _tokenService = tokenService;
        _timeProvider = timeProvider;
    }

    public async Task<AppUser?> UpdateProfileImageAsync(string username, UploadedFileData image, CancellationToken ct = default)
    {
        var user = await _appUserRepository.FindTrackedByUsernameAsync(
            username,
            ct);
        if (user is null)
        {
            return null;
        }
        
        var imageUrl = await _fileUploadService.UploadFileAsync(
            image.Bytes,
            image.OriginalFileName,
            "profile-images");

        user.ImageUrl = imageUrl;
        await _unitOfWork.SaveChangesAsync(ct);

        return user;
    }

    public async Task<UsernameUpdateResult?> UpdateUsernameAsync(
        string currentUsername,
        string newUsername,
        CancellationToken cancellationToken = default)
    {
        var user = await _appUserRepository.FindTrackedByUsernameAsync(
            currentUsername,
            cancellationToken);

        if (user is null)
        {
            return null;
        }

        var trimmedUsername = newUsername.Trim();

        if (string.Equals(
                user.UserName,
                trimmedUsername,
                StringComparison.Ordinal))
        {
            return UsernameUpdateResult.Failure(
                ["Choose a username different from your current username."]);
        }

        var updateResult =
            await _appUserRepository.UpdateUserNameAsync(
                user,
                trimmedUsername);

        if (!updateResult.Succeeded)
        {
            return UsernameUpdateResult.Failure(
                updateResult.Errors);
        }

        var accessToken = _tokenService.CreateAccessToken(user);

        return UsernameUpdateResult.Success(
            ToRegisteredUserResponse(user),
            accessToken);
    }

    public async Task<PublicUserProfileResponse?> GetUserProfileByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _appUserRepository.GetPublicProfileAsync(
            userId,
            cancellationToken);

        if (user == null)
        {
            return null;
        }
        
        var displayName = user.AccountType switch
        {
            AccountType.Individual when user.IndividualProfile is not null =>
                $"{user.IndividualProfile.FirstName} " +
                $"{user.IndividualProfile.LastName}",

            AccountType.Organization when user.OrganizationProfile is not null =>
                user.OrganizationProfile.Name,

            _ => user.UserName ?? "EduMeet user"
        };
        
        var individual = user.IndividualProfile is null
            ? null
            : new IndividualProfileResponse(
                user.IndividualProfile.Id,
                user.IndividualProfile.FirstName,
                user.IndividualProfile.LastName);

        var organization = user.OrganizationProfile is null
            ? null
            : new OrganizationProfileResponse(
                user.OrganizationProfile.Id,
                user.OrganizationProfile.Name,
                user.OrganizationProfile.Website);
        var reviews = user.OrganizedEvents
            .SelectMany(educationalEvent => educationalEvent.Reviews)
            .ToList();

        var favoriteCategory = user.IndividualProfile is null
            ? null
            : await _appUserRepository
                .GetFavoriteAttendedCategoryAsync(
                    user.IndividualProfile.Id,
                    _timeProvider.GetUtcNow().UtcDateTime,
                    cancellationToken);

        var attendedEventsCount = user.IndividualProfile is null
            ? 0
            : await _appUserRepository.GetAttendedEventsCountAsync(
                user.IndividualProfile.Id,
                _timeProvider.GetUtcNow().UtcDateTime,
                cancellationToken);

        var statistics = new ProfileStatisticsResponse(
            user.OrganizedEvents.Count,
            reviews.Count == 0
                ? null
                : reviews.Average(review => review.Grade),
            reviews.Count,
            favoriteCategory,
            attendedEventsCount);

        return new PublicUserProfileResponse(
            user.Id,
            user.UserName!,
            user.AccountType,
            displayName,
            user.ImageUrl,
            individual,
            organization,
            statistics);
    }

    private static RegisteredUserResponse ToRegisteredUserResponse(
        AppUser user)
    {
        return new RegisteredUserResponse(
            user.Id,
            user.UserName!,
            user.Email!,
            user.PhoneNumber,
            user.AccountType,
            user.ImageUrl,
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
                    user.OrganizationProfile.Website));
    }
}
