using _1._Domain.Models;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Requests;

namespace _2._Application.Services.Implementations;

public class AppUserService:IAppUserService
{
    private readonly IAppUserRepository _appUserRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly  IFileUploadService _fileUploadService;

    public AppUserService(IAppUserRepository appUserRepository, IUnitOfWork unitOfWork, IFileUploadService fileUploadService)
    {
        _appUserRepository = appUserRepository;
        _unitOfWork = unitOfWork;
        _fileUploadService = fileUploadService;
    }

    public async Task<AppUser?> UpdateProfileImageAsync(string username, UploadedFileData image, CancellationToken ct = default)
    {
        var user = await _appUserRepository.FindTrackedByUsernameAsync(
            username,
            ct);
        if (user is null)
        {
            return null;
        }
        
        var imageUrl = await _fileUploadService.UploadFileAsync(
            image.Bytes,
            image.OriginalFileName,
            "profile-images");

        user.ImageUrl = imageUrl;
        await _unitOfWork.SaveChangesAsync(ct);

        return user;
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
    
   

   
}
