using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public class ReviewModelTypeConfiguration:IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Grade)
            .IsRequired();

        builder.Property(r => r.Description)
            .HasMaxLength(1000);

        builder.HasOne(r => r.EducationalEvent)
            .WithMany(e => e.Reviews)
            .HasForeignKey(r => r.EducationalEventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_Review_Grade",
                "[Grade] >= 1 AND [Grade] <= 5");
        });

        builder.HasIndex(r => r.EducationalEventId);
    }
}