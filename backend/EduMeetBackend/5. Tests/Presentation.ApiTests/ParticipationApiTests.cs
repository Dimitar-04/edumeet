using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using _2._Application.Notifications;
using _2._Application.Responses;
using _2._Application.Results.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Presentation.ApiTests.Support;
using Xunit;

namespace Presentation.ApiTests;

public sealed class ParticipationApiTests(ApiTestFixture fixture)
    : ApiTestBase(fixture)
{
    [Fact(DisplayName = "API participation: registration toggles and updates the schedule")]
    public async Task Registration_Individual_TogglesPersistedState()
    {
        using var organizerClient = Fixture.CreateClient();
        await ApiScenario.RegisterOrganizationAsync(
            organizerClient,
            "registration-organizer");
        var educationalEvent = await ApiScenario.CreateEventAsync(
            organizerClient,
            Fixture.NowUtc.AddDays(1));
        using var participantClient = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(
            participantClient,
            "registration-participant");

        var registerResponse = await participantClient.PostAsync(
            $"/api/events/{educationalEvent.Id}/registrations",
            content: null);
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);
        var registered =
            await registerResponse.Content.ReadFromJsonAsync<EventRegistrationResponse>();
        Assert.True(registered!.IsRegistered);
        Assert.Equal(1, registered.RegisteredPeopleCount);

        var schedule = await participantClient.GetFromJsonAsync<
            PagedResult<EducationalEventResponse>>(
            "/api/events/my-schedule?pageNumber=1&pageSize=9");
        Assert.Equal(educationalEvent.Id, Assert.Single(schedule!.Items).Id);

        var unregisterResponse = await participantClient.PostAsync(
            $"/api/events/{educationalEvent.Id}/registrations",
            content: null);
        var unregistered =
            await unregisterResponse.Content.ReadFromJsonAsync<EventRegistrationResponse>();
        Assert.False(unregistered!.IsRegistered);
        Assert.Equal(0, unregistered.RegisteredPeopleCount);

        await using var context = Fixture.CreateDbContext();
        Assert.Empty(await context.EventParticipants.ToListAsync());
        Assert.Single(await context.OutboxMessages.ToListAsync());
    }

    [Fact(DisplayName = "API participation: organization accounts cannot register")]
    public async Task Registration_OrganizationAccount_ReturnsForbidden()
    {
        using var ownerClient = Fixture.CreateClient();
        await ApiScenario.RegisterOrganizationAsync(ownerClient, "event-owner");
        var educationalEvent = await ApiScenario.CreateEventAsync(
            ownerClient,
            Fixture.NowUtc.AddDays(1));
        using var otherOrganizationClient = Fixture.CreateClient();
        await ApiScenario.RegisterOrganizationAsync(
            otherOrganizationClient,
            "other-organization");

        var response = await otherOrganizationClient.PostAsync(
            $"/api/events/{educationalEvent.Id}/registrations",
            content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal(
            "Only individual accounts can register for events.",
            problem!.Detail);
    }

    [Fact(DisplayName = "API attendance: organizer checks in a registered participant")]
    public async Task CheckIn_ValidToken_UpdatesAttendanceAndHistory()
    {
        var scenario = await CreateRegisteredScenarioAsync(
            "checkin-organizer",
            "checkin-participant");
        using var organizerClient = scenario.OrganizerClient;
        using var participantClient = scenario.ParticipantClient;

        var response = await organizerClient.PostAsJsonAsync(
            $"/api/events/{scenario.Event.Id}/attendance/check-in",
            new { AttendanceToken = scenario.AttendanceToken });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var checkedIn =
            await response.Content.ReadFromJsonAsync<AttendanceCheckInResponse>();
        Assert.False(checkedIn!.AlreadyCheckedIn);
        Assert.Equal(1, checkedIn.AttendedPeopleCount);
        Assert.Equal(100, checkedIn.AttendanceRate);

        var repeatedResponse = await organizerClient.PostAsJsonAsync(
            $"/api/events/{scenario.Event.Id}/attendance/check-in",
            new { AttendanceToken = scenario.AttendanceToken });
        var repeated =
            await repeatedResponse.Content.ReadFromJsonAsync<AttendanceCheckInResponse>();
        Assert.True(repeated!.AlreadyCheckedIn);

        var summary = await organizerClient.GetFromJsonAsync<AttendanceSummaryResponse>(
            $"/api/events/{scenario.Event.Id}/attendance");
        Assert.Equal(1, summary!.RegisteredPeopleCount);
        Assert.Equal(1, summary.AttendedPeopleCount);

        await using (var context = Fixture.CreateDbContext())
        {
            var storedEvent = await context.EducationalEvents.SingleAsync();
            storedEvent.Date = Fixture.NowUtc.UtcDateTime.AddHours(-1);
            await context.SaveChangesAsync();
        }

        var history = await participantClient.GetFromJsonAsync<
            PagedResult<EducationalEventResponse>>(
            "/api/events/my-attended?pageNumber=1&pageSize=9");
        Assert.Equal(scenario.Event.Id, Assert.Single(history!.Items).Id);
    }

    [Fact(DisplayName = "API attendance: invalid token changes no attendance state")]
    public async Task CheckIn_InvalidToken_ReturnsNotFoundWithoutStateChange()
    {
        var scenario = await CreateRegisteredScenarioAsync(
            "invalid-token-organizer",
            "invalid-token-participant");
        using var organizerClient = scenario.OrganizerClient;
        using var participantClient = scenario.ParticipantClient;

        var response = await organizerClient.PostAsJsonAsync(
            $"/api/events/{scenario.Event.Id}/attendance/check-in",
            new { AttendanceToken = "WRONG-TOKEN" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        await using var context = Fixture.CreateDbContext();
        Assert.Null((await context.EventParticipants.SingleAsync()).CheckedInAtUtc);
    }

    [Fact(DisplayName = "API attendance: a different organizer is forbidden")]
    public async Task CheckIn_WrongOrganizer_ReturnsForbidden()
    {
        var scenario = await CreateRegisteredScenarioAsync(
            "actual-organizer",
            "wrong-owner-participant");
        using var organizerClient = scenario.OrganizerClient;
        using var participantClient = scenario.ParticipantClient;
        using var otherOrganizerClient = Fixture.CreateClient();
        await ApiScenario.RegisterOrganizationAsync(
            otherOrganizerClient,
            "different-organizer");

        var response = await otherOrganizerClient.PostAsJsonAsync(
            $"/api/events/{scenario.Event.Id}/attendance/check-in",
            new { AttendanceToken = scenario.AttendanceToken });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<RegisteredScenario> CreateRegisteredScenarioAsync(
        string organizerUsername,
        string participantUsername)
    {
        var organizerClient = Fixture.CreateClient();
        await ApiScenario.RegisterOrganizationAsync(
            organizerClient,
            organizerUsername);
        var educationalEvent = await ApiScenario.CreateEventAsync(
            organizerClient,
            Fixture.NowUtc.AddMinutes(30));
        var participantClient = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(
            participantClient,
            participantUsername);
        var registrationResponse = await participantClient.PostAsync(
            $"/api/events/{educationalEvent.Id}/registrations",
            content: null);
        registrationResponse.EnsureSuccessStatusCode();

        await using var context = Fixture.CreateDbContext();
        var payload = await context.OutboxMessages
            .Select(message => message.Payload)
            .SingleAsync();
        var notification =
            JsonSerializer.Deserialize<EventRegistrationEmailMessage>(payload)!;

        return new RegisteredScenario(
            organizerClient,
            participantClient,
            educationalEvent,
            notification.AttendanceToken);
    }

    private sealed record RegisteredScenario(
        HttpClient OrganizerClient,
        HttpClient ParticipantClient,
        EducationalEventResponse Event,
        string AttendanceToken);
}
