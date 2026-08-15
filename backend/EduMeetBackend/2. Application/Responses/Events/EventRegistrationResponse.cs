namespace _2._Application.Responses;

public sealed record EventRegistrationResponse(
    Guid EventId,
    bool IsRegistered,
    int RegisteredPeopleCount);
