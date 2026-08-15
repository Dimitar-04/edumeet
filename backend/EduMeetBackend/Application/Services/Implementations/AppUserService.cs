using _1._Domain.Enums;
using _1._Domain.Models;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Requests;
using _2._Application.Responses;

namespace _2._Application.Services.Implementations;

public class AppUserService:IAppUserService
{
    private readonly IAppUserRepository _appUserRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly  IFileUploadService _fileUploadService;

    public AppUserService(IAppUserRepository appUserRepository, IUnitOfWork unitOfWork, IFileUploadService fileUploadService)
    {
        _appUserRepository = appUserRepository;
        _unitOfWork = unitOfWork;
        _fileUploadService = fileUploadService;
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

    public async Task<PublicUserProfileResponse?> GetUserProfileByIdAsync(Guid userId)
    {
        var user = await _appUserRepository.GetPublicProfileAsync(userId);

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
        var events = user.OrganizedEvents
            .OrderByDescending(educationalEvent => educationalEvent.Date)
            .Select(educationalEvent =>
            {
                var ratingCount = educationalEvent.Reviews.Count;

                double? averageRating = ratingCount == 0
                    ? null
                    : educationalEvent.Reviews.Average(
                        review => review.Grade);

                var reviews = educationalEvent.Reviews
                    .Select(r => new ReviewResponse(
                        r.Grade,
                        r.Description
                    )).ToList();

                return new ProfileEventResponse(
                    educationalEvent.Id,
                    educationalEvent.Title,
                    educationalEvent.Category,
                    educationalEvent.Format,
                    educationalEvent.ImageUrl,
                    educationalEvent.Date,
                    educationalEvent.LocationName,
                    averageRating,
                    ratingCount,
                    reviews);
            })
            .ToList();
        
        return new PublicUserProfileResponse(
            user.Id,
            user.UserName!,
            user.AccountType,
            displayName,
            user.ImageUrl,
            individual,
            organization,
            events);
    }
}
