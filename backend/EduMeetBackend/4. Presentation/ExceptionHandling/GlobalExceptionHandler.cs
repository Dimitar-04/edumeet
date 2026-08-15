using _2._Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace _4._Presentation.ExceptionHandling;

public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title) = exception switch
        {
            NotFoundException =>
                (StatusCodes.Status404NotFound, "Resource not found"),

            ForbiddenException =>
                (StatusCodes.Status403Forbidden, "Operation not allowed"),

            ConflictException =>
                (StatusCodes.Status409Conflict, "Conflict"),

            _ =>
                (StatusCodes.Status500InternalServerError, "Server error")
        };

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(
                exception,
                "An unhandled exception occurred while processing {Path}.",
                httpContext.Request.Path);
        }
        else
        {
            logger.LogWarning(
                exception,
                "Request {Path} failed with status code {StatusCode}.",
                httpContext.Request.Path,
                statusCode);
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = statusCode == StatusCodes.Status500InternalServerError
                ? "An unexpected server error occurred."
                : exception.Message,
            Instance = httpContext.Request.Path
        };

        httpContext.Response.StatusCode = statusCode;

        await httpContext.Response.WriteAsJsonAsync(
            problemDetails,
            cancellationToken);

        return true;
    }
}
