using _1._Domain.Models;
using _2._Application.Interfaces.Repositories;
using _3._Infrastracture.Persitance.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Repositories;

public class EducationalEventRepository(ApplicationDbContext context) :BaseRepository<EducationalEvent>(context), IEducationalEventRepository
{
    public async Task<IReadOnlyList<EducationalEvent>> GetAllWithDetailsAsync(
        CancellationToken cancellationToken = default)
    {
        return await Context.EducationalEvents
            .AsNoTracking()
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(org=>org.IndividualProfile)
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(org => org.OrganizationProfile)
            .Include(educationalEvent =>
                educationalEvent.EventParticipants)
            .Include(educationalEvent =>
                educationalEvent.Reviews)
            .ToListAsync(cancellationToken);
    }

    public Task<EducationalEvent?> GetByIdWithOrganizerAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return Context.EducationalEvents
            .AsNoTracking()
            .AsSplitQuery()
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(organizer => organizer.IndividualProfile)
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(organizer => organizer.OrganizationProfile)
            .Include(educationalEvent =>
                educationalEvent.EventParticipants)
            .Include(educationalEvent => educationalEvent.Reviews)
                .ThenInclude(review => review.Reviewer)
                    .ThenInclude(reviewer => reviewer.AppUser)
            .SingleOrDefaultAsync(
                educationalEvent => educationalEvent.Id == eventId,
                cancellationToken);
    }

    public Task<EducationalEvent?> GetTrackedByIdWithParticipantsAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return Context.EducationalEvents
            .Include(educationalEvent =>
                educationalEvent.EventParticipants)
            .Include(educationalEvent =>
                educationalEvent.Reviews)
            .SingleOrDefaultAsync(
                educationalEvent => educationalEvent.Id == eventId,
                cancellationToken);
    }


    public Task<EducationalEvent?> GetTrackedForReviewAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return Context.EducationalEvents
            .Include(educationalEvent => educationalEvent.EventParticipants)
            .Include(educationalEvent => educationalEvent.Reviews)
            .SingleOrDefaultAsync(
                educationalEvent => educationalEvent.Id == eventId,
                cancellationToken);
    }
}
