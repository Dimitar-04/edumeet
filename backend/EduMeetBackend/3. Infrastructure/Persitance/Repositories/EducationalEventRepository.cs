using _1._Domain.Models;
using _2._Application.Interfaces.Repositories;
using _2._Application.Requests;
using _2._Application.Results.Common;
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

    public async Task<PagedResult<EducationalEvent>> SearchPagedWithDetailsAsync(
        string? search,
        string? category,
        EventTimeScope scope,
        DateTime nowUtc,
        int pageNumber,
        int pageSize,
        Guid? organizerId = null,
        CancellationToken cancellationToken = default)
{
    IQueryable<EducationalEvent> query =
        Context.EducationalEvents
            .AsNoTracking();

    if (scope == EventTimeScope.Upcoming)
    {
        query = query.Where(educationalEvent =>
            educationalEvent.Date > nowUtc);
    }
    else if (scope == EventTimeScope.Past)
    {
        query = query.Where(educationalEvent =>
            educationalEvent.Date <= nowUtc);
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
            EF.Functions.ILike(
                educationalEvent.Title,
                pattern) ||
            EF.Functions.ILike(
                educationalEvent.Description,
                pattern) ||
            EF.Functions.ILike(
                educationalEvent.LocationName,
                pattern) ||
            EF.Functions.ILike(
                educationalEvent.Address,
                pattern) ||
            EF.Functions.ILike(
                educationalEvent.Category,
                pattern));
    }

    var totalCount =
        await query.CountAsync(cancellationToken);

    IOrderedQueryable<EducationalEvent> orderedQuery = scope switch
    {
        EventTimeScope.Past => query
            .OrderByDescending(educationalEvent => educationalEvent.Date)
            .ThenBy(educationalEvent => educationalEvent.Id),

        EventTimeScope.All => query
            .OrderBy(educationalEvent => educationalEvent.Date <= nowUtc)
            .ThenBy(educationalEvent =>
                educationalEvent.Date > nowUtc
                    ? educationalEvent.Date
                    : DateTime.MaxValue)
            .ThenByDescending(educationalEvent =>
                educationalEvent.Date <= nowUtc
                    ? educationalEvent.Date
                    : DateTime.MinValue)
            .ThenBy(educationalEvent => educationalEvent.Id),

        _ => query
            .OrderBy(educationalEvent => educationalEvent.Date)
            .ThenBy(educationalEvent => educationalEvent.Id)
    };

    var events = await orderedQuery
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .Include(educationalEvent =>
            educationalEvent.Organizer)
            .ThenInclude(organizer =>
                organizer.IndividualProfile)
        .Include(educationalEvent =>
            educationalEvent.Organizer)
            .ThenInclude(organizer =>
                organizer.OrganizationProfile)
        .Include(educationalEvent =>
            educationalEvent.EventParticipants)
        .Include(educationalEvent =>
            educationalEvent.Reviews)
        .AsSplitQuery()
        .ToListAsync(cancellationToken);

    return new PagedResult<EducationalEvent>(
        events,
        pageNumber,
        pageSize,
        totalCount);
}

    public async Task<PagedResult<EducationalEvent>>
        GetUpcomingRegisteredWithDetailsAsync(
            Guid individualProfileId,
            DateTime nowUtc,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
    {
        var query = Context.EducationalEvents
            .AsNoTracking()
            .Where(educationalEvent =>
                educationalEvent.Date > nowUtc &&
                educationalEvent.EventParticipants.Any(participant =>
                    participant.ParticipantId == individualProfileId));

        var totalCount = await query.CountAsync(cancellationToken);

        var events = await query
            .OrderBy(educationalEvent => educationalEvent.Date)
            .ThenBy(educationalEvent => educationalEvent.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(organizer => organizer.IndividualProfile)
            .Include(educationalEvent => educationalEvent.Organizer)
                .ThenInclude(organizer => organizer.OrganizationProfile)
            .Include(educationalEvent =>
                educationalEvent.EventParticipants)
            .Include(educationalEvent => educationalEvent.Reviews)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new PagedResult<EducationalEvent>(
            events,
            pageNumber,
            pageSize,
            totalCount);
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
