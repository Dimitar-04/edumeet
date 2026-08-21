using _2._Application.Responses;

namespace _2._Application.Results;

public sealed record UsernameUpdateResult(
    bool Succeeded,
    RegisteredUserResponse? User,
    AccessTokenResult? AccessToken,
    IReadOnlyCollection<string> Errors)
{
    public static UsernameUpdateResult Success(
        RegisteredUserResponse user,
        AccessTokenResult accessToken) =>
        new(true, user, accessToken, Array.Empty<string>());

    public static UsernameUpdateResult Failure(
        IEnumerable<string> errors) =>
        new(false, null, null, errors.ToArray());
}
