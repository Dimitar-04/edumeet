namespace _2._Application.Responses;

public sealed record AuthenticationResponse(
    RegisteredUserResponse User,
    DateTimeOffset AccessTokenExpiresAtUtc);
