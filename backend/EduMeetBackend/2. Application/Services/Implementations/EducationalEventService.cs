using _1._Domain.Models;
using _2._Application.Exceptions;
using _2._Application.Requests;
using _2._Application.Responses;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Notifications;
using Microsoft.EntityFrameworkCore;

namespace _2._Application.Services.Implementations;

public sealed class EducationalEventService(
    IAppUserRepository appUserRepository,
    IFileUploadService fileUploadService,
    IAttendanceTokenService attendanceTokenService,
    IEducationalEventRepository eventRepository,
    IEmailOutboxRepository emailOutboxRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IEducationalEventService
{
    public async Task<IReadOnlyList<EducationalEventResponse>> GetAllAsync(
        GetEducationalEventsRequest request,
        CancellationToken cancellationToken = default)
    {
        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var includePast = request.Scope == EventTimeScope.All;

        var events = await eventRepository.SearchWithDetailsAsync(
            request.Search,
            request.Category,
            includePast,
            nowUtc,
            organizerId: null,
            cancellationToken: cancellationToken);

        var upcomingEvents = events
            .Where(educationalEvent => educationalEvent.Date > nowUtc)
            .OrderBy(educationalEvent => educationalEvent.Date);

        var orderedEvents = includePast
            ? upcomingEvents.Concat(
                events
                    .Where(educationalEvent =>
                        educationalEvent.Date <= nowUtc)
                    .OrderByDescending(educationalEvent =>
                        educationalEvent.Date))
            : upcomingEvents;

        return orderedEvents
            .Select(educationalEvent => ToResponse(educationalEvent))
            .ToList();
    }

    public async Task<IReadOnlyList<EducationalEventResponse>>
        GetOrganizedEventsAsync(
            Guid organizerId,
            GetEducationalEventsRequest request,
            CancellationToken cancellationToken = default)
    {
        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var includePast = request.Scope == EventTimeScope.All;
        var events = await eventRepository.SearchWithDetailsAsync(
            request.Search,
            request.Category,
            includePast,
            nowUtc,
            organizerId,
            cancellationToken);

        var upcomingEvents = events
            .Where(educationalEvent => educationalEvent.Date > nowUtc)
            .OrderBy(educationalEvent => educationalEvent.Date);

        var orderedEvents = includePast
            ? upcomingEvents.Concat(
                events
                    .Where(educationalEvent =>
                        educationalEvent.Date <= nowUtc)
                    .OrderByDescending(educationalEvent =>
                        educationalEvent.Date))
            : upcomingEvents;

        return orderedEvents
            .Select(educationalEvent => ToResponse(educationalEvent))
            .ToList();
    }

    public async Task<IReadOnlyList<EducationalEventResponse>>
        GetMyUpcomingScheduleAsync(
            string username,
            CancellationToken cancellationToken = default)
    {
        var user = await appUserRepository.FindByUsernameAsync(
            username,
            cancellationToken);

        if (user is null)
        {
            throw new NotFoundException(
                "The authenticated user no longer exists.");
        }

        if (user.IndividualProfile is null)
        {
            throw new ForbiddenException(
                "Only individual accounts have a registered-event schedule.");
        }

        var individualProfileId = user.IndividualProfile.Id;
        var events = await eventRepository
            .GetUpcomingRegisteredWithDetailsAsync(
                individualProfileId,
                timeProvider.GetUtcNow().UtcDateTime,
                cancellationToken);

        return events
            .Select(educationalEvent =>
                ToResponse(
                    educationalEvent,
                    individualProfileId))
            .ToList();
    }

    public async Task<EducationalEventResponse?> GetByIdAsync(
        Guid eventId,
        string? currentUsername,
        CancellationToken cancellationToken = default)
    {
        var educationalEvent =
            await eventRepository.GetByIdWithOrganizerAsync(
                eventId,
                cancellationToken);

        if (educationalEvent is null)
        {
            return null;
        }

        Guid? currentIndividualProfileId = null;

        if (!string.IsNullOrWhiteSpace(currentUsername))
        {
            var currentUser = await appUserRepository.FindByUsernameAsync(
                currentUsername,
                cancellationToken);

            currentIndividualProfileId =
                currentUser?.IndividualProfile?.Id;
        }

        return ToResponse(
            educationalEvent,
            currentIndividualProfileId,
            includeReviewDetails: true);
    }

    public async Task<EducationalEventResponse?> CreateAsync(
        CreateEducationalEventRequest request,
        string organizerUsername,
        UploadedFileData? coverImage,
        CancellationToken cancellationToken = default)
    {
        var organizers = await appUserRepository.FindAsync(
            predicate: user => user.UserName == organizerUsername,
            include: query => query
                .Include(user => user.IndividualProfile)
                .Include(user => user.OrganizationProfile),
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
            GooglePlaceId = request.GooglePlaceId?.Trim(),
            OrganizerId = organizer.Id,
            Organizer = organizer
        };

        eventRepository.Add(educationalEvent);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToResponse(educationalEvent);
    }

    public async Task<EventRegistrationResponse> RegisterUserForEventAsync(
        Guid eventId,
        string username,
        CancellationToken cancellationToken = default)
    {
        var user = await appUserRepository.FindByUsernameAsync(
            username,
            cancellationToken);

        if (user is null)
        {
            throw new NotFoundException(
                "The authenticated user no longer exists.");
        }

        if (user.IndividualProfile is null)
        {
            throw new ForbiddenException(
                "Only individual accounts can register for events.");
        }

        var educationalEvent =
            await eventRepository.GetTrackedByIdWithParticipantsAsync(
                eventId,
                cancellationToken);

        if (educationalEvent is null)
        {
            throw new NotFoundException(
                "The requested event does not exist.");
        }

        if (educationalEvent.OrganizerId == user.Id)
        {
            throw new ForbiddenException(
                "You cannot register for an event that you organized.");
        }

        if (educationalEvent.Date <= timeProvider.GetUtcNow().UtcDateTime)
        {
            throw new ConflictException(
                "Registration can no longer be changed after the event has started.");
        }

        var individualProfileId = user.IndividualProfile.Id;

        var isAlreadyRegistered =
            educationalEvent.EventParticipants.FirstOrDefault(
                participant =>
                    participant.ParticipantId == individualProfileId);

        bool isRegistered;

        if (isAlreadyRegistered is not null)
        {
            educationalEvent.EventParticipants.Remove(isAlreadyRegistered);
            isRegistered = false;
        }
        else
        {
            var attendanceToken = attendanceTokenService.CreateToken();
            
            educationalEvent.EventParticipants.Add(
                new EventParticipant
                {
                    ParticipantId = individualProfileId,
                    EducationalEventId = educationalEvent.Id,
                    AttendanceTokenHash = attendanceToken.Hash
                });
            
            

            var recipientMail = user.Email;
            var recipientName =
                $"{user.IndividualProfile.FirstName} " +
                user.IndividualProfile.LastName;
            
            emailOutboxRepository.Enqueue(
                    new EventRegistrationEmailMessage(
                        recipientMail,
                        recipientName,
                        educationalEvent.Id,
                        educationalEvent.Title,
                        educationalEvent.Date,
                        educationalEvent.LocationName,
                        attendanceToken.Value), 
                    timeProvider.GetUtcNow().UtcDateTime);

            isRegistered = true;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new EventRegistrationResponse(
            educationalEvent.Id,
            IsRegistered: isRegistered,
            RegisteredPeopleCount:
                educationalEvent.EventParticipants.Count);
    }

    public async Task<ReviewCreatedResponse> CreateReviewAsync(
        Guid eventId,
        string username,
        ReviewRequest reviewRequest,
        CancellationToken cancellationToken = default)
    {
        var educationalEvent = await eventRepository.GetTrackedForReviewAsync(
            eventId,
            cancellationToken);

        if (educationalEvent is null)
        {
            throw new NotFoundException("The requested event does not exist.");
        }

        var user = await appUserRepository.FindByUsernameAsync(
            username,
            cancellationToken);

        if (user is null)
        {
            throw new NotFoundException(
                "The authenticated user no longer exists.");
        }

        if (user.IndividualProfile is null)
        {
            throw new ForbiddenException(
                "Only individual accounts can review events.");
        }

        if (educationalEvent.OrganizerId == user.Id)
        {
            throw new ForbiddenException(
                "You cannot review an event that you organized.");
        }

        if (educationalEvent.Date > timeProvider.GetUtcNow().UtcDateTime)
        {
            throw new ConflictException(
                "You can review an event only after it has taken place.");
        }

        var reviewerId = user.IndividualProfile.Id;

        var attendedEvent = educationalEvent.EventParticipants.Any(
            participant => participant.ParticipantId == reviewerId);

        if (!attendedEvent)
        {
            throw new ForbiddenException(
                "Only registered participants can review this event.");
        }


        if (educationalEvent.Reviews.Any(
                existingReview => existingReview.ReviewerId == reviewerId))
        {
            throw new ConflictException(
                "You have already reviewed this event.");
        }

        var review = new Review
        {
            Grade = reviewRequest.Grade,
            Description = reviewRequest.Description.Trim(),
            ReviewerId = reviewerId,
            EducationalEventId = eventId
        };

        educationalEvent.Reviews.Add(review);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new ReviewCreatedResponse(
            eventId,
            new EventReviewResponse(
                user.Id,
                $"{user.IndividualProfile.FirstName} " +
                user.IndividualProfile.LastName,
                user.ImageUrl,
                review.Grade,
                review.Description),
            educationalEvent.Reviews.Average(item => item.Grade),
            educationalEvent.Reviews.Count);
    }

    public async Task<ReviewDeletedResponse> DeleteReviewAsync(
        Guid eventId,
        string username,
        CancellationToken cancellationToken = default)
    {
        var educationalEvent = await eventRepository.GetTrackedForReviewAsync(
            eventId,
            cancellationToken);

        if (educationalEvent is null)
        {
            throw new NotFoundException("The requested event does not exist.");
        }

        var user = await appUserRepository.FindByUsernameAsync(
            username,
            cancellationToken);

        if (user is null)
        {
            throw new NotFoundException(
                "The authenticated user no longer exists.");
        }

        if (user.IndividualProfile is null)
        {
            throw new ForbiddenException(
                "Only individual accounts can remove event reviews.");
        }

        var review = educationalEvent.Reviews.SingleOrDefault(
            existingReview =>
                existingReview.ReviewerId == user.IndividualProfile.Id);

        if (review is null)
        {
            throw new NotFoundException(
                "You have not submitted a review for this event.");
        }

        educationalEvent.Reviews.Remove(review);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var ratingCount = educationalEvent.Reviews.Count;
        var averageRating = ratingCount == 0
            ? null
            : (double?)educationalEvent.Reviews.Average(
                existingReview => existingReview.Grade);

        return new ReviewDeletedResponse(
            eventId,
            averageRating,
            ratingCount);
    }

    public async Task<AttendanceCheckInResponse> CheckInParticipantAsync(
        Guid eventId,
        string organizerUsername,
        AttendanceCheckInRequest request,
        CancellationToken cancellationToken = default)
{
    var organizer =
        await appUserRepository.FindByUsernameAsync(
            organizerUsername,
            cancellationToken);

    if (organizer is null)
    {
        throw new NotFoundException(
            "The authenticated user no longer exists.");
    }

    var educationalEvent =
        await eventRepository.GetTrackedForAttendanceAsync(
            eventId,
            cancellationToken);

    if (educationalEvent is null)
    {
        throw new NotFoundException(
            "The requested event does not exist.");
    }

    if (educationalEvent.OrganizerId != organizer.Id)
    {
        throw new ForbiddenException(
            "Only the event organizer can check in participants.");
    }

    var nowUtc =
        timeProvider.GetUtcNow().UtcDateTime;

    var checkInOpensAtUtc =
        educationalEvent.Date.AddHours(-1);

    var checkInClosesAtUtc =
        educationalEvent.Date.AddHours(12);

    // if (nowUtc < checkInOpensAtUtc)
    // {
    //     throw new ConflictException(
    //         "Attendance check-in has not opened yet.");
    // }

    if (nowUtc > checkInClosesAtUtc)
    {
        throw new ConflictException(
            "Attendance check-in has closed.");
    }

    var attendanceTokenHash =
        attendanceTokenService.HashToken(
            request.AttendanceToken.Trim());

    var eventParticipant =
        educationalEvent.EventParticipants
            .SingleOrDefault(participant =>
                participant.AttendanceTokenHash ==
                attendanceTokenHash);

    if (eventParticipant is null)
    {
        throw new NotFoundException(
            "The attendance code is invalid for this event.");
    }

    var alreadyCheckedIn =
        eventParticipant.CheckedInAtUtc.HasValue;

    if (!alreadyCheckedIn)
    {
        eventParticipant.CheckedInAtUtc = nowUtc;
        eventParticipant.CheckedInByUserId =
            organizer.Id;

        await unitOfWork.SaveChangesAsync(
            cancellationToken);
    }

    var registeredCount =
        educationalEvent.EventParticipants.Count;

    var attendedCount =
        educationalEvent.EventParticipants.Count(
            participant =>
                participant.CheckedInAtUtc.HasValue);

    var attendanceRate =
        CalculateAttendanceRate(
            registeredCount,
            attendedCount);

    var profile = eventParticipant.Participant;

    return new AttendanceCheckInResponse(
        educationalEvent.Id,
        profile.AppUserId,
        $"{profile.FirstName} {profile.LastName}",
        eventParticipant.CheckedInAtUtc!.Value,
        alreadyCheckedIn,
        registeredCount,
        attendedCount,
        attendanceRate);
}
    public async Task<AttendanceSummaryResponse> GetAttendanceSummaryAsync(
            Guid eventId,
            string organizerUsername,
            CancellationToken cancellationToken = default)
    {
        var organizer =
            await appUserRepository.FindByUsernameAsync(
                organizerUsername,
                cancellationToken);

        if (organizer is null)
        {
            throw new NotFoundException(
                "The authenticated user no longer exists.");
        }

        var educationalEvent =
            await eventRepository.GetTrackedForAttendanceAsync(
                eventId,
                cancellationToken);

        if (educationalEvent is null)
        {
            throw new NotFoundException(
                "The requested event does not exist.");
        }

        if (educationalEvent.OrganizerId != organizer.Id)
        {
            throw new ForbiddenException(
                "Only the event organizer can view attendance.");
        }

        var participants =
            educationalEvent.EventParticipants
                .OrderByDescending(participant =>
                    participant.CheckedInAtUtc.HasValue)
                .ThenBy(participant =>
                    participant.Participant.FirstName)
                .Select(participant =>
                    new AttendanceParticipantResponse(
                        participant.Participant.AppUserId,
                        $"{participant.Participant.FirstName} " +
                        participant.Participant.LastName,
                        participant.Participant.AppUser.ImageUrl,
                        participant.CheckedInAtUtc))
                .ToList();

        var attendedCount =
            participants.Count(participant =>
                participant.CheckedInAtUtc.HasValue);

        return new AttendanceSummaryResponse(
            educationalEvent.Id,
            participants.Count,
            attendedCount,
            CalculateAttendanceRate(
                participants.Count,
                attendedCount),
            participants);
    }

    private static EducationalEventResponse ToResponse(
        EducationalEvent educationalEvent,
        Guid? currentIndividualProfileId = null,
        bool includeReviewDetails = false)
    {
        var organizer = educationalEvent.Organizer;

        var organizerName = organizer.IndividualProfile is not null
            ? $"{organizer.IndividualProfile.FirstName} " +
              $"{organizer.IndividualProfile.LastName}"
            : organizer.OrganizationProfile?.Name
              ?? organizer.UserName
              ?? "EduMeet organizer";

        var isCurrentUserRegistered =
            currentIndividualProfileId.HasValue &&
            educationalEvent.EventParticipants.Any(
                participant =>
                    participant.ParticipantId ==
                    currentIndividualProfileId.Value);

        var ratingCount = educationalEvent.Reviews.Count;
        var averageRating = ratingCount == 0
            ? null
            : (double?)educationalEvent.Reviews.Average(
                review => review.Grade);

        var hasCurrentUserReviewed =
            currentIndividualProfileId.HasValue &&
            educationalEvent.Reviews.Any(
                review => review.ReviewerId ==
                    currentIndividualProfileId.Value);

        IReadOnlyList<EventReviewResponse> reviews = includeReviewDetails
            ? educationalEvent.Reviews
                .OrderByDescending(review => review.Id)
                .Select(review => new EventReviewResponse(
                    review.Reviewer.AppUserId,
                    $"{review.Reviewer.FirstName} " +
                    review.Reviewer.LastName,
                    review.Reviewer.AppUser.ImageUrl,
                    review.Grade,
                    review.Description))
                .ToList()
            : [];
        
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
            organizer.ImageUrl,
            educationalEvent.EventParticipants.Count,
            isCurrentUserRegistered,
            averageRating,
            ratingCount,
            hasCurrentUserReviewed,
            reviews);
    }
    
    
    private static double? CalculateAttendanceRate(
        int registeredCount,
        int attendedCount)
    {
        if (registeredCount == 0)
        {
            return null;
        }

        return Math.Round(
            attendedCount * 100.0 / registeredCount,
            digits: 1);
    }
}
