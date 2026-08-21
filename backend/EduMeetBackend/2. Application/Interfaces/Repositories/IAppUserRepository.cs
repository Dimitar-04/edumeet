using _1._Domain.Models;
using _2._Application.Results;

namespace _2._Application.Interfaces.Repositories;

public interface IAppUserRepository:IBaseRepository<AppUser>
{
    Task<UserCreationResult> AddAsync(
        AppUser user,
        string password);

    Task<UserCreationResult> UpdateUserNameAsync(
        AppUser user,
        string userName);
    
    Task<AppUser?> FindByLoginAsync(
        string login,
        CancellationToken cancellationToken = default);

    Task<AppUser?> FindByUsernameAsync(string username, CancellationToken ct = default);

    Task<AppUser?> FindTrackedByUsernameAsync(
        string username,
        CancellationToken cancellationToken = default);
    
    public Task<AppUser?> GetPublicProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
