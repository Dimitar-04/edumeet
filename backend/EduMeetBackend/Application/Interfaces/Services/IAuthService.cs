using _2._Application.Auth.Requests;
using _2._Application.Auth.Responses;
using _2._Application.Auth.Results;

namespace _2._Application.Interfaces;

public interface IAuthService
{
    Task<RegistrationResult> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default);

    Task<LoginResult> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default);

    Task<RegisteredUserResponse?> GetCurrentUserAsync(string username, CancellationToken ct = default);

    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}
