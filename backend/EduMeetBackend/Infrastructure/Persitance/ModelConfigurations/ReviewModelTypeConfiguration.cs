using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public class ReviewModelTypeConfiguration:IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(review => review.Id);

        builder.Property(review => review.Grade)
            .IsRequired();

        builder.Property(review => review.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(review => review.EducationalEvent)
            .WithMany(educationalEvent => educationalEvent.Reviews)
            .HasForeignKey(review => review.EducationalEventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(review => review.Reviewer)
            .WithMany(profile => profile.Reviews)
            .HasForeignKey(review => review.ReviewerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(review => review.ReviewerId);

        builder.HasIndex(review => new
            {
                review.EducationalEventId,
                review.ReviewerId
            })
            .IsUnique();

        builder.ToTable(table =>
        {
            table.HasCheckConstraint(
                "CK_Review_Grade",
                "\"Grade\" >= 1 AND \"Grade\" <= 5");
        });
    }
}