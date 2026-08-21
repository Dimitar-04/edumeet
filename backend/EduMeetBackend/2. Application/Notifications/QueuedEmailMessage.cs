namespace _2._Application.Notifications;

public sealed record QueuedEmailMessage(
    Guid Id,
    string Payload,
    int AttemptCount);