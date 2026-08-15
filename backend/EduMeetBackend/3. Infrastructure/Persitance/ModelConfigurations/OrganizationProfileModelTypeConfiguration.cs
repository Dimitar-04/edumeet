using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public class OrganizationProfileModelTypeConfiguration:IEntityTypeConfiguration<OrganizationProfile>
{
    public void Configure(EntityTypeBuilder<OrganizationProfile> builder)
    {
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(o => o.Website)
            .HasMaxLength(300);
        
        builder.HasOne(o => o.AppUser)
            .WithOne(u => u.OrganizationProfile)
            .HasForeignKey<OrganizationProfile>(o => o.AppUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => o.AppUserId);
    }
}