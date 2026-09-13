using _2._Application.Interfaces;
using _2._Application.Services.Configurations;
using _3._Infrastracture.Persitance;
using _3._Infrastracture.Services;
using _3._Infrastracture.Services.BackgroundServices;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Testcontainers.PostgreSql;
using Xunit;

namespace Presentation.ApiTests.Support;

public sealed class ApiTestFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container =
        new PostgreSqlBuilder("postgres:17")
            .WithDatabase("edumeet_api_tests")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();

    private DbContextOptions<ApplicationDbContext> _databaseOptions = null!;
    private EduMeetApiFactory _factory = null!;

    public DateTimeOffset NowUtc { get; } = DateTimeOffset.UtcNow;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        _databaseOptions =
            new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseNpgsql(_container.GetConnectionString())
                .Options;

        await using (var context = CreateDbContext())
        {
            await context.Database.MigrateAsync();
        }

        _factory = new EduMeetApiFactory(
            _container.GetConnectionString(),
            new FixedTimeProvider(NowUtc));
    }

    public async Task DisposeAsync()
    {
        await _factory.DisposeAsync();
        await _container.DisposeAsync();
    }

    public HttpClient CreateClient() => _factory.CreateClient(
        new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
            HandleCookies = true
        });

    public ApplicationDbContext CreateDbContext() =>
        new(_databaseOptions);

    public async Task ResetDatabaseAsync()
    {
        await using var context = CreateDbContext();
        await context.Database.ExecuteSqlRawAsync(
            """
            DO $$
            DECLARE table_name text;
            BEGIN
                FOR table_name IN
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                      AND tablename <> '__EFMigrationsHistory'
                LOOP
                    EXECUTE format(
                        'TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE',
                        'public',
                        table_name);
                END LOOP;
            END $$;
            """);
    }
}

public sealed class EduMeetApiFactory(
    string connectionString,
    TimeProvider timeProvider) : WebApplicationFactory<Program>
{
    private const string SigningKey =
        "QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUE=";
    private const string Issuer = "EduMeet.ApiTests";
    private const string Audience = "EduMeet.ApiTests.Client";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = connectionString,
                    ["Jwt:SigningKey"] = SigningKey,
                    ["Jwt:Issuer"] = Issuer,
                    ["Jwt:Audience"] = Audience,
                    ["Jwt:AccessTokenMinutes"] = "60",
                    ["Jwt:RefreshTokenDays"] = "10",
                    ["Email:Host"] = "unused.test",
                    ["Email:Port"] = "25",
                    ["Email:FromAddress"] = "noreply@edumeet.test",
                    ["Email:FrontendBaseUrl"] = "https://frontend.test"
                });
        });
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ApplicationDbContext>();
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<
                IDbContextOptionsConfiguration<ApplicationDbContext>>();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(connectionString));

            var outboxWorker = services.SingleOrDefault(descriptor =>
                descriptor.ServiceType == typeof(IHostedService) &&
                descriptor.ImplementationType == typeof(EmailOutboxWorker));
            if (outboxWorker is not null)
            {
                services.Remove(outboxWorker);
            }

            services.RemoveAll<TimeProvider>();
            services.AddSingleton(timeProvider);

            services.RemoveAll<ITokenService>();
            services.AddSingleton<ITokenService>(new TokenService(
                Options.Create(new JwtOptions
                {
                    SigningKey = SigningKey,
                    Issuer = Issuer,
                    Audience = Audience,
                    AccessTokenMinutes = 60,
                    RefreshTokenDays = 10
                }),
                timeProvider));
            services.PostConfigure<JwtBearerOptions>(
                JwtBearerDefaults.AuthenticationScheme,
                options =>
                {
                    options.TokenValidationParameters.IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Convert.FromBase64String(SigningKey));
                    options.TokenValidationParameters.ValidIssuer = Issuer;
                    options.TokenValidationParameters.ValidAudience = Audience;
                });

            services.RemoveAll<IFileUploadService>();
            services.AddSingleton<IFileUploadService, TestFileUploadService>();
        });
    }
}

public sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => utcNow;
}

public sealed class TestFileUploadService : IFileUploadService
{
    public Task<string> UploadFileAsync(
        byte[] fileBytes,
        string originalFileName,
        string folder = "uploads")
    {
        return Task.FromResult(
            $"/uploads/{folder}/{Path.GetFileName(originalFileName)}");
    }
}

[CollectionDefinition(Name)]
public sealed class ApiTestCollection : ICollectionFixture<ApiTestFixture>
{
    public const string Name = "EduMeet HTTP API tests";
}
