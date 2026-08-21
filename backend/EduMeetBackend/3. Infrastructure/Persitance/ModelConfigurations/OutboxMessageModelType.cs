using _1._Domain.Outbound;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace _3._Infrastracture.Persitance.ModelConfigurations;

public sealed class OutboxMessageModelTypeConfiguration
    : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.HasKey(message => message.Id);
        

        builder.Property(message => message.Type)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(message => message.Payload)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(message => message.CreatedAtUtc)
            .IsRequired();

        builder.Property(message => message.AttemptCount)
            .IsRequired();

        builder.Property(message => message.LastError)
            .HasMaxLength(2000);

        builder.HasIndex(message => new
        {
            message.ProcessedAtUtc,
            message.NextAttemptAtUtc
        });
    }
}