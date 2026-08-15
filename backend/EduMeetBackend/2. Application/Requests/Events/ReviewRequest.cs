using System.ComponentModel.DataAnnotations;

namespace _2._Application.Requests;

public sealed record ReviewRequest(
    [Range(1, 5)]
    int Grade,

    [Required]
    [StringLength(1000, MinimumLength = 3)]
    [RegularExpression(
        @"(?s).*\S.*",
        ErrorMessage = "The review description cannot contain only whitespace.")]
    string Description);
