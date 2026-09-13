using System.Net;
using System.Net.Http.Json;
using _2._Application.Responses;
using _2._Application.Results.Common;
using Presentation.ApiTests.Support;
using Xunit;

namespace Presentation.ApiTests;

public sealed class EventApiTests(ApiTestFixture fixture)
    : ApiTestBase(fixture)
{
    [Fact(DisplayName = "API events: create, filter, list by organizer, and retrieve details")]
    public async Task Events_ValidOrganizationJourney_ReturnsCreatedEvent()
    {
        using var organizerClient = Fixture.CreateClient();
        var organizer = await ApiScenario.RegisterOrganizationAsync(
            organizerClient,
            "event-organizer");
        var created = await ApiScenario.CreateEventAsync(
            organizerClient,
            Fixture.NowUtc.AddDays(2),
            "HTTP API Workshop");

        using var anonymousClient = Fixture.CreateClient();
        var filtered = await anonymousClient.GetFromJsonAsync<
            PagedResult<EducationalEventResponse>>(
            "/api/events?scope=Upcoming&search=api&category=Technology&pageNumber=1&pageSize=9");
        Assert.Equal(created.Id, Assert.Single(filtered!.Items).Id);

        var organized = await anonymousClient.GetFromJsonAsync<
            PagedResult<EducationalEventResponse>>(
            $"/api/events/organized-by/{organizer.User.Id}?scope=All&pageNumber=1&pageSize=9");
        Assert.Equal(created.Id, Assert.Single(organized!.Items).Id);

        var details = await anonymousClient.GetFromJsonAsync<EducationalEventResponse>(
            $"/api/events/{created.Id}");
        Assert.Equal("HTTP API Workshop", details!.Title);
        Assert.Equal(organizer.User.Id, details.OrganizerId);
    }

    [Fact(DisplayName = "API events: invalid pagination is rejected by model validation")]
    public async Task GetEvents_InvalidPageSize_ReturnsBadRequest()
    {
        using var client = Fixture.CreateClient();

        var response = await client.GetAsync(
            "/api/events?pageNumber=1&pageSize=100");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact(DisplayName = "API events: anonymous event creation is rejected")]
    public async Task CreateEvent_AnonymousUser_ReturnsUnauthorized()
    {
        using var client = Fixture.CreateClient();
        using var form = new MultipartFormDataContent
        {
            { new StringContent("Unauthorized Event"), "Title" }
        };

        var response = await client.PostAsync("/api/events", form);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
