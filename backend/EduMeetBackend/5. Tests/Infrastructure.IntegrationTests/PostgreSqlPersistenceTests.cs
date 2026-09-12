using System.Text.Json;
using _1._Domain.Enums;
using _1._Domain.Models;
using _2._Application.Notifications;
using _2._Application.Requests;
using _3._Infrastracture.Persitance;
using _3._Infrastracture.Persitance.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Infrastructure.IntegrationTests;

[Collection(PostgreSqlIntegrationCollection.Name)]
public sealed class PostgreSqlPersistenceTests(
    PostgreSqlFixture fixture) : IAsyncLifetime
{
    private static readonly DateTime NowUtc =
        new(2026, 9, 12, 12, 0, 0, DateTimeKind.Utc);

    public Task InitializeAsync() => fixture.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact(DisplayName = "PostgreSQL: every EF Core migration applies")]
    public async Task Migrations_AllApplySuccessfully()
    {
        await using var context = fixture.CreateDbContext();

        var knownMigrations = context.Database.GetMigrations().ToArray();
        var appliedMigrations =
            (await context.Database.GetAppliedMigrationsAsync()).ToArray();
        var pendingMigrations =
            (await context.Database.GetPendingMigrationsAsync()).ToArray();

        Assert.NotEmpty(knownMigrations);
        Assert.Equal(knownMigrations, appliedMigrations);
        Assert.Empty(pendingMigrations);
        Assert.Equal(
            "Npgsql.EntityFrameworkCore.PostgreSQL",
            context.Database.ProviderName);
    }

    [Fact(DisplayName = "PostgreSQL constraint: duplicate event registration is rejected")]
    public async Task EventParticipant_DuplicateCompositeKey_IsRejected()
    {
        await using var context = fixture.CreateDbContext();
        var organizer = CreateOrganization("organizer");
        var participant = CreateIndividual("participant");
        var educationalEvent = CreateEvent(
            organizer,
            NowUtc.AddDays(1),
            "Database Testing");

        context.AddRange(organizer, participant, educationalEvent);
        context.EventParticipants.Add(new EventParticipant
        {
            Participant = participant.IndividualProfile!,
            EducationalEvent = educationalEvent,
            AttendanceTokenHash = TokenHash('A')
        });
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        context.EventParticipants.Add(new EventParticipant
        {
            ParticipantId = participant.IndividualProfile!.Id,
            EducationalEventId = educationalEvent.Id,
            AttendanceTokenHash = TokenHash('B')
        });

        await Assert.ThrowsAsync<DbUpdateException>(
            () => context.SaveChangesAsync());
    }

    [Fact(DisplayName = "PostgreSQL constraint: attendance tokens are unique when present")]
    public async Task EventParticipant_DuplicateAttendanceToken_IsRejected()
    {
        await using var context = fixture.CreateDbContext();
        var organizer = CreateOrganization("organizer");
        var firstParticipant = CreateIndividual("first-participant");
        var secondParticipant = CreateIndividual("second-participant");
        var educationalEvent = CreateEvent(
            organizer,
            NowUtc.AddDays(1),
            "Unique Attendance Tokens");
        var tokenHash = TokenHash('C');

        context.AddRange(
            organizer,
            firstParticipant,
            secondParticipant,
            educationalEvent);
        context.EventParticipants.AddRange(
            new EventParticipant
            {
                Participant = firstParticipant.IndividualProfile!,
                EducationalEvent = educationalEvent,
                AttendanceTokenHash = tokenHash
            },
            new EventParticipant
            {
                Participant = secondParticipant.IndividualProfile!,
                EducationalEvent = educationalEvent,
                AttendanceTokenHash = tokenHash
            });

        await Assert.ThrowsAsync<DbUpdateException>(
            () => context.SaveChangesAsync());
    }

    [Fact(DisplayName = "PostgreSQL constraint: an event requires a real organizer")]
    public async Task EducationalEvent_MissingOrganizer_IsRejected()
    {
        await using var context = fixture.CreateDbContext();
        context.EducationalEvents.Add(CreateEvent(
            Guid.NewGuid(),
            NowUtc.AddDays(1),
            "Orphan Event"));

        await Assert.ThrowsAsync<DbUpdateException>(
            () => context.SaveChangesAsync());
    }

    [Fact(DisplayName = "Repository: search is case-insensitive, filtered, ordered, and paged")]
    public async Task SearchPagedWithDetailsAsync_FiltersOrdersAndPagesResults()
    {
        await using var context = fixture.CreateDbContext();
        var organizer = CreateOrganization("robotics-club");
        var earlierMatch = CreateEvent(
            organizer,
            NowUtc.AddHours(10),
            "Introduction to Robotics",
            "Technology");
        var laterMatch = CreateEvent(
            organizer,
            NowUtc.AddHours(20),
            "Advanced ROBOTICS",
            "Technology");

        context.AddRange(
            organizer,
            earlierMatch,
            laterMatch,
            CreateEvent(organizer, NowUtc.AddHours(5), "Painting", "Art"),
            CreateEvent(organizer, NowUtc.AddHours(-2), "Past Robotics", "Technology"));
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var repository = new EducationalEventRepository(context);
        var firstPage = await repository.SearchPagedWithDetailsAsync(
            "robotics",
            " Technology ",
            EventTimeScope.Upcoming,
            NowUtc,
            pageNumber: 1,
            pageSize: 1);
        var secondPage = await repository.SearchPagedWithDetailsAsync(
            "robotics",
            "Technology",
            EventTimeScope.Upcoming,
            NowUtc,
            pageNumber: 2,
            pageSize: 1);

        Assert.Equal(2, firstPage.TotalCount);
        Assert.Equal(2, firstPage.TotalPages);
        Assert.True(firstPage.HasNextPage);
        Assert.Equal(earlierMatch.Id, Assert.Single(firstPage.Items).Id);
        Assert.NotNull(firstPage.Items[0].Organizer.OrganizationProfile);

        Assert.True(secondPage.HasPreviousPage);
        Assert.False(secondPage.HasNextPage);
        Assert.Equal(laterMatch.Id, Assert.Single(secondPage.Items).Id);
    }

    [Fact(DisplayName = "Repository: schedule contains only registered future events")]
    public async Task GetUpcomingRegisteredWithDetailsAsync_ReturnsScheduleInDateOrder()
    {
        await using var context = fixture.CreateDbContext();
        var organizer = CreateOrganization("schedule-organizer");
        var participant = CreateIndividual("schedule-participant");
        var nearestFuture = CreateEvent(
            organizer,
            NowUtc.AddHours(4),
            "Nearest Registered Event");
        var laterFuture = CreateEvent(
            organizer,
            NowUtc.AddHours(8),
            "Later Registered Event");
        var past = CreateEvent(
            organizer,
            NowUtc.AddHours(-1),
            "Past Registered Event");
        var unregistered = CreateEvent(
            organizer,
            NowUtc.AddHours(2),
            "Unregistered Event");

        context.AddRange(
            organizer,
            participant,
            nearestFuture,
            laterFuture,
            past,
            unregistered);
        context.EventParticipants.AddRange(
            Registration(participant, nearestFuture, 'D'),
            Registration(participant, laterFuture, 'E'),
            Registration(participant, past, 'F'));
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var repository = new EducationalEventRepository(context);
        var result = await repository.GetUpcomingRegisteredWithDetailsAsync(
            participant.IndividualProfile!.Id,
            NowUtc,
            pageNumber: 1,
            pageSize: 10);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(
            [nearestFuture.Id, laterFuture.Id],
            result.Items.Select(item => item.Id));
        Assert.All(result.Items, item =>
            Assert.Contains(item.EventParticipants, eventParticipant =>
                eventParticipant.ParticipantId == participant.IndividualProfile.Id));
    }

    [Fact(DisplayName = "Repository: attendance history requires check-in and respects category")]
    public async Task GetAttendedWithDetailsAsync_ReturnsCheckedInPastEventsOnly()
    {
        await using var context = fixture.CreateDbContext();
        var organizer = CreateOrganization("history-organizer");
        var participant = CreateIndividual("history-participant");
        var recentAttended = CreateEvent(
            organizer,
            NowUtc.AddDays(-2),
            "Recent Attended",
            "Technology");
        var olderAttended = CreateEvent(
            organizer,
            NowUtc.AddDays(-5),
            "Older Attended",
            "Technology");
        var notCheckedIn = CreateEvent(
            organizer,
            NowUtc.AddDays(-1),
            "Registered But Absent",
            "Technology");
        var futureCheckedIn = CreateEvent(
            organizer,
            NowUtc.AddDays(1),
            "Future Event",
            "Technology");
        var differentCategory = CreateEvent(
            organizer,
            NowUtc.AddDays(-3),
            "Attended Art Event",
            "Art");

        context.AddRange(
            organizer,
            participant,
            recentAttended,
            olderAttended,
            notCheckedIn,
            futureCheckedIn,
            differentCategory);
        context.EventParticipants.AddRange(
            CheckedInRegistration(participant, recentAttended, 'G'),
            CheckedInRegistration(participant, olderAttended, 'H'),
            Registration(participant, notCheckedIn, 'I'),
            CheckedInRegistration(participant, futureCheckedIn, 'J'),
            CheckedInRegistration(participant, differentCategory, 'K'));
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var repository = new EducationalEventRepository(context);
        var result = await repository.GetAttendedWithDetailsAsync(
            participant.IndividualProfile!.Id,
            NowUtc,
            " Technology ",
            pageNumber: 1,
            pageSize: 10);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(
            [recentAttended.Id, olderAttended.Id],
            result.Items.Select(item => item.Id));
    }

    [Fact(DisplayName = "Repository: outbox lifecycle is persisted")]
    public async Task EmailOutbox_EnqueueFailureRetryAndProcessing_ArePersisted()
    {
        await using var context = fixture.CreateDbContext();
        var repository = new EmailOutboxRepository(context);
        var email = new EventRegistrationEmailMessage(
            "student@example.com",
            "Student",
            Guid.NewGuid(),
            "Integration Testing",
            NowUtc.AddDays(1),
            "FINKI",
            "ABCD-EFGH-IJKL");

        repository.Enqueue(email, NowUtc);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var queued = Assert.Single(await repository.GetPendingAsync(
            NowUtc,
            maximumCount: 10,
            maximumAttempts: 3));
        var persistedEmail =
            JsonSerializer.Deserialize<EventRegistrationEmailMessage>(
                queued.Payload);
        Assert.Equal(email, persistedEmail);
        Assert.Equal(0, queued.AttemptCount);

        var retryAtUtc = NowUtc.AddMinutes(5);
        await repository.MarkFailedAsync(
            queued.Id,
            "SMTP unavailable",
            retryAtUtc);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        Assert.Empty(await repository.GetPendingAsync(
            retryAtUtc.AddTicks(-1),
            maximumCount: 10,
            maximumAttempts: 3));
        var retry = Assert.Single(await repository.GetPendingAsync(
            retryAtUtc,
            maximumCount: 10,
            maximumAttempts: 3));
        Assert.Equal(1, retry.AttemptCount);

        var processedAtUtc = retryAtUtc.AddMinutes(1);
        await repository.MarkProcessedAsync(retry.Id, processedAtUtc);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        Assert.Empty(await repository.GetPendingAsync(
            processedAtUtc,
            maximumCount: 10,
            maximumAttempts: 3));

        var stored = await context.OutboxMessages.SingleAsync();
        Assert.Equal(processedAtUtc, stored.ProcessedAtUtc);
        Assert.Equal("{}", stored.Payload);
        Assert.Null(stored.LastError);
        Assert.Null(stored.NextAttemptAtUtc);
    }

    private static AppUser CreateOrganization(string username)
    {
        var user = CreateUser(username, AccountType.Organization);
        user.OrganizationProfile = new OrganizationProfile
        {
            Id = Guid.NewGuid(),
            AppUser = user,
            Name = $"{username} organization"
        };
        return user;
    }

    private static AppUser CreateIndividual(string username)
    {
        var user = CreateUser(username, AccountType.Individual);
        user.IndividualProfile = new IndividualProfile
        {
            Id = Guid.NewGuid(),
            AppUser = user,
            FirstName = username,
            LastName = "Tester"
        };
        return user;
    }

    private static AppUser CreateUser(
        string username,
        AccountType accountType)
    {
        return new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = username,
            NormalizedUserName = username.ToUpperInvariant(),
            Email = $"{username}@example.com",
            NormalizedEmail = $"{username}@example.com".ToUpperInvariant(),
            EmailConfirmed = true,
            AccountType = accountType,
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString()
        };
    }

    private static EducationalEvent CreateEvent(
        AppUser organizer,
        DateTime dateUtc,
        string title,
        string category = "Technology")
    {
        return new EducationalEvent
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = $"Description for {title}",
            Category = category,
            Format = "In person",
            Date = dateUtc,
            LocationName = "FINKI",
            Address = "Rugjer Boshkovikj 16",
            Latitude = 42.004,
            Longitude = 21.409,
            Organizer = organizer
        };
    }

    private static EducationalEvent CreateEvent(
        Guid organizerId,
        DateTime dateUtc,
        string title)
    {
        return new EducationalEvent
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = $"Description for {title}",
            Category = "Technology",
            Format = "In person",
            Date = dateUtc,
            LocationName = "FINKI",
            Address = "Rugjer Boshkovikj 16",
            Latitude = 42.004,
            Longitude = 21.409,
            OrganizerId = organizerId
        };
    }

    private static EventParticipant Registration(
        AppUser participant,
        EducationalEvent educationalEvent,
        char tokenCharacter)
    {
        return new EventParticipant
        {
            Participant = participant.IndividualProfile!,
            EducationalEvent = educationalEvent,
            AttendanceTokenHash = TokenHash(tokenCharacter)
        };
    }

    private static EventParticipant CheckedInRegistration(
        AppUser participant,
        EducationalEvent educationalEvent,
        char tokenCharacter)
    {
        var registration = Registration(
            participant,
            educationalEvent,
            tokenCharacter);
        registration.CheckedInAtUtc = educationalEvent.Date.AddHours(1);
        registration.CheckedInByUser = educationalEvent.Organizer;
        return registration;
    }

    private static string TokenHash(char character) =>
        new(character, 64);
}
