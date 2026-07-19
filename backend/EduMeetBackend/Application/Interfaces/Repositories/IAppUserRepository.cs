using _1._Domain.Models;
using _2._Application.Auth.Results;

namespace _2._Application.Interfaces.Repositories;

public interface IAppUserRepository
{
    Task<UserCreationResult> AddAsync(
        AppUser user,
        string password);
    
    Task<AppUser?> FindByLoginAsync(
        string login,
        CancellationToken cancellationToken = default);

    Task<AppUser?> FindByUsernameAsync(string username, CancellationToken ct = default);
}
