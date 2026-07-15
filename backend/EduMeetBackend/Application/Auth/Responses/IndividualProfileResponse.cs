namespace _2._Application.Auth.Responses;

public sealed record IndividualProfileResponse(
    Guid Id,
    string FirstName,
    string LastName);
