using _3._Infrastracture.Services;
using Xunit;

namespace Infrastructure.UnitTests.Services;

public sealed class AttendanceTokenServiceTests
{
    [Fact]
    public void CreateToken_ReturnsHumanFriendlyFormattedCode()
    {
        var service = new AttendanceTokenService();

        var generatedToken = service.CreateToken();

        Assert.Matches(
            "^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-" +
            "[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-" +
            "[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$",
            generatedToken.Value);
    }

    [Fact]
    public void HashToken_WhenFormattingDiffers_ReturnsSameHash()
    {
        var service = new AttendanceTokenService();

        var canonicalHash = service.HashToken("ABCD-EFGH-JKLM");
        var manuallyEnteredHash = service.HashToken("  abcd efgh - jklm  ");

        Assert.Equal(canonicalHash, manuallyEnteredHash);
    }

    [Fact]
    public void HashToken_WhenTokensDiffer_ReturnsDifferentHashes()
    {
        var service = new AttendanceTokenService();

        var firstHash = service.HashToken("ABCD-EFGH-JKLM");
        var repeatedHash = service.HashToken("ABCD-EFGH-JKLM");
        var differentHash = service.HashToken("2345-6789-ABCD");

        Assert.Equal(firstHash, repeatedHash);
        Assert.NotEqual(firstHash, differentHash);
        Assert.Matches("^[A-F0-9]{64}$", firstHash);
    }
}
