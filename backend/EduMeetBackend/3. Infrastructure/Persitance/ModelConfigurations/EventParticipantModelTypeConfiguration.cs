using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public class EventParticipantModelTypeConfiguration:IEntityTypeConfiguration<EventParticipant>
{
    public void Configure(
        EntityTypeBuilder<EventParticipant> builder)
    {
        builder.HasKey(participant => new
        {
            participant.ParticipantId,
            participant.EducationalEventId
        });

        builder.HasOne(participant => participant.Participant)
            .WithMany(profile => profile.EventParticipants)
            .HasForeignKey(participant => participant.ParticipantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(participant => participant.EducationalEvent)
            .WithMany(educationalEvent =>
                educationalEvent.EventParticipants)
            .HasForeignKey(participant =>
                participant.EducationalEventId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(participant =>
                participant.AttendanceTokenHash)
            .HasMaxLength(64);

        builder.Property(participant =>
            participant.CheckedInAtUtc);

        builder.HasOne(participant =>
                participant.CheckedInByUser)
            .WithMany(user =>
                user.PerformedCheckIns)
            .HasForeignKey(participant =>
                participant.CheckedInByUserId)
            .OnDelete(DeleteBehavior.SetNull);
        
        builder.HasIndex(participant =>
                participant.AttendanceTokenHash)
            .IsUnique()
            .HasFilter(
                "\"AttendanceTokenHash\" IS NOT NULL");

        builder.HasIndex(participant =>
            participant.EducationalEventId);

        builder.HasIndex(participant =>
            participant.ParticipantId);

        builder.HasIndex(participant => new
        {
            participant.EducationalEventId,
            participant.CheckedInAtUtc
        });
    }
}