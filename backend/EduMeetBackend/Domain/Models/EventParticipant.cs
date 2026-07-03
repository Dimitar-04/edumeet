namespace _1._Domain.Models;

public class EventParticipant
{
    public Guid ParticipantId { get; set; }
    public IndividualProfile Participant { get; set; } = null!;
    
    public Guid EducationalEventId { get; set; }
    public EducationalEvent EducationalEvent { get; set; } = null!;


}