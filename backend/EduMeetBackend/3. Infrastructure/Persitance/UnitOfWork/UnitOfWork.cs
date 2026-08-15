using _2._Application.Interfaces.UnitOfWork;

namespace _3._Infrastracture.Persitance.UnitOfWork;

public sealed class UnitOfWork(ApplicationDbContext dbContext)
    : IUnitOfWork
{
    public Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
