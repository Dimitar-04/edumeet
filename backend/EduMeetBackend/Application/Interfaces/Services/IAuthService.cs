using _2._Application.Requests;
using _2._Application.Responses;
using _2._Application.Results;

namespace _2._Application.Interfaces;

public interface IAuthService
{
    Task<RegistrationResult> RegisterAsync(
        RegisterRequest request,
        UploadedFileData? image,
        CancellationToken cancellationToken = default);

    Task<LoginResult> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default);

    Task<RegisteredUserResponse?> GetCurrentUserAsync(string username, CancellationToken ct = default);

    Task LogoutAsync(string? refreshToken, CancellationToken ct = default);

    Task<RefreshResult> RefreshTokenAsync(string? refreshToken, CancellationToken ct = default);
}
