using _1._Domain.Models;
using _2._Application.Exceptions;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Notifications;
using _2._Application.Results;
using _2._Application.Services.Implementations;
using NSubstitute;
using Xunit;

namespace Application.UnitTests.Services;

public sealed class EducationalEventServiceRegistrationTests
{
    [Fact]
    public async Task RegisterUserForEventAsync_WhenEligible_RegistersAndQueuesEmail()
    {
        var scenario = new RegistrationScenario();

        var result = await scenario.Service.RegisterUserForEventAsync(
            scenario.EventId,
            RegistrationScenario.Username);

        Assert.True(result.IsRegistered);
        Assert.Equal(1, result.RegisteredPeopleCount);

        var participant = Assert.Single(scenario.Event.EventParticipants);
        Assert.Equal(scenario.ProfileId, participant.ParticipantId);
        Assert.Equal(RegistrationScenario.TokenHash, participant.AttendanceTokenHash);

        scenario.AttendanceTokenService.Received(1).CreateToken();
        scenario.EmailOutboxRepository.Received(1).Enqueue(
            Arg.Is<EventRegistrationEmailMessage>(message =>
                message.RecipientEmail == scenario.User.Email &&
                message.RecipientName == "John Doe" &&
                message.EventId == scenario.EventId &&
                message.AttendanceToken == RegistrationScenario.Token),
            scenario.NowUtc.UtcDateTime);
        await scenario.UnitOfWork.Received(1)
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RegisterUserForEventAsync_WhenAlreadyRegistered_UnregistersUser()
    {
        var scenario = new RegistrationScenario();
        scenario.Event.EventParticipants.Add(new EventParticipant
        {
            ParticipantId = scenario.ProfileId,
            EducationalEventId = scenario.EventId,
            AttendanceTokenHash = RegistrationScenario.TokenHash
        });

        var result = await scenario.Service.RegisterUserForEventAsync(
            scenario.EventId,
            RegistrationScenario.Username);

        Assert.False(result.IsRegistered);
        Assert.Equal(0, result.RegisteredPeopleCount);
        Assert.Empty(scenario.Event.EventParticipants);
        scenario.AttendanceTokenService.DidNotReceive().CreateToken();
        scenario.EmailOutboxRepository.DidNotReceive().Enqueue(
            Arg.Any<EventRegistrationEmailMessage>(),
            Arg.Any<DateTime>());
        await scenario.UnitOfWork.Received(1)
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(RegistrationRejection.NonIndividual, typeof(ForbiddenException))]
    [InlineData(RegistrationRejection.OwnEvent, typeof(ForbiddenException))]
    [InlineData(RegistrationRejection.EventStarted, typeof(ConflictException))]
    public async Task RegisterUserForEventAsync_WhenIneligible_RejectsRegistration(
        RegistrationRejection rejection,
        Type expectedExceptionType)
    {
        var scenario = new RegistrationScenario();

        switch (rejection)
        {
            case RegistrationRejection.NonIndividual:
                scenario.User.IndividualProfile = null;
                scenario.User.OrganizationProfile = new OrganizationProfile
                {
                    AppUserId = scenario.User.Id,
                    Name = "EduMeet Organization"
                };
                break;

            case RegistrationRejection.OwnEvent:
                scenario.Event.OrganizerId = scenario.User.Id;
                break;

            case RegistrationRejection.EventStarted:
                scenario.Event.Date = scenario.NowUtc.UtcDateTime;
                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(rejection));
        }

        var exception = await Record.ExceptionAsync(() =>
            scenario.Service.RegisterUserForEventAsync(
                scenario.EventId,
                RegistrationScenario.Username));

        Assert.NotNull(exception);
        Assert.Equal(expectedExceptionType, exception.GetType());
        Assert.Empty(scenario.Event.EventParticipants);
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    public enum RegistrationRejection
    {
        NonIndividual,
        OwnEvent,
        EventStarted
    }

    private sealed class RegistrationScenario
    {
        public const string Username = "john";
        public const string Token = "ABCD-EFGH-JKLM";
        public const string TokenHash = "stored-token-hash";

        public RegistrationScenario()
        {
            User = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = Username,
                Email = "john@example.com",
                IndividualProfile = new IndividualProfile
                {
                    Id = ProfileId,
                    AppUserId = Guid.NewGuid(),
                    FirstName = "John",
                    LastName = "Doe"
                }
            };
            User.IndividualProfile.AppUserId = User.Id;

            Event = new EducationalEvent
            {
                Id = EventId,
                OrganizerId = Guid.NewGuid(),
                Title = "Testing Workshop",
                Date = NowUtc.UtcDateTime.AddDays(1),
                LocationName = "FINKI"
            };

            AppUserRepository
                .FindByUsernameAsync(Username, Arg.Any<CancellationToken>())
                .Returns(User);
            EventRepository
                .GetTrackedByIdWithParticipantsAsync(
                    EventId,
                    Arg.Any<CancellationToken>())
                .Returns(Event);
            AttendanceTokenService.CreateToken().Returns(
                new GeneratedAttendanceToken(Token, TokenHash));
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
            2026, 6, 15, 12, 0, 0, TimeSpan.Zero);
        public Guid EventId { get; } = Guid.NewGuid();
        public Guid ProfileId { get; } = Guid.NewGuid();
        public AppUser User { get; }
        public EducationalEvent Event { get; }
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
        public EducationalEventService Service { get; }
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
