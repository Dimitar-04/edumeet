using System.ComponentModel.DataAnnotations;

namespace _2._Application.Requests;

public sealed class UpdateUsernameRequest
{
    [Required]
    [StringLength(256, MinimumLength = 3)]
    public string UserName { get; init; } = string.Empty;
}
