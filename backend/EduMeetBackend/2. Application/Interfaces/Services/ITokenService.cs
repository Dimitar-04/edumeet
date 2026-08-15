using _1._Domain.Models;
using _2._Application.Results;

namespace _2._Application.Interfaces;

public interface ITokenService
{
    AccessTokenResult CreateAccessToken(AppUser user);

    RefreshTokenResult CreateRefreshToken(DateTimeOffset? absoluteExpiration = null);

    string HashRefreshToken(string rawToken);
}
