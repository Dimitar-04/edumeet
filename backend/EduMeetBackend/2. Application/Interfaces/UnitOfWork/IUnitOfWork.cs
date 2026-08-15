namespace _2._Application.Interfaces.UnitOfWork;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}
