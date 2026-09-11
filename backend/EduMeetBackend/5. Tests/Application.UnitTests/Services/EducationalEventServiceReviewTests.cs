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

public sealed class EducationalEventServiceReviewTests
{
    [Fact]
    public async Task CreateReviewAsync_WhenParticipantAttended_CreatesReview()
    {
        var scenario = new ReviewScenario();
        scenario.Event.Reviews.Add(new Review
        {
            Grade = 2,
            ReviewerId = Guid.NewGuid(),
            EducationalEventId = scenario.EventId
        });

        var result = await scenario.Service.CreateReviewAsync(
            scenario.EventId,
            ReviewScenario.Username,
            new ReviewRequest(4, "  Very useful workshop  "));

        Assert.Equal(scenario.EventId, result.EventId);
        Assert.Equal(2, result.RatingCount);
        Assert.Equal(3.0, result.AverageRating);
        Assert.Equal("John Doe", result.Review.ReviewerName);
        Assert.Equal(4, result.Review.Grade);
        Assert.Equal("Very useful workshop", result.Review.Description);
        Assert.Contains(scenario.Event.Reviews, review =>
            review.ReviewerId == scenario.ProfileId &&
            review.Grade == 4 &&
            review.Description == "Very useful workshop");
        await scenario.UnitOfWork.Received(1)
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateReviewAsync_WhenParticipantDidNotAttend_ThrowsForbiddenException()
    {
        var scenario = new ReviewScenario();
        scenario.Participation.CheckedInAtUtc = null;

        var exception = await Assert.ThrowsAsync<ForbiddenException>(() =>
            scenario.Service.CreateReviewAsync(
                scenario.EventId,
                ReviewScenario.Username,
                new ReviewRequest(4, "Useful workshop")));

        Assert.Equal(
            "Only participants who checked in at the event can review it.",
            exception.Message);
        Assert.Empty(scenario.Event.Reviews);
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(ReviewRejection.Organizer, typeof(ForbiddenException))]
    [InlineData(ReviewRejection.Duplicate, typeof(ConflictException))]
    public async Task CreateReviewAsync_WhenReviewIsNotAllowed_RejectsReview(
        ReviewRejection rejection,
        Type expectedExceptionType)
    {
        var scenario = new ReviewScenario();

        if (rejection == ReviewRejection.Organizer)
        {
            scenario.Event.OrganizerId = scenario.User.Id;
        }
        else
        {
            scenario.Event.Reviews.Add(new Review
            {
                Grade = 3,
                ReviewerId = scenario.ProfileId,
                EducationalEventId = scenario.EventId
            });
        }

        var initialReviewCount = scenario.Event.Reviews.Count;
        var exception = await Record.ExceptionAsync(() =>
            scenario.Service.CreateReviewAsync(
                scenario.EventId,
                ReviewScenario.Username,
                new ReviewRequest(4, "Useful workshop")));

        Assert.NotNull(exception);
        Assert.Equal(expectedExceptionType, exception.GetType());
        Assert.Equal(initialReviewCount, scenario.Event.Reviews.Count);
        await scenario.UnitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    public enum ReviewRejection
    {
        Organizer,
        Duplicate
    }

    private sealed class ReviewScenario
    {
        public const string Username = "john";

        public ReviewScenario()
        {
            User = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = Username,
                IndividualProfile = new IndividualProfile
                {
                    Id = ProfileId,
                    AppUserId = Guid.NewGuid(),
                    FirstName = "John",
                    LastName = "Doe"
                }
            };
            User.IndividualProfile.AppUserId = User.Id;

            Participation = new EventParticipant
            {
                ParticipantId = ProfileId,
                CheckedInAtUtc = NowUtc.UtcDateTime.AddHours(-1)
            };

            Event = new EducationalEvent
            {
                Id = EventId,
                OrganizerId = Guid.NewGuid(),
                Date = NowUtc.UtcDateTime.AddHours(-2),
                EventParticipants = [Participation]
            };

            EventRepository
                .GetTrackedForReviewAsync(
                    EventId,
                    Arg.Any<CancellationToken>())
                .Returns(Event);
            AppUserRepository
                .FindByUsernameAsync(Username, Arg.Any<CancellationToken>())
                .Returns(User);
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
        public EventParticipant Participation { get; }
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
