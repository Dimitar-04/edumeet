using _1._Domain.Common;

namespace _1._Domain.Models;

public class EducationalEvent:BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime Date { get; set; }
    
    
    public string LocationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public string? GooglePlaceId { get; set; }
    
    

    public Guid OrganizerId { get; set; }
    public AppUser Organizer { get; set; } = null!;

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<EventParticipant> EventParticipants { get; set; } = new List<EventParticipant>();


}