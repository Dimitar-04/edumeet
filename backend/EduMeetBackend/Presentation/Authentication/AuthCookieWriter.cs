using _2._Application.Auth.Results;

namespace _4._Presentation.Authentication;

public static class AuthCookieNames
{
    public const string AccessToken =
        "edumeet.access";

    public const string RefreshToken =
        "edumeet.refresh";
}

public static class AuthCookieWriter
{
    public static void Append(
        HttpResponse response,
        IssuedTokens tokens,
        bool isDevelopment)
    {
        response.Cookies.Append(
            AuthCookieNames.AccessToken,
            tokens.AccessToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment,
                SameSite = SameSiteMode.Strict,
                Path = "/",
                Expires =
                    tokens.AccessTokenExpiresAtUtc,
                IsEssential = true
            });

        response.Cookies.Append(
            AuthCookieNames.RefreshToken,
            tokens.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment,
                SameSite = SameSiteMode.Strict,

                // Only authentication endpoints receive it.
                Path = "/api/auth",

                Expires =
                    tokens.RefreshTokenExpiresAtUtc,

                IsEssential = true
            });
    }

    public static void Delete(
        HttpResponse response,
        bool isDevelopment)
    {
        response.Cookies.Delete(
            AuthCookieNames.AccessToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });

        response.Cookies.Delete(
            AuthCookieNames.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment,
                SameSite = SameSiteMode.Strict,
                Path = "/api/auth"
            });
    }
}