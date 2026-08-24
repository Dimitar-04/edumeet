using System.Security.Cryptography;
using System.Text;
using _2._Application.Interfaces;
using _2._Application.Results;

namespace _3._Infrastracture.Services;

public sealed class AttendanceTokenService
    : IAttendanceTokenService
{
    private const string HumanFriendlyAlphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private const int CodeLength = 12;

    public GeneratedAttendanceToken CreateToken()
    {
        var randomBytes =
            RandomNumberGenerator.GetBytes(CodeLength);

        var characters = new char[CodeLength];

        for (var index = 0; index < characters.Length; index++)
        {
            characters[index] =
                HumanFriendlyAlphabet[randomBytes[index] & 31];
        }

        var compactCode = new string(characters);

        var attendanceCode =
            $"{compactCode[..4]}-" +
            $"{compactCode[4..8]}-" +
            compactCode[8..];

        var hash = HashToken(attendanceCode);

        return new GeneratedAttendanceToken(
            attendanceCode,
            hash);
    }

    public string HashToken(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        var normalizedToken = NormalizeForHash(token);

        var tokenBytes =
            Encoding.UTF8.GetBytes(normalizedToken);

        var hashBytes =
            SHA256.HashData(tokenBytes);

        return Convert.ToHexString(hashBytes);
    }

    private static string NormalizeForHash(string token)
    {
        var trimmedToken = token.Trim();

        var compactCode = new string(
            trimmedToken
                .Where(character =>
                    character != '-' &&
                    !char.IsWhiteSpace(character))
                .Select(char.ToUpperInvariant)
                .ToArray());

        var isHumanFriendlyCode =
            compactCode.Length == CodeLength &&
            compactCode.All(character =>
                HumanFriendlyAlphabet.Contains(character));

        return isHumanFriendlyCode
            ? compactCode
            : trimmedToken;
    }
}
