using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using TaskManagementAPI.Data;
using TaskManagerAPI.Models.DTOs;
using TaskManagerAPI.Models;
using TaskManagerAPI.Models.DTOS;
using TaskManagerAPI.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace TaskManagerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuthController> _logger;
        private readonly JwtService _jwtService;

        public AuthController(AppDbContext context, ILogger<AuthController> logger, JwtService _jwtservice )
        {
            _context = context;
            _logger = logger;
            _jwtService = _jwtservice;
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
        public IActionResult Register(RegisterDto request)
        {
            if (_context.Users.Any(u => u.Email == request.Email))
            {
                return BadRequest("User already exists with this email.");
            }

            var hashedPassword = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Password)));

            var newUser = new Users
            {
                UserName = request.Username,
                Email = request.Email,
                PasswordHash = hashedPassword,
                UserRole = "User",
                CreatedDate = DateTime.Now,
                IsDeleted = false
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();

            return Ok("User registered successfully!");
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
        public IActionResult Login([FromBody] loginDto request)
        {
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Login attempt for user: {Email}", request.Email);

            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
            if (user == null)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning("Login failed: User {Email} not found", request.Email);
                return BadRequest("User not found.");
            }
            var hashedPassword = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Password)));
            if (user.PasswordHash != hashedPassword)
            {
                return BadRequest("Incorrect password.");
            }

            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("User {Email} logged in successfully at {Time}", request.Email, DateTime.Now);


            var token = _jwtService.GenerateToken(user);
            return Ok(new { token = token, message = "login successful" });
        }

    }
}