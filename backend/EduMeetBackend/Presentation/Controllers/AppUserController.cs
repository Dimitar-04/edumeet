using _2._Application.Responses;
using _2._Application.Interfaces;
using _4._Presentation.FileReaders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _4._Presentation.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public class AppUserController:ControllerBase
{
    private const long MaxProfileImageSizeBytes =
        5 * 1024 * 1024;

    private readonly IAppUserService _appUserService;

    public AppUserController(IAppUserService appUserService)
    {
        _appUserService = appUserService;
    }

    [HttpPut("image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<ProfileImageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateImage(
        [FromForm] IFormFile? image,
        CancellationToken cancellationToken)
    {
        var username = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(username))
        {
            return Unauthorized();
        }

        var imageResult = await FormFileReader.ReadImageAsync(
            image,
            MaxProfileImageSizeBytes,
            cancellationToken);

        if (!imageResult.Succeeded)
        {
            ModelState.AddModelError(
                "image",
                imageResult.Error!);

            return ValidationProblem(ModelState);
        }

        if (imageResult.File is null)
        {
            ModelState.AddModelError(
                "image",
                "Please select a profile image.");

            return ValidationProblem(ModelState);
        }
        

        var updatedUser =
            await _appUserService.UpdateProfileImageAsync(
                username,
                imageResult.File,
                cancellationToken);

        if (updatedUser is null)
        {
            return Unauthorized();
        }

        return Ok(
            new ProfileImageResponse(
                updatedUser.ImageUrl!));
    }
}
