using System.Text.Json;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Notifications;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace _3._Infrastracture.Services.BackgroundServices;

public sealed class EmailOutboxWorker(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<EmailOutboxWorker> logger)
    : BackgroundService
{
    private const int BatchSize = 10;
    private const int MaximumAttempts = 5;

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var foundMessages =
                    await ProcessPendingMessagesAsync(
                        stoppingToken);

                if (!foundMessages)
                {
                    await Task.Delay(
                        TimeSpan.FromSeconds(5),
                        stoppingToken);
                }
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "The email outbox worker failed.");

                await Task.Delay(
                    TimeSpan.FromSeconds(10),
                    stoppingToken);
            }
        }
    }

    private async Task<bool> ProcessPendingMessagesAsync(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<QueuedEmailMessage> messages;

        using (var readScope = scopeFactory.CreateScope())
        {
            var repository =
                readScope.ServiceProvider
                    .GetRequiredService<IEmailOutboxRepository>();

            messages = await repository.GetPendingAsync(
                timeProvider.GetUtcNow().UtcDateTime,
                BatchSize,
                MaximumAttempts,
                cancellationToken);
        }

        foreach (var queuedMessage in messages)
        {
            await ProcessMessageAsync(
                queuedMessage,
                cancellationToken);
        }

        return messages.Count > 0;
    }

    private async Task ProcessMessageAsync(
        QueuedEmailMessage queuedMessage,
        CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();

        var repository =
            scope.ServiceProvider
                .GetRequiredService<IEmailOutboxRepository>();

        var emailSender =
            scope.ServiceProvider
                .GetRequiredService<IEmailSenderService>();

        var unitOfWork =
            scope.ServiceProvider
                .GetRequiredService<IUnitOfWork>();

        try
        {
            var message =
                JsonSerializer.Deserialize<EventRegistrationEmailMessage>(
                    queuedMessage.Payload)
                ?? throw new JsonException(
                    "The email message payload was empty.");

            await emailSender.SendEventRegistrationEmailAsync(
                message,
                cancellationToken);

            await repository.MarkProcessedAsync(
                queuedMessage.Id,
                timeProvider.GetUtcNow().UtcDateTime,
                cancellationToken);

            await unitOfWork.SaveChangesAsync(
                cancellationToken);

            logger.LogInformation(
                "Email outbox message {MessageId} was processed.",
                queuedMessage.Id);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            var attemptNumber =
                queuedMessage.AttemptCount + 1;

            var nextAttemptAtUtc =
                timeProvider.GetUtcNow().UtcDateTime +
                GetRetryDelay(attemptNumber);

            await repository.MarkFailedAsync(
                queuedMessage.Id,
                exception.Message,
                nextAttemptAtUtc,
                cancellationToken);

            await unitOfWork.SaveChangesAsync(
                cancellationToken);

            logger.LogWarning(
                exception,
                "Email outbox message {MessageId} failed on attempt {Attempt}.",
                queuedMessage.Id,
                attemptNumber);
        }
    }

    private static TimeSpan GetRetryDelay(
        int attemptNumber)
    {
        return attemptNumber switch
        {
            1 => TimeSpan.FromMinutes(1),
            2 => TimeSpan.FromMinutes(5),
            3 => TimeSpan.FromMinutes(15),
            4 => TimeSpan.FromHours(1),
            _ => TimeSpan.FromHours(6)
        };
    }
}