namespace _2._Application.Auth.Responses;

public sealed record RefreshResponse(
    DateTimeOffset AccessTokenExpiresAtUtc);