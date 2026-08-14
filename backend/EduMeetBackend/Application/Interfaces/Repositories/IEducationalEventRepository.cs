using _1._Domain.Models;

namespace _2._Application.Interfaces.Repositories;

public interface IEducationalEventRepository : IBaseRepository<EducationalEvent>
{
    Task<IReadOnlyList<EducationalEvent>> GetUpcomingAsync(
        DateTime fromUtc,
        CancellationToken cancellationToken = default);

    Task<EducationalEvent?> GetByIdWithOrganizerAsync(
        Guid eventId,
        CancellationToken cancellationToken = default);
}
