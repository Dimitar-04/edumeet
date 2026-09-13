using System.Net;
using System.Net.Http.Json;
using _2._Application.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Presentation.ApiTests.Support;
using Xunit;

namespace Presentation.ApiTests;

public sealed class AuthenticationApiTests(ApiTestFixture fixture)
    : ApiTestBase(fixture)
{
    [Fact(DisplayName = "API auth: registration creates a cookie session usable by /me")]
    public async Task Register_ValidIndividual_CreatesAuthenticatedSession()
    {
        using var client = Fixture.CreateClient();
        using var form = ApiScenario.CreateIndividualRegistrationForm("new-student");

        var response = await client.PostAsync("/api/auth/register", form);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var authentication =
            await response.Content.ReadFromJsonAsync<AuthenticationResponse>();
        Assert.NotNull(authentication);
        Assert.Equal("new-student", authentication.User.UserName);
        Assert.NotNull(authentication.User.Individual);
        var cookies = response.Headers.GetValues("Set-Cookie").ToArray();
        Assert.Contains(cookies, cookie =>
            cookie.Contains("edumeet.access=", StringComparison.Ordinal) &&
            cookie.Contains("httponly", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(cookies, cookie =>
            cookie.Contains("edumeet.refresh=", StringComparison.Ordinal) &&
            cookie.Contains("httponly", StringComparison.OrdinalIgnoreCase));

        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        var currentUser =
            await meResponse.Content.ReadFromJsonAsync<RegisteredUserResponse>();
        Assert.Equal(authentication.User.Id, currentUser!.Id);

        await using var context = Fixture.CreateDbContext();
        Assert.True(await context.Users.AnyAsync(user =>
            user.Id == authentication.User.Id));
    }

    [Fact(DisplayName = "API auth: duplicate registration returns validation details")]
    public async Task Register_DuplicateCredentials_ReturnsBadRequest()
    {
        using var firstClient = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(firstClient, "duplicate-user");
        using var secondClient = Fixture.CreateClient();
        using var duplicateForm =
            ApiScenario.CreateIndividualRegistrationForm("duplicate-user");

        var response = await secondClient.PostAsync(
            "/api/auth/register",
            duplicateForm);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem =
            await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.True(problem.Errors.ContainsKey("registration"));
    }

    [Fact(DisplayName = "API auth: login, refresh, and logout rotate and revoke the session")]
    public async Task Session_LoginRefreshLogout_CompletesLifecycle()
    {
        using var registrationClient = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(registrationClient, "session-user");
        using var client = Fixture.CreateClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Login = "session-user", ApiScenario.Password });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var refreshResponse = await client.PostAsync(
            "/api/auth/refresh",
            content: null);
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);
        Assert.NotNull(
            await refreshResponse.Content.ReadFromJsonAsync<RefreshResponse>());

        var logoutResponse = await client.PostAsync(
            "/api/auth/logout",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/auth/me")).StatusCode);

        await using var context = Fixture.CreateDbContext();
        var storedTokens = await context.RefreshTokens.ToListAsync();
        Assert.Equal(3, storedTokens.Count);
        Assert.Equal(2, storedTokens.Count(token => token.RevokedAtUtc is not null));
        Assert.Single(storedTokens, token => token.RevokedAtUtc is null);
    }

    [Fact(DisplayName = "API auth: invalid password is unauthorized")]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        using var registrationClient = Fixture.CreateClient();
        await ApiScenario.RegisterIndividualAsync(registrationClient, "login-user");
        using var client = Fixture.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { Login = "login-user", Password = "WrongPassword123!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
