using _1._Domain.Models;
using _2._Application.Auth.Results;
using _2._Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Identity;

namespace _3._Infrastracture.Persitance.Repositories;

public sealed class AppUserRepository(UserManager<AppUser> userManager)
    : IAppUserRepository
{
    public async Task<UserCreationResult> AddAsync(
        AppUser user,
        string password)
    {
        var result = await userManager.CreateAsync(user, password);

        return result.Succeeded
            ? UserCreationResult.Success()
            : UserCreationResult.Failure(
                result.Errors.Select(error => error.Description));
    }
}
