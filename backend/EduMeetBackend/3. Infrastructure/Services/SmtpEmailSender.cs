using System.Net;
using _2._Application.Interfaces;
using _2._Application.Notifications;
using _2._Application.Services.Configurations;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
namespace _3._Infrastracture.Services;

public class SmtpEmailSender : IEmailSenderService
{
    private readonly EmailOptions _options;

    public SmtpEmailSender(IOptions<EmailOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendEventRegistrationEmailAsync(
        EventRegistrationEmailMessage message,
        CancellationToken cancellationToken = default)
    {
        var eventUrl =
            $"{_options.FrontendBaseUrl.TrimEnd('/')}" +
            $"/events/{message.EventId}";

        var encodedName =
            WebUtility.HtmlEncode(message.RecipientName);

        var encodedTitle =
            WebUtility.HtmlEncode(message.EventTitle);

        var encodedLocation =
            WebUtility.HtmlEncode(message.LocationName);

        var encodedEventUrl =
            WebUtility.HtmlEncode(eventUrl);

        var email = new MimeMessage();

        email.From.Add(
            new MailboxAddress(
                _options.FromName,
                _options.FromAddress));

        email.To.Add(
            MailboxAddress.Parse(message.RecipientEmail));

        email.Subject =
            $"Registration confirmed: {message.EventTitle}";

        email.Body = new BodyBuilder
        {
            TextBody = $"""
                Hello {message.RecipientName},

                You successfully registered for {message.EventTitle}.

                Date: {message.EventDateUtc:u}
                Location: {message.LocationName}

                View the event:
                {eventUrl}
                """,

            HtmlBody = $"""
                <h2>Registration confirmed</h2>
                <p>Hello {encodedName},</p>
                <p>
                    You successfully registered for
                    <strong>{encodedTitle}</strong>.
                </p>
                <p>
                    <strong>Date:</strong>
                    {message.EventDateUtc:u}
                </p>
                <p>
                    <strong>Location:</strong>
                    {encodedLocation}
                </p>
                <p>
                    <a href="{encodedEventUrl}">
                        View event details
                    </a>
                </p>
                """
        }.ToMessageBody();

        using var client = new SmtpClient();

        var socketOptions = _options.UseSslOnConnect
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;

        await client.ConnectAsync(
            _options.Host,
            _options.Port,
            socketOptions,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            await client.AuthenticateAsync(
                _options.Username,
                _options.Password,
                cancellationToken);
        }

        await client.SendAsync(
            email,
            cancellationToken);

        await client.DisconnectAsync(
            quit: true,
            cancellationToken);
    }
}