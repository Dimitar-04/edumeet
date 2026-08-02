using System.ComponentModel.DataAnnotations;

namespace _2._Application.Auth.Requests;

public sealed class CreateEducationalEventRequest
{
    [Required]
    [StringLength(150)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; init; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Category { get; init; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Format { get; init; } = string.Empty;

    [Required]
    public DateTimeOffset Date { get; init; }

    [Required]
    [StringLength(150)]
    public string LocationName { get; init; } = string.Empty;

    [Required]
    [StringLength(300)]
    public string Address { get; init; } = string.Empty;

    [Range(-90d, 90d)]
    public double Latitude { get; init; }

    [Range(-180d, 180d)]
    public double Longitude { get; init; }

    [Required]
    [StringLength(200)]
    public string GooglePlaceId { get; init; } = string.Empty;
}
