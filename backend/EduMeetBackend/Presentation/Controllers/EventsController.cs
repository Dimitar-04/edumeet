using _2._Application.Requests;
using _2._Application.Responses;
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

    [AllowAnonymous]
    [HttpGet("{eventId:guid}")]
    [ProducesResponseType<EducationalEventResponse>(
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid eventId,
        CancellationToken cancellationToken)
    {
        var educationalEvent =
            await _educationalEventService.GetByIdAsync(
                eventId,
                User.Identity?.Name,
                cancellationToken);

        return educationalEvent is null
            ? NotFound()
            : Ok(educationalEvent);
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

    [HttpPost("{eventId:guid}/registrations")]
    [ProducesResponseType<EventRegistrationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RegisterUserForEvent(
        Guid eventId,
        CancellationToken cancellationToken)
    {
        var username = User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(username))
        {
            return Unauthorized();
        }

        var response =
            await _educationalEventService.RegisterUserForEventAsync(
                eventId,
                username,
                cancellationToken);

        return Ok(response);
    }
}
