using _1._Domain.Models;
using _2._Application.Requests;
using _2._Application.Responses;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;

namespace _2._Application.Services.Implementations;

public sealed class EducationalEventService(
    IAppUserRepository appUserRepository,
    IFileUploadService fileUploadService,
    IEducationalEventRepository eventRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IEducationalEventService
{
    public async Task<IReadOnlyList<EducationalEventResponse>> GetUpcomingAsync(
        CancellationToken cancellationToken = default)
    {
        var events = await eventRepository.GetUpcomingAsync(
            timeProvider.GetUtcNow().UtcDateTime,
            cancellationToken);

        return events.Select(ToResponse).ToList();
    }

    public async Task<EducationalEventResponse?> GetByIdAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        var educationalEvent =
            await eventRepository.GetByIdWithOrganizerAsync(
                eventId,
                cancellationToken);

        return educationalEvent is null
            ? null
            : ToResponse(educationalEvent);
    }

    public async Task<EducationalEventResponse?> CreateAsync(
        CreateEducationalEventRequest request,
        string organizerUsername,
        UploadedFileData? coverImage,
        CancellationToken cancellationToken = default)
    {
        var organizers = await appUserRepository.FindAsync(
            predicate: user => user.UserName == organizerUsername,
            cancellationToken: cancellationToken);

        var organizer = organizers.FirstOrDefault();

        if (organizer is null)
        {
            return null;
        }

        string? imageUrl = null;

        if (coverImage is not null)
        {
            imageUrl = await fileUploadService.UploadFileAsync(
                coverImage.Bytes,
                coverImage.OriginalFileName,
                "event-images");
        }

        var educationalEvent = new EducationalEvent
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category.Trim(),
            Format = request.Format.Trim(),
            ImageUrl = imageUrl,
            Date = request.Date.UtcDateTime,
            LocationName = request.LocationName.Trim(),
            Address = request.Address.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            GooglePlaceId = request.GooglePlaceId.Trim(),
            OrganizerId = organizer.Id,
            Organizer = organizer
        };

        eventRepository.Add(educationalEvent);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToResponse(educationalEvent);
    }

    private static EducationalEventResponse ToResponse(
        EducationalEvent educationalEvent)
    {
        string organizerName = "";
        if (educationalEvent.Organizer.IndividualProfile is not null and var org)
        {
            organizerName = org.FirstName + " " + org.LastName;
        }
        else
        {
            organizerName = educationalEvent.Organizer.OrganizationProfile!.Name;
            
        }
        
        return new EducationalEventResponse(
            educationalEvent.Id,
            educationalEvent.Title,
            educationalEvent.Description,
            educationalEvent.Category,
            educationalEvent.Format,
            educationalEvent.ImageUrl,
            educationalEvent.Date,
            educationalEvent.LocationName,
            educationalEvent.Address,
            educationalEvent.Latitude,
            educationalEvent.Longitude,
            educationalEvent.GooglePlaceId,
            educationalEvent.OrganizerId,
            organizerName,
            educationalEvent.Organizer.ImageUrl);
    }
}
