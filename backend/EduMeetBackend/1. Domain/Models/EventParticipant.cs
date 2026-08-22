 namespace _1._Domain.Models;

public class EventParticipant
{
    public Guid ParticipantId { get; set; }
    public IndividualProfile Participant { get; set; } = null!;
    
    public Guid EducationalEventId { get; set; }
    public EducationalEvent EducationalEvent { get; set; } = null!;
    
    public string? AttendanceTokenHash { get; set; }

    public DateTime? CheckedInAtUtc { get; set; }

    public Guid? CheckedInByUserId { get; set; }
    public AppUser? CheckedInByUser { get; set; }


}