using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using TaskManagementAPI.Data;
using TaskManagerAPI.Models.DTOs;
using TaskManagerAPI.Models;
using TaskManagerAPI.Models.DTOS;

namespace TaskManagerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
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
                UserRole = request.Role,
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
            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest("User not found.");
            }
            using var sha256 = SHA256.Create();
            var hashedPassword = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(request.Password)));
            if (user.PasswordHash != hashedPassword)
            {
                return BadRequest("Incorrect password.");
            }
            // In a real application, you would generate a JWT token here
            return Ok("Login successful!");
        }
    }
}