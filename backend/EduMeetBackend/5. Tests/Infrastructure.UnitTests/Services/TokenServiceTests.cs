using System.IdentityModel.Tokens.Jwt;
using _1._Domain.Enums;
using _1._Domain.Models;
using _2._Application.Services.Configurations;
using _3._Infrastracture.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace Infrastructure.UnitTests.Services;

public sealed class TokenServiceTests
{
    [Fact]
    public void CreateAccessToken_ContainsIdentityAndAccountClaims()
    {
        var nowUtc = new DateTimeOffset(
            2026, 6, 15, 12, 0, 0, TimeSpan.Zero);
        var service = CreateService(nowUtc);
        var user = new AppUser
        {
            UserName = "organizer",
            AccountType = AccountType.Organization
        };

        var result = service.CreateAccessToken(user);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Value);

        Assert.Equal(nowUtc.AddMinutes(15), result.ExpiresAtUtc);
        Assert.Equal("edumeet-tests", token.Issuer);
        Assert.Contains("edumeet-tests", token.Audiences);
        Assert.Equal("organizer", token.Claims.Single(claim => claim.Type == "sub").Value);
        Assert.Equal(
            "organizer",
            token.Claims.Single(claim => claim.Type == "unique_name").Value);
        Assert.Equal(
            "Organization",
            token.Claims.Single(claim => claim.Type == "account_type").Value);
        Assert.NotEmpty(token.Claims.Single(claim => claim.Type == "jti").Value);
        Assert.Equal("HS256", token.Header.Alg);
    }

    [Fact]
    public void HashRefreshToken_IsDeterministicAndDistinguishesTokens()
    {
        var service = CreateService(DateTimeOffset.UtcNow);

        var firstHash = service.HashRefreshToken("refresh-token-one");
        var repeatedHash = service.HashRefreshToken("refresh-token-one");
        var differentHash = service.HashRefreshToken("refresh-token-two");

        Assert.Equal(firstHash, repeatedHash);
        Assert.NotEqual(firstHash, differentHash);
        Assert.Matches("^[A-F0-9]{64}$", firstHash);
    }

    private static TokenService CreateService(DateTimeOffset nowUtc)
    {
        var signingKey = Convert.ToBase64String(
            Enumerable.Range(1, 32).Select(number => (byte)number).ToArray());
        var options = Options.Create(new JwtOptions
        {
            Issuer = "edumeet-tests",
            Audience = "edumeet-tests",
            SigningKey = signingKey,
            AccessTokenMinutes = 15,
            RefreshTokenDays = 10
        });

        return new TokenService(options, new FixedTimeProvider(nowUtc));
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
