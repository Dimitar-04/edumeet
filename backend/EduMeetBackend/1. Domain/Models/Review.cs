using _1._Domain.Common;

namespace _1._Domain.Models;

public class Review:BaseEntity
{
    public int Grade { get; set; }
    public string Description { get; set; } = string.Empty;

    public Guid EducationalEventId { get; set; }
    public EducationalEvent EducationalEvent { get; set; } = null!;

    public Guid ReviewerId { get; set; }
    public IndividualProfile Reviewer { get; set; } = null!;

}
