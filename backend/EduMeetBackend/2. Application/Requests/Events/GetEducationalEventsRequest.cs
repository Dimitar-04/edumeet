using System.ComponentModel.DataAnnotations;

namespace _2._Application.Requests;

public enum EventTimeScope
{
    Upcoming,
    Past,
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
    
    [Range(1, 1_000_000)]
    public int PageNumber { get; init; } = 1;

    [Range(1, 24)]
    public int PageSize { get; init; } = 9;
}
