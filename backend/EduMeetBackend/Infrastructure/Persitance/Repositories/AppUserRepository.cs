using _1._Domain.Models;
using _2._Application.Auth.Results;
using _2._Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Repositories;

public sealed class AppUserRepository(UserManager<AppUser> userManager, ILookupNormalizer normalizer, ApplicationDbContext dbContext)
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
    
    
    public Task<AppUser?> FindByLoginAsync(
        string login,
        CancellationToken cancellationToken = default)
    {
        var normalizedUserName =
            normalizer.NormalizeName(login);

        var normalizedEmail =
            normalizer.NormalizeEmail(login);

        return dbContext.Users
            .Include(user => user.IndividualProfile)
            .Include(user => user.OrganizationProfile)
            .SingleOrDefaultAsync(
                user =>
                    user.NormalizedUserName ==
                    normalizedUserName ||
                    user.NormalizedEmail ==
                    normalizedEmail,
                cancellationToken);
    }
}
