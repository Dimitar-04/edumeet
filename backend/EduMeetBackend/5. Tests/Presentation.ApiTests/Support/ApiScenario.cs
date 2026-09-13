using System.Net.Http.Json;
using _1._Domain.Enums;
using _2._Application.Responses;

namespace Presentation.ApiTests.Support;

public static class ApiScenario
{
    public const string Password = "Password123!";

    public static async Task<AuthenticationResponse> RegisterIndividualAsync(
        HttpClient client,
        string username)
    {
        using var form = CreateIndividualRegistrationForm(username);

        var response = await client.PostAsync("/api/auth/register", form);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthenticationResponse>())!;
    }

    public static async Task<AuthenticationResponse> RegisterOrganizationAsync(
        HttpClient client,
        string username)
    {
        using var form = CreateOrganizationRegistrationForm(username);

        var response = await client.PostAsync("/api/auth/register", form);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthenticationResponse>())!;
    }

    public static MultipartFormDataContent CreateIndividualRegistrationForm(
        string username)
    {
        return new MultipartFormDataContent
        {
            { new StringContent(username), "UserName" },
            { new StringContent($"{username}@example.com"), "Email" },
            { new StringContent(Password), "Password" },
            { new StringContent(Password), "ConfirmPassword" },
            { new StringContent(((int)AccountType.Individual).ToString()), "AccountType" },
            { new StringContent("Test"), "Individual.FirstName" },
            { new StringContent("Student"), "Individual.LastName" }
        };
    }

    public static MultipartFormDataContent CreateOrganizationRegistrationForm(
        string username)
    {
        return new MultipartFormDataContent
        {
            { new StringContent(username), "UserName" },
            { new StringContent($"{username}@example.com"), "Email" },
            { new StringContent(Password), "Password" },
            { new StringContent(Password), "ConfirmPassword" },
            { new StringContent(((int)AccountType.Organization).ToString()), "AccountType" },
            { new StringContent($"{username} Organization"), "Organization.Name" },
            { new StringContent("https://example.com"), "Organization.Website" }
        };
    }

    public static async Task<EducationalEventResponse> CreateEventAsync(
        HttpClient organizerClient,
        DateTimeOffset date,
        string title = "API Testing Workshop",
        string category = "Technology")
    {
        using var form = new MultipartFormDataContent
        {
            { new StringContent(title), "Title" },
            { new StringContent("Testing the complete HTTP API pipeline."), "Description" },
            { new StringContent(category), "Category" },
            { new StringContent("In person"), "Format" },
            { new StringContent(date.ToString("O")), "Date" },
            { new StringContent("FINKI"), "LocationName" },
            { new StringContent("Rugjer Boshkovikj 16"), "Address" },
            { new StringContent("42.004"), "Latitude" },
            { new StringContent("21.409"), "Longitude" },
            { new StringContent("test-google-place"), "GooglePlaceId" }
        };

        var response = await organizerClient.PostAsync("/api/events", form);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<EducationalEventResponse>())!;
    }
}
