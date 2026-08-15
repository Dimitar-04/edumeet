using System.Linq.Expressions;
using _2._Application.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Repositories.Base;

public abstract class BaseRepository<T>(ApplicationDbContext context)
    : IBaseRepository<T> where T : class
{
    protected ApplicationDbContext Context { get; } = context;

    public void Add(T entity) => Context.Set<T>().Add(entity);

    public void AddRange(IEnumerable<T> entities) =>
        Context.Set<T>().AddRange(entities);

    public async Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<T> query = Context.Set<T>();

        if (include is not null)
        {
            query = include(query);
        }

        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        if (orderBy is not null)
        {
            query = orderBy(query);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public void Update(T entity) => Context.Set<T>().Update(entity);

    public async Task<IReadOnlyList<T>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await Context.Set<T>().ToListAsync(cancellationToken);
    }

    public ValueTask<T?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return Context.Set<T>().FindAsync([id], cancellationToken);
    }

    public void Remove(T entity) => Context.Set<T>().Remove(entity);

    public void RemoveRange(IEnumerable<T> entities) =>
        Context.Set<T>().RemoveRange(entities);
}
