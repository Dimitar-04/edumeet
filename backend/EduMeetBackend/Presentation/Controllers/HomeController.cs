using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using _4._Presentation.Models;

namespace _4._Presentation.Controllers;
[ApiController]
[Route("api/{controller}")]
public class HomeController : ControllerBase
{
    [HttpGet]
    public IActionResult Hello()
    {
        return Ok(new {message="Hello World!"});
    }
}