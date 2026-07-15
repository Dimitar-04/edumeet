using _2._Application.Auth.Requests;
using _2._Application.Auth.Results;

namespace _2._Application.Interfaces;

public interface IAuthService
{
    Task<RegistrationResult> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default);
}
