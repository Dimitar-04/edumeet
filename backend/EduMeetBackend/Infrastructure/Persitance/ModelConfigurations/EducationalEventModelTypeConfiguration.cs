using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public class EducationalEventModelTypeConfiguration:IEntityTypeConfiguration<EducationalEvent>
{
    public void Configure(EntityTypeBuilder<EducationalEvent> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(e => e.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(e => e.ImageUrl)
            .HasMaxLength(500);

        builder.Property(e => e.Date)
            .IsRequired();

        builder.Property(e => e.LocationName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(e => e.Address)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(e => e.Latitude)
            .IsRequired();

        builder.Property(e => e.Longitude)
            .IsRequired();

        builder.Property(e => e.GooglePlaceId)
            .HasMaxLength(200);

        builder.HasOne(e => e.Organizer)
            .WithMany(u => u.OrganizedEvents)
            .HasForeignKey(e => e.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);
        
        

        builder.HasIndex(e => e.OrganizerId);
        builder.HasIndex(e => e.Date);
        builder.HasIndex(e => e.GooglePlaceId);
    
    }
}