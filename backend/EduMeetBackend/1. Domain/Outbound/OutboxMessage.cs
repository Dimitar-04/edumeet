using _1._Domain.Common;

namespace _1._Domain.Outbound;

public sealed class OutboxMessage : BaseEntity
{

    public string Type { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ProcessedAtUtc { get; set; }

    public int AttemptCount { get; set; }
    public DateTime? NextAttemptAtUtc { get; set; }
    public string? LastError { get; set; }
}