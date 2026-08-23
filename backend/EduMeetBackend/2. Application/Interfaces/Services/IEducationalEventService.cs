using _2._Application.Requests;
using _2._Application.Responses;
using _2._Application.Results.Common;

namespace _2._Application.Interfaces;

public interface IEducationalEventService
{
    Task<PagedResult<EducationalEventResponse>> GetAllAsync(
        GetEducationalEventsRequest request,
        CancellationToken cancellationToken = default);

    Task<PagedResult<EducationalEventResponse>>
        GetMyUpcomingScheduleAsync(
            string username,
            PaginationRequest request,
            CancellationToken cancellationToken = default);

    Task<PagedResult<EducationalEventResponse>>
        GetOrganizedEventsAsync(
            Guid organizerId,
            GetEducationalEventsRequest request,
            CancellationToken cancellationToken = default);

    Task<EducationalEventResponse?> GetByIdAsync(
        Guid eventId,
        string? currentUsername,
        CancellationToken cancellationToken = default);

    Task<EducationalEventResponse?> CreateAsync(
        CreateEducationalEventRequest request,
        string organizerUsername,
        UploadedFileData? coverImage,
        CancellationToken cancellationToken = default);

    Task<EventRegistrationResponse> RegisterUserForEventAsync(
        Guid eventId,
        string username,
        CancellationToken cancellationToken = default);

    Task<ReviewCreatedResponse> CreateReviewAsync(
        Guid eventId,
        string username,
        ReviewRequest reviewRequest,
        CancellationToken cancellationToken = default);

    Task<ReviewDeletedResponse> DeleteReviewAsync(
        Guid eventId,
        string username,
        CancellationToken cancellationToken = default);
    
    Task<AttendanceCheckInResponse> CheckInParticipantAsync(
        Guid eventId,
        string organizerUsername,
        AttendanceCheckInRequest request,
        CancellationToken cancellationToken = default);

    Task<AttendanceSummaryResponse> GetAttendanceSummaryAsync(
        Guid eventId,
        string organizerUsername,
        CancellationToken cancellationToken = default);
}
