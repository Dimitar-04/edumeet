using _2._Application.Results;

namespace _2._Application.Interfaces;

public interface IAttendanceTokenService
{
    GeneratedAttendanceToken CreateToken();

    string HashToken(string token);
}