using _1._Domain.Models;
using _2._Application.Requests;
using _2._Application.Responses;

namespace _2._Application.Interfaces;

public interface IAppUserService
{
    public Task<AppUser?> UpdateProfileImageAsync(string username, UploadedFileData image, CancellationToken ct=default);
    
    Task<PublicUserProfileResponse?> GetUserProfileByIdAsync(
        Guid userId,
        string? currentUsername,
        CancellationToken cancellationToken = default);
}
