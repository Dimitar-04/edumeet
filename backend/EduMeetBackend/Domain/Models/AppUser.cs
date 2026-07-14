using _1._Domain.Enums;

namespace _1._Domain.Models;
using Microsoft.AspNetCore.Identity;


public class AppUser : IdentityUser<Guid>
{
    public AccountType AccountType { get; set; }

    public IndividualProfile? IndividualProfile { get; set; }
    public OrganizationProfile? OrganizationProfile { get; set; }

    public ICollection<EducationalEvent> OrganizedEvents { get; set; } = [];
}