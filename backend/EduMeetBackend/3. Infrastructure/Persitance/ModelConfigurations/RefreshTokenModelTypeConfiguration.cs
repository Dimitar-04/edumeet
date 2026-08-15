using _1._Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public sealed class RefreshTokenModelTypeConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(token => token.Id);

        builder.Property(token => token.TokenHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(token => token.CreatedAtUtc)
            .IsRequired();

        builder.Property(token => token.ExpiresAtUtc)
            .IsRequired();

        builder.HasOne(token => token.AppUser)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.AppUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(token => token.TokenHash)
            .IsUnique();

        builder.HasIndex(token => token.AppUserId);
        builder.HasIndex(token => token.ExpiresAtUtc);
    }
}