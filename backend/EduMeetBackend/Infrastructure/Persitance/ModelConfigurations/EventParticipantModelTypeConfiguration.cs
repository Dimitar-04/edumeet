using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public class EventParticipantModelTypeConfiguration:IEntityTypeConfiguration<EventParticipant>
{
    public void Configure(EntityTypeBuilder<EventParticipant> builder)
    {
        builder.HasKey(ep => new { ep.ParticipantId, ep.EducationalEventId });

        builder.HasOne(ep => ep.Participant)
            .WithMany(ep => ep.EventParticipants)
            .HasForeignKey(ep => ep.ParticipantId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne(ep => ep.EducationalEvent)
            .WithMany(ep => ep.EventParticipants)
            .HasForeignKey(ep => ep.EducationalEventId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasIndex(ep=>ep.EducationalEventId);
        builder.HasIndex(ep => ep.ParticipantId);
    }
}