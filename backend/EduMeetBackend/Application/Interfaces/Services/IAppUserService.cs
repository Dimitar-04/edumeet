using _1._Domain.Models;

namespace _2._Application.Interfaces;

public interface IAppUserService
{
    public Task<AppUser?> UpdateImageByIdAsync(Guid userId, string imagePath);
    
    public Task<AppUser?> GetByIdAsync(Guid userId);
}