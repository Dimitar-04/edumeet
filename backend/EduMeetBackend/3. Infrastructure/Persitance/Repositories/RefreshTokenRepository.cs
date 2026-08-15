using _1._Domain.Models;
using _2._Application.Interfaces.Repositories;
using _3._Infrastracture.Persitance.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Repositories;

public class RefreshTokenRepository(ApplicationDbContext context) : BaseRepository<RefreshToken>(context), IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByHashWithUserAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        return Context.Set<RefreshToken>()
            .Include(t => t.AppUser)
            .SingleOrDefaultAsync(
                t => t.TokenHash == tokenHash,
                cancellationToken);
    }
}