using _2._Application.Interfaces;
using _2._Application.Auth.Requests;
using Microsoft.AspNetCore.Mvc;

namespace _4._Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController:ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }


    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(
        StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await _authService.RegisterAsync(request, ct);

        if (!result.Succeeded)
        {
            var validationErrors = new Dictionary<string, string[]>
            {
                ["registration"] = result.Errors.ToArray()
            };

            return BadRequest(
                new ValidationProblemDetails(validationErrors));
        }
        return StatusCode(
            StatusCodes.Status201Created,
            result.User);
    }
}
