using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;

namespace TaskManagementAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]

    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly AppDbContext _context;

        public UserController(ILogger<UserController> logger, AppDbContext context)
        {
            _logger = logger;
            _context = context;
        }
        [HttpGet("Profile")]
        public IActionResult GetProfile()
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userIdclaim == null)
            {
                _logger.LogWarning("User ID claim not found in token.");
                return Unauthorized("User ID claim not found.");
            }
            int userId = Convert.ToInt32(userIdclaim);
            var user = _context.Users
                .Where(u => u.UserId == userId && u.IsDeleted == false)
                .Select(u => new
                {
                    u.UserId,
                    u.UserName,
                    u.Email,
                    u.UserRole,
                    u.CreatedDate
                })
                .FirstOrDefault();
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found or is deleted.", userId);
                return NotFound("User not found.");
            }
            _logger.LogInformation("Profile retrieved for user ID {UserId}.", userId);
            return Ok(user);
        }

        [HttpPut("Update-profile")]
        public IActionResult UpdateProfile([FromBody] UpdateProfileDto request)
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userIdclaim == null)
            {
                _logger.LogWarning("User ID claim not found in token.");
                return Unauthorized("User ID claim not found.");
            }
            int userId = Convert.ToInt32(userIdclaim);
            var user = _context.Users.FirstOrDefault(u => u.UserId == userId && u.IsDeleted == false);
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found or is deleted.", userId);
                return NotFound("User not found.");
            }
            user.UserName = request.UserName ?? user.UserName;
            user.Email = request.Email ?? user.Email;
            user.UpdatedDate = DateTime.Now;
            user.UpdatedBy = userId;
            _context.SaveChanges();
            _logger.LogInformation("Profile updated for user ID {UserId}.", userId);
            return Ok("Profile updated successfully.");
        }
    }
}
