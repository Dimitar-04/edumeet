using _1._Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance;


public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<EducationalEvent> EducationalEvents => Set<EducationalEvent>();
    public DbSet<IndividualProfile> IndividualProfiles => Set<IndividualProfile>();
    public DbSet<OrganizationProfile> OrganizationProfiles => Set<OrganizationProfile>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<EventParticipant> EventParticipants => Set<EventParticipant>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);
    }
}
