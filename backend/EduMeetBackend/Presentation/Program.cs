using System.IdentityModel.Tokens.Jwt;
using _1._Domain.Models;
using _2._Application.Mappings;
using _2._Application.Interfaces;
using _2._Application.Interfaces.Repositories;
using _2._Application.Interfaces.UnitOfWork;
using _2._Application.Services.Configurations;
using _2._Application.Services.Implementations;
using _3._Infrastracture.Persitance;
using _3._Infrastracture.Persitance.Identity;
using _3._Infrastracture.Persitance.Repositories;
using _3._Infrastracture.Persitance.UnitOfWork;
using _3._Infrastracture.Services;
using _4._Presentation.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);



var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

builder.Services.AddAutoMapper(
    _ => { },
    typeof(AuthMappingProfile).Assembly);

builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan =
            TimeSpan.FromMinutes(10);
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddUserStore<ApplicationUserStore>()
    .AddSignInManager();





// Add services to the container.
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<IAppUserService, AppUserService>();
builder.Services.AddScoped<IEducationalEventRepository, EducationalEventRepository>();
builder.Services.AddScoped<IEducationalEventService, EducationalEventService>();
builder.Services.AddScoped<IAppUserRepository, AppUserRepository>();
builder.Services.AddScoped<IIndividualProfileRepository, IndividualProfileRepository>();
builder.Services.AddScoped<IOrganizationProfileRepository, OrganizationProfileRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddControllersWithViews();



var jwtSection = builder.Configuration.GetRequiredSection(JwtOptions.SectionName);

builder.Services
    .AddOptions<JwtOptions>()
    .Bind(jwtSection)
    .Validate(options =>
    {
        try
        {
            return Convert.FromBase64String(
                options.SigningKey).Length >= 32;
        }
        catch (FormatException)
        {
            return false;
        }
    }, "JWT signing key must be a Base64-encoded key of at least 32 bytes.")
    .ValidateOnStart();


var jwtOptions =
    jwtSection.Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "JWT configuration is missing.");


builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                RequireSignedTokens = true,
                RequireExpirationTime = true,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Convert.FromBase64String(
                            jwtOptions.SigningKey)),

                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,

                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,

                ValidateLifetime = true,

                ClockSkew = TimeSpan.FromSeconds(30),

                NameClaimType =
                    JwtRegisteredClaimNames.Sub
            };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue(
                        AuthCookieNames.AccessToken,
                        out var token))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});



var app = builder.Build();


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseCors("ReactFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
