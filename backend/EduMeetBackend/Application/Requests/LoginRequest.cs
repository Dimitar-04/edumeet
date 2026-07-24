namespace _2._Application.Auth.Requests;

public sealed record LoginRequest(
    string Login,
    string Password);