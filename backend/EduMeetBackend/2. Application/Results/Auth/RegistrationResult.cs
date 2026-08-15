using _2._Application.Responses;

namespace _2._Application.Results;

public sealed record RegistrationResult
{
    private RegistrationResult(
        RegisteredUserResponse? user,
        IssuedTokens? tokens,
        IReadOnlyCollection<string> errors)
    {
        User = user;
        Errors = errors;
        Tokens = tokens;
    }

    public bool Succeeded => User is not null;
    public RegisteredUserResponse? User { get; }
    public IssuedTokens? Tokens { get; }
    public IReadOnlyCollection<string> Errors { get; }

    public static RegistrationResult Success(
        RegisteredUserResponse user,
        IssuedTokens tokens) =>
        new(user, tokens, []);

    public static RegistrationResult Failure(
        IEnumerable<string> errors) =>
        new(null, null, errors.ToArray());
}
