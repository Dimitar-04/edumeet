using System.Linq.Expressions;

namespace _2._Application.Interfaces.Repositories;

public interface IBaseRepository<T> where T : class
{
    void Add(T entity);
    void AddRange(IEnumerable<T> entities);

    Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken cancellationToken = default);

    void Update(T entity);

    Task<IReadOnlyList<T>> GetAllAsync(
        CancellationToken cancellationToken = default);

    ValueTask<T?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);
}
