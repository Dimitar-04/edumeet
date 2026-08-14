namespace _2._Application.Responses;

public sealed record RefreshResponse(
    DateTimeOffset AccessTokenExpiresAtUtc);
