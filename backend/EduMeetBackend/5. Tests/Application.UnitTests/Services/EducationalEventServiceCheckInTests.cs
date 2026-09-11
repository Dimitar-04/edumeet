using _1._Domain.Models;
using _2._Application.Exceptions;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Requests;
using _2._Application.Services.Implementations;
using NSubstitute;
using Xunit;

namespace Application.UnitTests.Services;

/// <summary>
/// Functionality-based ISP using Base Choice Coverage.
/// Base case: existing organizer; existing owned event; open check-in window;
/// matching token; participant not checked in.
/// Characteristics and blocks (base first):
/// Organizer: exists / missing.
/// Event: exists / missing.
/// Ownership: owns event / does not own event.
/// Time: window open / before opening / after closing.
/// Token: matches / does not match.
/// Check-in state: not checked in / already checked in.
/// Each variation changes one block; other applicable blocks remain at base.
/// </summary>
public sealed class EducationalEventServiceCheckInTests
{
    [Fact(DisplayName = "BCC base: valid first check-in succeeds")]
    public async Task CheckInParticipantAsync_WhenAllBaseChoicesAreValid_ChecksInParticipant()
    {
        // Arrange 
        var nowUtc = new DateTimeOffset(
            2026,
            6,
            15,
            12,
            0,
            0,
            TimeSpan.Zero);

        var organizerId = Guid.NewGuid();
        var eventId = Guid.NewGuid();
        var participantProfileId = Guid.NewGuid();
        var participantUserId = Guid.NewGuid();
        const string organizerUsername = "organizer";
        const string attendanceToken = "ABCD-EFGH-JKLM";
        const string attendanceTokenHash = "stored-token-hash";

        var organizer = new AppUser
        {
            Id = organizerId,
            UserName = organizerUsername
        };

        var participant = new EventParticipant
        {
            ParticipantId = participantProfileId,
            AttendanceTokenHash = attendanceTokenHash,
            Participant = new IndividualProfile
            {
                Id = participantProfileId,
                AppUserId = participantUserId,
                FirstName = "John",
                LastName = "Doe"
            }
        };

        var educationalEvent = new EducationalEvent
        {
            Id = eventId,
            OrganizerId = organizerId,
            Date = nowUtc.UtcDateTime.AddHours(-2),
            EventParticipants = [participant]
        };

        var appUserRepository = Substitute.For<IAppUserRepository>();
        var fileUploadService = Substitute.For<IFileUploadService>();
        var attendanceTokenService = Substitute.For<IAttendanceTokenService>();
        var eventRepository = Substitute.For<IEducationalEventRepository>();
        var emailOutboxRepository = Substitute.For<IEmailOutboxRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        appUserRepository
            .FindByUsernameAsync(
                organizerUsername,
                Arg.Any<CancellationToken>())
            .Returns(organizer);

        eventRepository
            .GetTrackedForAttendanceAsync(
                eventId,
                Arg.Any<CancellationToken>())
            .Returns(educationalEvent);

        attendanceTokenService
            .HashToken(attendanceToken)
            .Returns(attendanceTokenHash);

        unitOfWork
            .SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(1);

        var service = new EducationalEventService(
            appUserRepository,
            fileUploadService,
            attendanceTokenService,
            eventRepository,
            emailOutboxRepository,
            unitOfWork,
            new FixedTimeProvider(nowUtc));

        var request = new AttendanceCheckInRequest
        {
            AttendanceToken = $"  {attendanceToken}  "
        };

        // Act
        var result = await service.CheckInParticipantAsync(
            eventId,
            organizerUsername,
            request);

        // Assert
        Assert.Equal(eventId, result.EventId);
        Assert.Equal(participantUserId, result.ParticipantUserId);
        Assert.Equal("John Doe", result.ParticipantName);
        Assert.Equal(nowUtc.UtcDateTime, result.CheckedInAtUtc);
        Assert.False(result.AlreadyCheckedIn);
        Assert.Equal(1, result.RegisteredPeopleCount);
        Assert.Equal(1, result.AttendedPeopleCount);
        Assert.Equal(100.0, result.AttendanceRate);
        
        Assert.Equal(nowUtc.UtcDateTime, participant.CheckedInAtUtc);
        Assert.Equal(organizerId, participant.CheckedInByUserId);
        attendanceTokenService.Received(1).HashToken(attendanceToken);
        await unitOfWork.Received(1)
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "BCC variation: missing organizer is rejected")]
    public async Task CheckInParticipantAsync_WhenOrganizerDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange: only the organizer characteristic differs from the base case.
        var eventId = Guid.NewGuid();
        const string organizerUsername = "missing-organizer";

        var appUserRepository = Substitute.For<IAppUserRepository>();
        var fileUploadService = Substitute.For<IFileUploadService>();
        var attendanceTokenService = Substitute.For<IAttendanceTokenService>();
        var eventRepository = Substitute.For<IEducationalEventRepository>();
        var emailOutboxRepository = Substitute.For<IEmailOutboxRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        appUserRepository
            .FindByUsernameAsync(
                organizerUsername,
                Arg.Any<CancellationToken>())
            .Returns((AppUser?)null);

        var service = new EducationalEventService(
            appUserRepository,
            fileUploadService,
            attendanceTokenService,
            eventRepository,
            emailOutboxRepository,
            unitOfWork,
            new FixedTimeProvider(DateTimeOffset.UtcNow));

        var request = new AttendanceCheckInRequest
        {
            AttendanceToken = "ABCD-EFGH-JKLM"
        };

        // Act
        var exception = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.CheckInParticipantAsync(
                eventId,
                organizerUsername,
                request));

        // Assert
        Assert.Equal(
            "The event organizer no longer exists.",
            exception.Message);

        await eventRepository.DidNotReceive()
            .GetTrackedForAttendanceAsync(
                Arg.Any<Guid>(),
                Arg.Any<CancellationToken>());

        attendanceTokenService.DidNotReceive()
            .HashToken(Arg.Any<string>());

        await unitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "BCC variation: missing event is rejected")]
    public async Task CheckInParticipantAsync_WhenEventDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange: only the event-existence characteristic differs from the base case.
        var scenario = new ValidCheckInScenario();
        scenario.EventRepository
            .GetTrackedForAttendanceAsync(
                scenario.EventId,
                Arg.Any<CancellationToken>())
            .Returns((EducationalEvent?)null);

        // Act
        var exception = await Assert.ThrowsAsync<NotFoundException>(() =>
            scenario.Service.CheckInParticipantAsync(
                scenario.EventId,
                ValidCheckInScenario.OrganizerUsername,
                scenario.Request));

        // Assert
        Assert.Equal("The requested event does not exist.", exception.Message);
        scenario.AttendanceTokenService.DidNotReceive()
            .HashToken(Arg.Any<string>());
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "BCC variation: wrong event organizer is rejected")]
    public async Task CheckInParticipantAsync_WhenOrganizerDoesNotOwnEvent_ThrowsForbiddenException()
    {
        // Arrange: only the ownership characteristic differs from the base case.
        var scenario = new ValidCheckInScenario();
        scenario.Event.OrganizerId = Guid.NewGuid();

        // Act
        var exception = await Assert.ThrowsAsync<ForbiddenException>(() =>
            scenario.Service.CheckInParticipantAsync(
                scenario.EventId,
                ValidCheckInScenario.OrganizerUsername,
                scenario.Request));

        // Assert
        Assert.Equal(
            "Only the event organizer can check in participants.",
            exception.Message);
        scenario.AttendanceTokenService.DidNotReceive()
            .HashToken(Arg.Any<string>());
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "BCC variation: check-in before the opening time is rejected")]
    public async Task CheckInParticipantAsync_WhenCheckInHasNotOpened_ThrowsConflictException()
    {
        // Arrange: only the time characteristic differs from the base case.
        var scenario = new ValidCheckInScenario();
        scenario.Event.Date = scenario.NowUtc.UtcDateTime.AddHours(2);

        // Act
        var exception = await Assert.ThrowsAsync<ConflictException>(() =>
            scenario.Service.CheckInParticipantAsync(
                scenario.EventId,
                ValidCheckInScenario.OrganizerUsername,
                scenario.Request));

        // Assert
        Assert.Equal("Attendance check-in has not opened yet.", exception.Message);
        scenario.AttendanceTokenService.DidNotReceive()
            .HashToken(Arg.Any<string>());
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "BCC variation: check-in after the closing time is rejected")]
    public async Task CheckInParticipantAsync_WhenCheckInHasClosed_ThrowsConflictException()
    {
        // Arrange: only the time characteristic differs from the base case.
        var scenario = new ValidCheckInScenario();
        scenario.Event.Date = scenario.NowUtc.UtcDateTime.AddHours(-13);

        // Act
        var exception = await Assert.ThrowsAsync<ConflictException>(() =>
            scenario.Service.CheckInParticipantAsync(
                scenario.EventId,
                ValidCheckInScenario.OrganizerUsername,
                scenario.Request));

        // Assert
        Assert.Equal("Attendance check-in has closed.", exception.Message);
        scenario.AttendanceTokenService.DidNotReceive()
            .HashToken(Arg.Any<string>());
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "BCC variation: invalid attendance token is rejected")]
    public async Task CheckInParticipantAsync_WhenAttendanceTokenIsInvalid_ThrowsNotFoundException()
    {
        // Arrange: only the token-validity characteristic differs from the base case.
        var scenario = new ValidCheckInScenario();
        const string invalidToken = "ZZZZ-ZZZZ-ZZZZ";
        scenario.AttendanceTokenService
            .HashToken(invalidToken)
            .Returns("a-hash-that-is-not-stored-on-the-event");
        var request = new AttendanceCheckInRequest
        {
            AttendanceToken = invalidToken
        };

        // Act
        var exception = await Assert.ThrowsAsync<NotFoundException>(() =>
            scenario.Service.CheckInParticipantAsync(
                scenario.EventId,
                ValidCheckInScenario.OrganizerUsername,
                request));

        // Assert
        Assert.Equal(
            "The attendance code is invalid for this event.",
            exception.Message);
        scenario.AttendanceTokenService.Received(1).HashToken(invalidToken);
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "BCC variation: repeated check-in is idempotent")]
    public async Task CheckInParticipantAsync_WhenParticipantIsAlreadyCheckedIn_DoesNotSaveAgain()
    {
        // Arrange: only the previous-check-in-state characteristic differs from the base case.
        var scenario = new ValidCheckInScenario();
        var originalCheckInTime = scenario.NowUtc.UtcDateTime.AddMinutes(-10);
        var originalCheckerId = Guid.NewGuid();
        scenario.Participant.CheckedInAtUtc = originalCheckInTime;
        scenario.Participant.CheckedInByUserId = originalCheckerId;

        // Act
        var result = await scenario.Service.CheckInParticipantAsync(
            scenario.EventId,
            ValidCheckInScenario.OrganizerUsername,
            scenario.Request);

        // Assert: the existing check-in is returned and not overwritten.
        Assert.True(result.AlreadyCheckedIn);
        Assert.Equal(originalCheckInTime, result.CheckedInAtUtc);
        Assert.Equal(1, result.RegisteredPeopleCount);
        Assert.Equal(1, result.AttendedPeopleCount);
        Assert.Equal(100.0, result.AttendanceRate);
        Assert.Equal(originalCheckInTime, scenario.Participant.CheckedInAtUtc);
        Assert.Equal(originalCheckerId, scenario.Participant.CheckedInByUserId);
        scenario.AttendanceTokenService.Received(1)
            .HashToken(ValidCheckInScenario.AttendanceToken);
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    private sealed class ValidCheckInScenario
    {
        public const string OrganizerUsername = "organizer";
        public const string AttendanceToken = "ABCD-EFGH-JKLM";
        private const string AttendanceTokenHash = "stored-token-hash";

        public ValidCheckInScenario()
        {
            Organizer = new AppUser
            {
                Id = OrganizerId,
                UserName = OrganizerUsername
            };

            Participant = new EventParticipant
            {
                ParticipantId = Guid.NewGuid(),
                AttendanceTokenHash = AttendanceTokenHash,
                Participant = new IndividualProfile
                {
                    Id = Guid.NewGuid(),
                    AppUserId = Guid.NewGuid(),
                    FirstName = "John",
                    LastName = "Doe"
                }
            };

            Event = new EducationalEvent
            {
                Id = EventId,
                OrganizerId = OrganizerId,
                Date = NowUtc.UtcDateTime,
                EventParticipants = [Participant]
            };

            AppUserRepository
                .FindByUsernameAsync(
                    OrganizerUsername,
                    Arg.Any<CancellationToken>())
                .Returns(Organizer);

            EventRepository
                .GetTrackedForAttendanceAsync(
                    EventId,
                    Arg.Any<CancellationToken>())
                .Returns(Event);

            AttendanceTokenService
                .HashToken(AttendanceToken)
                .Returns(AttendanceTokenHash);

            UnitOfWork
                .SaveChangesAsync(Arg.Any<CancellationToken>())
                .Returns(1);

            Service = new EducationalEventService(
                AppUserRepository,
                FileUploadService,
                AttendanceTokenService,
                EventRepository,
                EmailOutboxRepository,
                UnitOfWork,
                new FixedTimeProvider(NowUtc));
        }

        public DateTimeOffset NowUtc { get; } = new(
            2026,
            6,
            15,
            12,
            0,
            0,
            TimeSpan.Zero);

        public Guid OrganizerId { get; } = Guid.NewGuid();
        public Guid EventId { get; } = Guid.NewGuid();
        public AppUser Organizer { get; }
        public EducationalEvent Event { get; }
        public EventParticipant Participant { get; }
        public IAppUserRepository AppUserRepository { get; } =
            Substitute.For<IAppUserRepository>();
        public IFileUploadService FileUploadService { get; } =
            Substitute.For<IFileUploadService>();
        public IAttendanceTokenService AttendanceTokenService { get; } =
            Substitute.For<IAttendanceTokenService>();
        public IEducationalEventRepository EventRepository { get; } =
            Substitute.For<IEducationalEventRepository>();
        public IEmailOutboxRepository EmailOutboxRepository { get; } =
            Substitute.For<IEmailOutboxRepository>();
        public IUnitOfWork UnitOfWork { get; } =
            Substitute.For<IUnitOfWork>();
        public AttendanceCheckInRequest Request { get; } = new()
        {
            AttendanceToken = AttendanceToken
        };
        public EducationalEventService Service { get; }
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow)
        : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
