using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using _1._Domain.Models;
using _2._Application.Auth.Results;
using _2._Application.Interfaces;
using _2._Application.Services.Configurations;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using JwtRegisteredClaimNames = Microsoft.IdentityModel.JsonWebTokens.JwtRegisteredClaimNames;

namespace _3._Infrastracture.Services;


// Explain
public class TokenService : ITokenService
{
    private readonly JwtOptions _options;
    private readonly TimeProvider _timeProvider;

    public TokenService(IOptions<JwtOptions> options, TimeProvider timeProvider)
    {
        _options = options.Value;
        _timeProvider = timeProvider;
    }


    public AccessTokenResult CreateAccessToken(AppUser user)
    {
        var now = _timeProvider.GetUtcNow();
        var expiresAt = now.AddMinutes(_options.AccessTokenMinutes);

        var claims = new[]
        {
            new Claim(
                JwtRegisteredClaimNames.Sub,
                user.UserName!), 
            new Claim(
                JwtRegisteredClaimNames.UniqueName,
                user.UserName!),
            new Claim(
                JwtRegisteredClaimNames.Jti,
                Guid.CreateVersion7().ToString()),

            new Claim(
                JwtRegisteredClaimNames.Iat,
                now.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),

            new Claim(
                "account_type",
                user.AccountType.ToString())
        };

        var keyBytes = Convert.FromBase64String(_options.SigningKey);
        var signingKey = new SymmetricSecurityKey(keyBytes);
        
        var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: signingCredentials);
        
        var tokenValue = new JwtSecurityTokenHandler().WriteToken(token);
        
        return new AccessTokenResult(tokenValue,expiresAt);
    }

    public RefreshTokenResult CreateRefreshToken(DateTimeOffset? absoluteExpiration = null)
    {
        var now = _timeProvider.GetUtcNow();

        var randomBytes = RandomNumberGenerator.GetBytes(32);

        var rawToken = Base64UrlEncoder.Encode(randomBytes);

        var tokenHash = HashRefreshToken(rawToken);

        return new RefreshTokenResult(
            rawToken,
            tokenHash,
            absoluteExpiration
            ?? now.AddDays(_options.RefreshTokenDays));
    }

    public string HashRefreshToken(string rawToken)
    {
        var bytes = Encoding.UTF8.GetBytes(rawToken);
        var hash = SHA256.HashData(bytes);

        return Convert.ToHexString(hash);
    }
}
