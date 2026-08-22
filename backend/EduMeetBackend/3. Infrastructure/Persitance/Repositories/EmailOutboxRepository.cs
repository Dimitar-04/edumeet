using System.Text.Json;
using _1._Domain.Outbound;
using _2._Application.Interfaces.Repositories;
using _2._Application.Notifications;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Repositories;

public class EmailOutboxRepository(ApplicationDbContext dbContext) : IEmailOutboxRepository
{
    private const string EventRegistrationType = nameof(EventRegistrationEmailMessage);
    
    public void Enqueue(EventRegistrationEmailMessage message, DateTime createdAtUtc)
    {
        var outboxMessage = new OutboxMessage
        {
            Type = EventRegistrationType,
            Payload = JsonSerializer.Serialize(message),
            CreatedAtUtc = createdAtUtc,
            AttemptCount = 0
        };

        dbContext.OutboxMessages.Add(outboxMessage);
    }

    public async Task<IReadOnlyList<QueuedEmailMessage>> GetPendingAsync(DateTime nowUtc, int maximumCount, int maximumAttempts,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.OutboxMessages
            .AsNoTracking()
            .Where(message =>
                message.ProcessedAtUtc == null &&
                message.AttemptCount < maximumAttempts &&
                (message.NextAttemptAtUtc == null ||
                 message.NextAttemptAtUtc <= nowUtc))
            .OrderBy(message => message.CreatedAtUtc)
            .Take(maximumCount)
            .Select(message => new QueuedEmailMessage(
                message.Id,
                message.Payload,
                message.AttemptCount))
            .ToListAsync(cancellationToken);
    }

    public async Task MarkProcessedAsync(
        Guid messageId,
        DateTime processedAtUtc,
        CancellationToken cancellationToken = default)
    {
        var message = await dbContext.OutboxMessages
            .SingleAsync(
                item => item.Id == messageId,
                cancellationToken);

        message.ProcessedAtUtc = processedAtUtc;
        message.LastError = null;
        message.NextAttemptAtUtc = null;

        message.Payload = "{}";
    }

    public async Task MarkFailedAsync(Guid messageId, string error, DateTime nextAttemptAtUtc,
        CancellationToken cancellationToken = default)
    {
        var message = await dbContext.OutboxMessages
            .SingleAsync(
                item => item.Id == messageId,
                cancellationToken);

        message.AttemptCount++;
        message.LastError = error.Length <= 2000
            ? error
            : error[..2000];

        message.NextAttemptAtUtc = nextAttemptAtUtc;
    }
}