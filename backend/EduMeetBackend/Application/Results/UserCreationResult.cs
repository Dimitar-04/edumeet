namespace _2._Application.Results;

public sealed record UserCreationResult(
    bool Succeeded,
    IReadOnlyCollection<string> Errors)
{
    public static UserCreationResult Success() =>
        new(true, Array.Empty<string>());

    public static UserCreationResult Failure(IEnumerable<string> errors) =>
        new(false, errors.ToArray());
}
