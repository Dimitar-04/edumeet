using _2._Application.Notifications;

namespace _2._Application.Interfaces.Repositories;

public interface IEmailOutboxRepository
{
    void Enqueue(
        EventRegistrationEmailMessage message,
        DateTime createdAtUtc);

    Task<IReadOnlyList<QueuedEmailMessage>> GetPendingAsync(
        DateTime nowUtc,
        int maximumCount,
        int maximumAttempts,
        CancellationToken cancellationToken = default);

    Task MarkProcessedAsync(
        Guid messageId,
        DateTime processedAtUtc,
        CancellationToken cancellationToken = default);

    Task MarkFailedAsync(
        Guid messageId,
        string error,
        DateTime nextAttemptAtUtc,
        CancellationToken cancellationToken = default);
}