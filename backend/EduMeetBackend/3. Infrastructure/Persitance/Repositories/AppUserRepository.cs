using _1._Domain.Models;
using _2._Application.Results;
using _2._Application.Interfaces.Repositories;
using _3._Infrastracture.Persitance.Repositories.Base;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Repositories;

public sealed class AppUserRepository(UserManager<AppUser> userManager, ApplicationDbContext dbContext)
    : BaseRepository<AppUser>(dbContext),IAppUserRepository
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

    public async Task<UserCreationResult> UpdateUserNameAsync(
        AppUser user,
        string userName)
    {
        var result = await userManager.SetUserNameAsync(
            user,
            userName);

        return result.Succeeded
            ? UserCreationResult.Success()
            : UserCreationResult.Failure(
                result.Errors.Select(error => error.Description));
    }
    
    
    public Task<AppUser?> FindByLoginAsync(
        string login,
        CancellationToken cancellationToken = default)
    {
      
        return Context.Users
            .Include(user => user.IndividualProfile)
            .Include(user => user.OrganizationProfile)
            .SingleOrDefaultAsync(
                user =>
                    user.UserName ==
                    login ||
                    user.Email ==
                    login,
                cancellationToken);
    }

    public async Task<AppUser?> FindByUsernameAsync(string username, CancellationToken ct = default)
    {

        var userList = await FindAsync(
            predicate: u => u
                .UserName!.Equals(username),
            include: q => q.Include(u => u.IndividualProfile)
                .Include(u => u.OrganizationProfile)
                .AsNoTracking(),
            cancellationToken: ct
        );

        return userList.FirstOrDefault();
    }

    public Task<AppUser?> FindTrackedByUsernameAsync(
        string username,
        CancellationToken cancellationToken = default)
    {
        return Context.Users
            .Include(user => user.IndividualProfile)
            .Include(user => user.OrganizationProfile)
            .SingleOrDefaultAsync(
                user => user.UserName == username,
                cancellationToken);
    }

    public Task<AppUser?> GetPublicProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return Context.Users
            .AsNoTracking()
            .AsSplitQuery()
            .Include(u => u.IndividualProfile)
            .Include(u => u.OrganizationProfile)
            .Include(u => u.OrganizedEvents)
                .ThenInclude(educationalEvent => educationalEvent.Reviews)
            .SingleOrDefaultAsync(
                u => u.Id == userId,
                cancellationToken
            );
    }
}
