using _1._Domain.Models;
using _2._Application.Requests;

namespace _2._Application.Interfaces;

public interface IAppUserService
{
    public Task<AppUser?> UpdateProfileImageAsync(string username, UploadedFileData image, CancellationToken ct=default);
    
    public Task<AppUser?> GetByIdAsync(Guid userId);
}