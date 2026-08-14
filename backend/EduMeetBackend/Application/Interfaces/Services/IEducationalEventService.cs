using _2._Application.Requests;
using _2._Application.Responses;

namespace _2._Application.Interfaces;

public interface IEducationalEventService
{
    Task<IReadOnlyList<EducationalEventResponse>> GetUpcomingAsync(
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
}
