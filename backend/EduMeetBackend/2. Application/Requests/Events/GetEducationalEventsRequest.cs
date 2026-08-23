using System.ComponentModel.DataAnnotations;

namespace _2._Application.Requests;

public enum EventTimeScope
{
    Upcoming,
    All
}

public sealed class GetEducationalEventsRequest
{
    public EventTimeScope Scope { get; init; } =
        EventTimeScope.Upcoming;

    [StringLength(100)]
    public string? Search { get; init; }

    [StringLength(50)]
    public string? Category { get; init; }
}
