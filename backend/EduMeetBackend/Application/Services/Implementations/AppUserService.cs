using _1._Domain.Models;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;

namespace _2._Application.Services.Implementations;

public class AppUserService:IAppUserService
{
    private readonly IAppUserRepository _appUserRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AppUserService(IAppUserRepository appUserRepository, IUnitOfWork unitOfWork)
    {
        _appUserRepository = appUserRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AppUser?> GetByIdAsync(Guid userId)
    {
        var users=await _appUserRepository.FindAsync(
            predicate: u => u.Id == userId
        );
        if (users.Count==0)
        {
            return null;
        }
        return users.First();
    }
    
    public async Task<AppUser?> UpdateImageByIdAsync(Guid userId, string imagePath)
    {
        var user = await GetByIdAsync(userId);

        if (user == null)
        {
            return null;
        }
        user.ImageUrl = imagePath;

        _appUserRepository.Add(user);
        await _unitOfWork.SaveChangesAsync();
        return await GetByIdAsync(userId);
    }

   
}