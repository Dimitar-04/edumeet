namespace _2._Application.Responses;

public sealed record AttendanceSummaryResponse(
    Guid EventId,
    int RegisteredPeopleCount,
    int AttendedPeopleCount,
    double? AttendanceRate,
    IReadOnlyList<AttendanceParticipantResponse> Participants);