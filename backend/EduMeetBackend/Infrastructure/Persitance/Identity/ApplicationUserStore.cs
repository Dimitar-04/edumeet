using _1._Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace _3._Infrastracture.Persitance.Identity;

public sealed class ApplicationUserStore : UserStore<AppUser, IdentityRole<Guid>, ApplicationDbContext, Guid>
{
    public ApplicationUserStore(ApplicationDbContext context, IdentityErrorDescriber? describer = null) : base(context, describer)
    {
        AutoSaveChanges = false;
    }
}
