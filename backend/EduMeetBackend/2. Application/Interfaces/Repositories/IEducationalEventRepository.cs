using _1._Domain.Models;

namespace _2._Application.Interfaces.Repositories;

public interface IEducationalEventRepository : IBaseRepository<EducationalEvent>
{
    Task<IReadOnlyList<EducationalEvent>> SearchWithDetailsAsync(
        string? search,
        string? category,
        bool includePast,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EducationalEvent>> GetUpcomingRegisteredWithDetailsAsync(
            Guid individualProfileId,
            DateTime nowUtc,
            CancellationToken cancellationToken = default);

    Task<EducationalEvent?> GetByIdWithOrganizerAsync(
        Guid eventId,
        CancellationToken cancellationToken = default);

    Task<EducationalEvent?> GetTrackedByIdWithParticipantsAsync(
        Guid eventId,
        CancellationToken cancellationToken = default);

    Task<EducationalEvent?> GetTrackedForReviewAsync(
        Guid eventId,
        CancellationToken cancellationToken = default);
    
    Task<EducationalEvent?> GetTrackedForAttendanceAsync(
        Guid eventId,
        CancellationToken cancellationToken = default);
}
