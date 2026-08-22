using System.ComponentModel.DataAnnotations;

namespace _2._Application.Requests;

public sealed class AttendanceCheckInRequest
{
    [Required]
    [StringLength(100)]
    public string AttendanceToken { get; init; } =
        string.Empty;
}