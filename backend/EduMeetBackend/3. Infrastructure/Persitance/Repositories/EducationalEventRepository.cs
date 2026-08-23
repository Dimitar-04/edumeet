using _1._Domain.Models;
using _2._Application.Interfaces.Repositories;
using _3._Infrastracture.Persitance.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Repositories;

public class EducationalEventRepository(ApplicationDbContext context) :BaseRepository<EducationalEvent>(context), IEducationalEventRepository
{
    public async Task<IReadOnlyList<EducationalEvent>> SearchWithDetailsAsync(
        string? search,
        string? category,
        bool includePast,
        DateTime nowUtc,
        Guid? organizerId = null,
        CancellationToken cancellationToken = default)
    {
        var query = Context.EducationalEvents
            .AsNoTracking()
            .AsSplitQuery()
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(org=>org.IndividualProfile)
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(org => org.OrganizationProfile)
            .Include(educationalEvent =>
                educationalEvent.EventParticipants)
            .Include(educationalEvent =>
                educationalEvent.Reviews)
            .AsQueryable();

        if (!includePast)
        {
            query = query.Where(educationalEvent =>
                educationalEvent.Date > nowUtc);
        }

        if (organizerId.HasValue)
        {
            query = query.Where(educationalEvent =>
                educationalEvent.OrganizerId == organizerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var normalizedCategory = category.Trim();

            query = query.Where(educationalEvent =>
                educationalEvent.Category == normalizedCategory);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";

            query = query.Where(educationalEvent =>
                EF.Functions.ILike(educationalEvent.Title, pattern) ||
                EF.Functions.ILike(educationalEvent.Description, pattern) ||
                EF.Functions.ILike(educationalEvent.LocationName, pattern) ||
                EF.Functions.ILike(educationalEvent.Address, pattern) ||
                EF.Functions.ILike(educationalEvent.Category, pattern));
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<EducationalEvent>>
        GetUpcomingRegisteredWithDetailsAsync(
            Guid individualProfileId,
            DateTime nowUtc,
            CancellationToken cancellationToken = default)
    {
        return await Context.EducationalEvents
            .AsNoTracking()
            .AsSplitQuery()
            .Where(educationalEvent =>
                educationalEvent.Date > nowUtc &&
                educationalEvent.EventParticipants.Any(participant =>
                    participant.ParticipantId == individualProfileId))
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(organizer => organizer.IndividualProfile)
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(organizer => organizer.OrganizationProfile)
            .Include(educationalEvent =>
                educationalEvent.EventParticipants)
            .Include(educationalEvent => educationalEvent.Reviews)
            .OrderBy(educationalEvent => educationalEvent.Date)
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

    public Task<EducationalEvent?> GetTrackedForAttendanceAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return Context.EducationalEvents
            .AsSplitQuery()
            .Include(educationalEvent =>
                educationalEvent.EventParticipants)
            .ThenInclude(participant =>
                participant.Participant)
            .ThenInclude(profile =>
                profile.AppUser)
            .SingleOrDefaultAsync(
                educationalEvent =>
                    educationalEvent.Id == eventId,
                cancellationToken);
    }
}
