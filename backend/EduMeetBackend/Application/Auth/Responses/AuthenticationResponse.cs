namespace _2._Application.Auth.Responses;

public sealed record AuthenticationResponse(
    RegisteredUserResponse User,
    DateTimeOffset AccessTokenExpiresAtUtc);