using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using TaskManagementAPI.Data;
using TaskManagerAPI.Models.DTOs;
using TaskManagerAPI.Models;
using TaskManagerAPI.Models.DTOS;
using TaskManagerAPI.Helpers;

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
        public IActionResult Register(RegisterDto request)
        {
            if (_context.Users.Any(u => u.Email == request.Email))
            {
                return BadRequest("User already exists with this email.");
            }

            using var sha256 = SHA256.Create();
            var hashedPassword = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(request.Password)));

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
        public IActionResult Login([FromBody] loginDto request)
        {
            _logger.LogInformation("Login attempt for user: {Email}", request.Email);

            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
            if (user == null)
            {
                _logger.LogWarning("Login failed: User {Email} not found", request.Email);
                return BadRequest("User not found.");
            }
            using var sha256 = SHA256.Create();
            var hashedPassword = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(request.Password)));
            if (user.PasswordHash != hashedPassword)
            {
                return BadRequest("Incorrect password.");
            }

            _logger.LogInformation("User {Email} logged in successfully at {Time}", request.Email, DateTime.Now);
            // Login method ke andar
            var token = _jwtService.GenerateToken(user); // Aik chota sa function bana lo
            return Ok(new { token = token, message = "login successful" });
        }

        
    }
}