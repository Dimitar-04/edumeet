using System.ComponentModel.DataAnnotations;
using _1._Domain.Enums;

namespace _2._Application.Auth.Requests;

public sealed class RegisterRequest
{
    [Required]
    [StringLength(256)]
    public string UserName { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; init; }

    [Required]
  
    public string Password { get; init; } = string.Empty;


    [Required]
    [Compare(nameof(Password))]
    public string ConfirmPassword { get; init; } = string.Empty;

    [EnumDataType(typeof(AccountType))]
    public AccountType AccountType { get; init; }

    public IndividualRegistrationRequest? Individual { get; init; }
    public OrganizationRegistrationRequest? Organization { get; init; }
}
