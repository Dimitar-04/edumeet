using _2._Application.Auth.Requests;
using _2._Application.Auth.Responses;
using _2._Application.Interfaces;
using _4._Presentation.FileReaders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _4._Presentation.Controllers;

[ApiController]
[Authorize]
[Route("api/events")]
public class EventsController : ControllerBase
{
    private IEducationalEventService _educationalEventService;

    public EventsController(IEducationalEventService educationalEventService)
    {
        _educationalEventService = educationalEventService;
    }
    
    private const long MaxCoverImageSize = 8 * 1024 * 1024;

    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<EducationalEventResponse>>(
        StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUpcoming(
        CancellationToken cancellationToken)
    {
        var events = await _educationalEventService.GetUpcomingAsync(
            cancellationToken);

        return Ok(events);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<EducationalEventResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromForm] CreateEducationalEventRequest request,
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
            MaxCoverImageSize,
            cancellationToken);

        if (!imageResult.Succeeded)
        {
            ModelState.AddModelError("image", imageResult.Error!);
            return ValidationProblem(ModelState);
        }

        var createdEvent = await _educationalEventService.CreateAsync(
            request,
            username,
            imageResult.File,
            cancellationToken);

        if (createdEvent is null)
        {
            return Unauthorized();
        }

        return Created(
            $"/api/events/{createdEvent.Id}",
            createdEvent);
    }
}
