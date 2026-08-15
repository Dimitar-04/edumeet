using System.ComponentModel.DataAnnotations;

namespace _2._Application.Requests;

public sealed class IndividualRegistrationRequest
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; init; } = string.Empty;
}
