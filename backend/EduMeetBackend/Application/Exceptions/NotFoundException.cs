namespace _2._Application.Exceptions;

public sealed class NotFoundException(string message)
    : Exception(message);
