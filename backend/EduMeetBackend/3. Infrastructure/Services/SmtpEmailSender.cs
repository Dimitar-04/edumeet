using System.Net;
using _2._Application.Interfaces;
using _2._Application.Notifications;
using _2._Application.Services.Configurations;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
namespace _3._Infrastracture.Services;
using MimeKit.Utils;
using QRCoder;

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

        var encodedAttendanceToken =
            WebUtility.HtmlEncode(message.AttendanceToken);

        var email = new MimeMessage();

        email.From.Add(
            new MailboxAddress(
                _options.FromName,
                _options.FromAddress));

        email.To.Add(
            MailboxAddress.Parse(message.RecipientEmail));

        email.Subject =
            $"Registration confirmed: {message.EventTitle}";

        var qrCodeBytes =
            PngByteQRCodeHelper.GetQRCode(
                message.AttendanceToken,
                QRCodeGenerator.ECCLevel.Q,
                size: 12);

        using var qrCodeStream =
            new MemoryStream(
                qrCodeBytes,
                writable: false);

        var qrCodeImage = new MimePart("image", "png")
        {
            Content = new MimeContent(qrCodeStream),
            ContentDisposition =
                new ContentDisposition(
                    ContentDisposition.Inline),
            ContentTransferEncoding =
                ContentEncoding.Base64,
            FileName = "edumeet-attendance-qr.png",
            ContentId = MimeUtils.GenerateMessageId()
        };

        var bodyBuilder = new BodyBuilder
        {
            TextBody = $"""
                Hello {message.RecipientName},

                You successfully registered for {message.EventTitle}.

                Date: {message.EventDateUtc:u}
                Location: {message.LocationName}

                Present the attached QR code when entering the event.

                Attendance code:
                {message.AttendanceToken}

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

                <h3>Your attendance QR code</h3>

                <p>
                    Present this code to the organizer when
                    entering the event.
                </p>

                <p>
                    <img
                        src="cid:{qrCodeImage.ContentId}"
                        alt="EduMeet attendance QR code"
                        width="280"
                        height="280"
                    />
                </p>

                <p>
                    If the QR code cannot be scanned, give this
                    attendance code to the organizer:
                </p>

                <p style="
                    display: inline-block;
                    margin: 4px 0 20px;
                    padding: 12px 16px;
                    border: 1px solid #d8e0e7;
                    border-radius: 8px;
                    background: #f1f4f7;
                    color: #263442;
                    font-family: monospace;
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 2px;
                ">
                    {encodedAttendanceToken}
                </p>

                <p>
                    <a href="{encodedEventUrl}">
                        View event details
                    </a>
                </p>
                """
        };

        bodyBuilder.LinkedResources.Add(qrCodeImage);

        email.Body = bodyBuilder.ToMessageBody();

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
