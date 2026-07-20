using _2._Application.Interfaces;
using _2._Application.Auth.Requests;
using _2._Application.Auth.Responses;
using _4._Presentation.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _4._Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController:ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IAuthService authService, IWebHostEnvironment environment)
    {
        _authService = authService;
        _environment = environment;
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
        
        AuthCookieWriter.Append(Response,
            result.Tokens!,
            _environment.IsDevelopment());
        
        
        return StatusCode(
            StatusCodes.Status201Created,
            new AuthenticationResponse(
                result.User!,
                result.Tokens!
                    .AccessTokenExpiresAtUtc));
    }
    
    
    
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<AuthenticationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result =
            await _authService.LoginAsync(
                request,
                cancellationToken);

        if (!result.Succeeded)
        {
            return Unauthorized(new
            {
                errors = result.Errors
            });
        }

        AuthCookieWriter.Append(
            Response,
            result.Tokens!,
            _environment.IsDevelopment());

        return Ok(
            new AuthenticationResponse(
                result.User!,
                result.Tokens!
                    .AccessTokenExpiresAtUtc));
    }


    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<RegisteredUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(username))
        {
            return Unauthorized();
        }

        var user =
            await _authService.GetCurrentUserAsync(
                username, ct);

        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(user);
    }
    
    
    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType<RefreshResponse>(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(
            AuthCookieNames.RefreshToken,
            out var rawRefreshToken);

        var result =
            await _authService.RefreshTokenAsync(
                rawRefreshToken,
                cancellationToken);

        if (!result.Succeeded)
        {
            AuthCookieWriter.Delete(
                Response,
                _environment.IsDevelopment());

            return Unauthorized();
        }

        AuthCookieWriter.Append(
            Response,
            result.Tokens!,
            _environment.IsDevelopment());

        return Ok(
            new RefreshResponse(
                result.Tokens!
                    .AccessTokenExpiresAtUtc));
    }
    
    [AllowAnonymous]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(
            AuthCookieNames.RefreshToken,
            out var rawRefreshToken);

        await _authService.LogoutAsync(
            rawRefreshToken,
            cancellationToken);

        AuthCookieWriter.Delete(
            Response,
            _environment.IsDevelopment());

        return NoContent();
    }
}
