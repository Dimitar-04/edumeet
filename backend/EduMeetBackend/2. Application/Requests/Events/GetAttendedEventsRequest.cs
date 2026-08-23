using System.ComponentModel.DataAnnotations;

namespace _2._Application.Requests;

public sealed class GetAttendedEventsRequest
{
    [StringLength(50)]
    public string? Category { get; init; }

    [Range(1, 1_000_000)]
    public int PageNumber { get; init; } = 1;

    [Range(1, 24)]
    public int PageSize { get; init; } = 6;
}
