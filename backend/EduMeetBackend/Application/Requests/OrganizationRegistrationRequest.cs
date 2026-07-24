using System.ComponentModel.DataAnnotations;

namespace _2._Application.Auth.Requests;

public sealed class OrganizationRegistrationRequest
{
    [Required]
    [StringLength(150)]
    public string Name { get; init; } = string.Empty;

    [Url]
    [StringLength(300)]
    public string? Website { get; init; }

    [Url]
    [StringLength(500)]
    public string? LogoUrl { get; init; }
}
