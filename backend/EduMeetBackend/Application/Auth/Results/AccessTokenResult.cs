namespace _2._Application.Auth.Results;

public sealed record AccessTokenResult(
    string Value,
    DateTimeOffset ExpiresAtUtc);

public sealed record RefreshTokenResult(
    string Value,
    string Hash,
    DateTimeOffset ExpiresAtUtc);

public sealed record IssuedTokens(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAtUtc);