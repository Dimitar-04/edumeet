using _1._Domain.Common;

namespace _1._Domain.Models;

public class RefreshToken:BaseEntity
{
    public Guid AppUserId { get; set; }
    public AppUser AppUser { get; set; } = null!;

    public required string TokenHash { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }

    public bool IsActive(DateTimeOffset now) =>
        RevokedAtUtc is null &&
        ExpiresAtUtc > now;
}