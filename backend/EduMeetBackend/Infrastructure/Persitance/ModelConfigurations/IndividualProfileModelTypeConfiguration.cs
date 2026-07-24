using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public class IndividualProfileModelTypeConfiguration:IEntityTypeConfiguration<IndividualProfile>
{
    public void Configure(EntityTypeBuilder<IndividualProfile> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.FirstName)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(p => p.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasOne(p => p.AppUser)
            .WithOne(u => u.IndividualProfile)
            .HasForeignKey<IndividualProfile>(p => p.AppUserId)
            .OnDelete(DeleteBehavior.Cascade);
        

        builder.HasIndex(p => p.AppUserId);
    }
}