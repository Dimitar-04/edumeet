namespace _2._Application.Responses;

public sealed record AttendanceParticipantResponse(
    Guid UserId,
    string Name,
    string? ImageUrl,
    DateTime? CheckedInAtUtc);