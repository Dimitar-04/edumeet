using _2._Application.Auth.Responses;

namespace _2._Application.Auth.Results;

public sealed record LoginResult
{
    private LoginResult(
        RegisteredUserResponse? user,
        IssuedTokens? tokens,
        IReadOnlyCollection<string> errors)
    {
        User = user;
        Tokens = tokens;
        Errors = errors;
    }

    public bool Succeeded =>
        User is not null && Tokens is not null;

    public RegisteredUserResponse? User { get; }
    public IssuedTokens? Tokens { get; }
    public IReadOnlyCollection<string> Errors { get; }

    public static LoginResult Success(
        RegisteredUserResponse user,
        IssuedTokens tokens) =>
        new(user, tokens, []);

    public static LoginResult Failure(
        params string[] errors) =>
        new(null, null, errors);
}