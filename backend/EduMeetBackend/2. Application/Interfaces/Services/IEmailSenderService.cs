using _2._Application.Notifications;

namespace _2._Application.Interfaces;

public interface IEmailSenderService
{
    Task SendEventRegistrationEmailAsync(
        EventRegistrationEmailMessage message,
        CancellationToken cancellationToken = default);
}