using _1._Domain.Common;

namespace _1._Domain.Models;

public class IndividualProfile : BaseEntity
{
    public Guid AppUserId { get; set; }
    public AppUser AppUser { get; set; } = null!;
    
    public required string FirstName { get; set; }
    public required string LastName { get; set; }

    public ICollection<EventParticipant> EventParticipants { get; set; } = new List<EventParticipant>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}