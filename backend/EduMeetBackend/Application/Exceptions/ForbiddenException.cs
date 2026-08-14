namespace _2._Application.Exceptions;

public sealed class ForbiddenException(string message)
    : Exception(message);
