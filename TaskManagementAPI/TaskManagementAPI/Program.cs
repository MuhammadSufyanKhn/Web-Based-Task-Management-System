using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using System;
using System.Text;
using TaskManagementAPI.Data;
using TaskManagerAPI.Helpers;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information() 
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning) 
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File(Path.Combine(AppContext.BaseDirectory, "Logs", "log-.txt"),
    rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact",
        policy => policy.WithOrigins("http://localhost:5173")
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<JwtService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowReact");


app.UseAuthentication(); 
app.UseAuthorization(); 

app.MapControllers();

app.Run();