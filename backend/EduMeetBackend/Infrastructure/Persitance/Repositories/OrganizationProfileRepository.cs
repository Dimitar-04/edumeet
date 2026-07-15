using _1._Domain.Models;
using _2._Application.Interfaces.Repositories;
using _3._Infrastracture.Persitance.Repositories.Base;

namespace _3._Infrastracture.Persitance.Repositories;

public sealed class OrganizationProfileRepository(
    ApplicationDbContext dbContext)
    : BaseRepository<OrganizationProfile>(dbContext),
        IOrganizationProfileRepository;
