namespace _2._Application.Responses;

public sealed record AttendanceCheckInResponse(
    Guid EventId,
    Guid ParticipantUserId,
    string ParticipantName,
    DateTime CheckedInAtUtc,
    bool AlreadyCheckedIn,
    int RegisteredPeopleCount,
    int AttendedPeopleCount,
    double? AttendanceRate);