using _1._Domain.Models;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _3._Infrastracture.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Infrastructure.UnitTests.Services;

public sealed class AuthServiceRefreshTests
{
    [Theory]
    [InlineData(RejectedRefreshToken.Missing)]
    [InlineData(RejectedRefreshToken.Expired)]
    [InlineData(RejectedRefreshToken.Revoked)]
    public async Task RefreshTokenAsync_WhenStoredTokenIsInvalid_ReturnsFailure(
        RejectedRefreshToken tokenState)
    {
        var nowUtc = new DateTimeOffset(
            2026, 6, 15, 12, 0, 0, TimeSpan.Zero);
        const string rawToken = "raw-refresh-token";
        const string tokenHash = "stored-refresh-token-hash";

        var appUserRepository = Substitute.For<IAppUserRepository>();
        var fileUploadService = Substitute.For<IFileUploadService>();
        var individualProfileRepository =
            Substitute.For<IIndividualProfileRepository>();
        var organizationProfileRepository =
            Substitute.For<IOrganizationProfileRepository>();
        var refreshTokenRepository = Substitute.For<IRefreshTokenRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var tokenService = Substitute.For<ITokenService>();
        var logger = Substitute.For<ILogger<AuthService>>();

        tokenService.HashRefreshToken(rawToken).Returns(tokenHash);

        RefreshToken? storedToken = tokenState switch
        {
            RejectedRefreshToken.Missing => null,
            RejectedRefreshToken.Expired => CreateStoredToken(
                nowUtc.AddMinutes(-1),
                revokedAtUtc: null),
            RejectedRefreshToken.Revoked => CreateStoredToken(
                nowUtc.AddDays(1),
                revokedAtUtc: nowUtc.AddMinutes(-1)),
            _ => throw new ArgumentOutOfRangeException(nameof(tokenState))
        };

        refreshTokenRepository
            .GetByHashWithUserAsync(tokenHash, Arg.Any<CancellationToken>())
            .Returns(storedToken);

        var service = new AuthService(
            appUserRepository,
            fileUploadService,
            individualProfileRepository,
            organizationProfileRepository,
            refreshTokenRepository,
            unitOfWork,
            tokenService,
            new FixedTimeProvider(nowUtc),
            logger,
            signInManager: null!);

        var result = await service.RefreshTokenAsync(rawToken);

        Assert.False(result.Succeeded);
        Assert.Null(result.Tokens);
        tokenService.DidNotReceive()
            .CreateRefreshToken(Arg.Any<DateTimeOffset?>());
        tokenService.DidNotReceive()
            .CreateAccessToken(Arg.Any<AppUser>());
        await unitOfWork.DidNotReceive()
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    public enum RejectedRefreshToken
    {
        Missing,
        Expired,
        Revoked
    }

    private static RefreshToken CreateStoredToken(
        DateTimeOffset expiresAtUtc,
        DateTimeOffset? revokedAtUtc)
    {
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = "john"
        };

        return new RefreshToken
        {
            AppUserId = user.Id,
            AppUser = user,
            TokenHash = "stored-refresh-token-hash",
            CreatedAtUtc = expiresAtUtc.AddDays(-1),
            ExpiresAtUtc = expiresAtUtc,
            RevokedAtUtc = revokedAtUtc
        };
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
