using _1._Domain.Common;

namespace _1._Domain.Models;

public class OrganizationProfile : BaseEntity
{
    public Guid AppUserId { get; set; }
    public AppUser AppUser { get; set; } = null!;

    public required string Name { get; set; }
    public string? Website { get; set; }
}