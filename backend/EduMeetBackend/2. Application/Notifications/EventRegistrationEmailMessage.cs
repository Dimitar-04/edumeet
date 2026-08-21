namespace _2._Application.Notifications;

public sealed record EventRegistrationEmailMessage(
    string RecipientEmail,
    string RecipientName,
    Guid EventId,
    string EventTitle,
    DateTime EventDateUtc,
    string LocationName);