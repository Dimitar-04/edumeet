using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using _2._Application.Responses;
using Presentation.ApiTests.Support;
using Xunit;

namespace Presentation.ApiTests;

public sealed class ProfileApiTests(ApiTestFixture fixture)
    : ApiTestBase(fixture)
{
    [Fact(DisplayName = "API profile: a public profile can be retrieved")]
    public async Task GetProfile_ExistingUser_ReturnsPublicProfile()
    {
        using var ownerClient = Fixture.CreateClient();
        var registered = await ApiScenario.RegisterIndividualAsync(
            ownerClient,
            "public-profile");
        using var anonymousClient = Fixture.CreateClient();

        var response = await anonymousClient.GetAsync(
            $"/api/profile/{registered.User.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var profile =
            await response.Content.ReadFromJsonAsync<PublicUserProfileResponse>();
        Assert.Equal("public-profile", profile!.UserName);
        Assert.Equal("Test Student", profile.DisplayName);
    }

    [Fact(DisplayName = "API profile: username and image updates are persisted")]
    public async Task UpdateProfile_AuthenticatedUser_PersistsChanges()
    {
        using var client = Fixture.CreateClient();
        var registered = await ApiScenario.RegisterIndividualAsync(
            client,
            "profile-owner");

        using var imageForm = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent([1, 2, 3, 4]);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        imageForm.Add(imageContent, "image", "avatar.png");
        var imageResponse = await client.PutAsync(
            "/api/profile/image",
            imageForm);
        Assert.Equal(HttpStatusCode.OK, imageResponse.StatusCode);
        var updatedImage =
            await imageResponse.Content.ReadFromJsonAsync<ProfileImageResponse>();
        Assert.Equal(
            "/uploads/profile-images/avatar.png",
            updatedImage!.ImageUrl);

        var usernameResponse = await client.PutAsJsonAsync(
            "/api/profile/username",
            new { UserName = "updated-owner" });
        Assert.Equal(HttpStatusCode.OK, usernameResponse.StatusCode);
        var updatedAuthentication =
            await usernameResponse.Content.ReadFromJsonAsync<AuthenticationResponse>();
        Assert.Equal("updated-owner", updatedAuthentication!.User.UserName);

        var profile = await client.GetFromJsonAsync<PublicUserProfileResponse>(
            $"/api/profile/{registered.User.Id}");
        Assert.Equal("updated-owner", profile!.UserName);
        Assert.Equal(updatedImage.ImageUrl, profile.ImageUrl);
    }

    [Fact(DisplayName = "API profile: anonymous updates are rejected")]
    public async Task UpdateUsername_AnonymousUser_ReturnsUnauthorized()
    {
        using var client = Fixture.CreateClient();

        var response = await client.PutAsJsonAsync(
            "/api/profile/username",
            new { UserName = "not-allowed" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
