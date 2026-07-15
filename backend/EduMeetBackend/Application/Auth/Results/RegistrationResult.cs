using _2._Application.Auth.Responses;

namespace _2._Application.Auth.Results;

public sealed record RegistrationResult
{
    private RegistrationResult(
        RegisteredUserResponse? user,
        IReadOnlyCollection<string> errors)
    {
        User = user;
        Errors = errors;
    }

    public bool Succeeded => User is not null;
    public RegisteredUserResponse? User { get; }
    public IReadOnlyCollection<string> Errors { get; }

    public static RegistrationResult Success(RegisteredUserResponse user) =>
        new(user, Array.Empty<string>());

    public static RegistrationResult Failure(params string[] errors) =>
        new(null, errors);

    public static RegistrationResult Failure(IEnumerable<string> errors) =>
        new(null, errors.ToArray());
}
