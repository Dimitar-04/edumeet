using _1._Domain.Models;
using _2._Application.Requests;
using _2._Application.Results.Common;

namespace _2._Application.Interfaces.Repositories;

public interface IEducationalEventRepository : IBaseRepository<EducationalEvent>
{
    Task<IReadOnlyList<EducationalEvent>> SearchWithDetailsAsync(
        string? search,
        string? category,
        bool includePast,
        DateTime nowUtc,
        Guid? organizerId = null,
        CancellationToken cancellationToken = default);
    
    Task<PagedResult<EducationalEvent>>
        SearchPagedWithDetailsAsync(
            string? search,
            string? category,
            EventTimeScope scope,
            DateTime nowUtc,
            int pageNumber,
            int pageSize,
            Guid? organizerId = null,
            CancellationToken cancellationToken = default);

    Task<PagedResult<EducationalEvent>> GetUpcomingRegisteredWithDetailsAsync(
            Guid individualProfileId,
            DateTime nowUtc,
            int pageNumber,
            int pageSize,
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
