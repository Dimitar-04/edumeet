using _1._Domain.Models;
using _2._Application.Requests;
using _2._Application.Responses;
using _2._Application.Results;

namespace _2._Application.Interfaces;

public interface IAppUserService
{
    public Task<AppUser?> UpdateProfileImageAsync(string username, UploadedFileData image, CancellationToken ct=default);

    Task<UsernameUpdateResult?> UpdateUsernameAsync(
        string currentUsername,
        string newUsername,
        CancellationToken cancellationToken = default);
    
    Task<PublicUserProfileResponse?> GetUserProfileByIdAsync(
        Guid userId,
        string? currentUsername,
        CancellationToken cancellationToken = default);
}
