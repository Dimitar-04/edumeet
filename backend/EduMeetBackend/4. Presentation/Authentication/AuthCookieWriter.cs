using _2._Application.Results;

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
    public static void AppendAccessToken(
        HttpResponse response,
        AccessTokenResult accessToken,
        bool isDevelopment)
    {
        response.Cookies.Append(
            AuthCookieNames.AccessToken,
            accessToken.Value,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment,
                SameSite = SameSiteMode.Strict,
                Path = "/",
                Expires = accessToken.ExpiresAtUtc,
                IsEssential = true
            });
    }

    public static void Append(
        HttpResponse response,
        IssuedTokens tokens,
        bool isDevelopment)
    {
        AppendAccessToken(
            response,
            new AccessTokenResult(
                tokens.AccessToken,
                tokens.AccessTokenExpiresAtUtc),
            isDevelopment);

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
