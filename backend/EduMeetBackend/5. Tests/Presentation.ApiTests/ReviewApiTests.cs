using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using _2._Application.Notifications;
using _2._Application.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Presentation.ApiTests.Support;
using Xunit;

namespace Presentation.ApiTests;

public sealed class ReviewApiTests(ApiTestFixture fixture)
    : ApiTestBase(fixture)
{
    [Fact(DisplayName = "API reviews: an attendee creates and deletes an owned review")]
    public async Task Review_CheckedInParticipant_CreatesAndDeletesReview()
    {
        using var organizerClient = Fixture.CreateClient();
        await ApiScenario.RegisterOrganizationAsync(
            organizerClient,
            "review-organizer");
        var educationalEvent = await ApiScenario.CreateEventAsync(
            organizerClient,
            Fixture.NowUtc.AddMinutes(30),
            "Reviewable Event");
        using var participantClient = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(
            participantClient,
            "reviewer");
        var registrationResponse = await participantClient.PostAsync(
            $"/api/events/{educationalEvent.Id}/registrations",
            content: null);
        registrationResponse.EnsureSuccessStatusCode();

        string attendanceToken;
        await using (var context = Fixture.CreateDbContext())
        {
            var payload = await context.OutboxMessages
                .Select(message => message.Payload)
                .SingleAsync();
            attendanceToken = JsonSerializer
                .Deserialize<EventRegistrationEmailMessage>(payload)!
                .AttendanceToken;
        }

        var checkInResponse = await organizerClient.PostAsJsonAsync(
            $"/api/events/{educationalEvent.Id}/attendance/check-in",
            new { AttendanceToken = attendanceToken });
        checkInResponse.EnsureSuccessStatusCode();

        await using (var context = Fixture.CreateDbContext())
        {
            var storedEvent = await context.EducationalEvents.SingleAsync();
            storedEvent.Date = Fixture.NowUtc.UtcDateTime.AddHours(-1);
            await context.SaveChangesAsync();
        }

        var createResponse = await participantClient.PostAsJsonAsync(
            $"/api/events/{educationalEvent.Id}/reviews",
            new { Grade = 5, Description = "Excellent practical event." });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created =
            await createResponse.Content.ReadFromJsonAsync<ReviewCreatedResponse>();
        Assert.Equal(5, created!.AverageRating);
        Assert.Equal(1, created.RatingCount);

        var details = await participantClient.GetFromJsonAsync<EducationalEventResponse>(
            $"/api/events/{educationalEvent.Id}");
        Assert.True(details!.HasCurrentUserReviewed);
        Assert.Equal(
            "Excellent practical event.",
            Assert.Single(details.Reviews).Description);

        var deleteResponse = await participantClient.DeleteAsync(
            $"/api/events/{educationalEvent.Id}/reviews/me");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);
        var deleted =
            await deleteResponse.Content.ReadFromJsonAsync<ReviewDeletedResponse>();
        Assert.Equal(0, deleted!.RatingCount);
        Assert.Null(deleted.AverageRating);

        await using var verificationContext = Fixture.CreateDbContext();
        Assert.Empty(await verificationContext.Reviews.ToListAsync());
    }

    [Fact(DisplayName = "API reviews: a participant who did not attend is forbidden")]
    public async Task Review_NonAttendee_ReturnsForbidden()
    {
        using var organizerClient = Fixture.CreateClient();
        await ApiScenario.RegisterOrganizationAsync(
            organizerClient,
            "past-event-organizer");
        var educationalEvent = await ApiScenario.CreateEventAsync(
            organizerClient,
            Fixture.NowUtc.AddDays(-1),
            "Past Event");
        using var participantClient = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(
            participantClient,
            "non-attendee");

        var response = await participantClient.PostAsJsonAsync(
            $"/api/events/{educationalEvent.Id}/reviews",
            new { Grade = 4, Description = "I was not checked in." });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal(
            "Only participants who checked in at the event can review it.",
            problem!.Detail);
        await using var context = Fixture.CreateDbContext();
        Assert.Empty(await context.Reviews.ToListAsync());
    }

    [Fact(DisplayName = "API reviews: an out-of-range grade fails model validation")]
    public async Task Review_InvalidGrade_ReturnsBadRequest()
    {
        using var client = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(client, "invalid-reviewer");

        var response = await client.PostAsJsonAsync(
            $"/api/events/{Guid.NewGuid()}/reviews",
            new { Grade = 6, Description = "Invalid grade." });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
