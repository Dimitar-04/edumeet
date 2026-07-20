using _2._Application.Auth.Results;

namespace _2._Application.Auth.Responses;

public sealed class RefreshResult
{
    private RefreshResult(IssuedTokens? tokens)
    {
        Tokens = tokens;
    }

    public IssuedTokens? Tokens { get; }

    public bool Succeeded => Tokens is not null;

    public static RefreshResult Success(IssuedTokens tokens) =>
        new(tokens);

    public static RefreshResult Failure() =>
        new(null);
}
