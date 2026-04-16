using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagerAPI.Controllers;
using TaskManagerAPI.Helpers;
using System.Security.Claims;
using TaskManagerAPI.Models;
using TaskManagementAPI.Models.DTOS;

namespace TaskManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskController : ControllerBase

    {
        private readonly AppDbContext _context;
        private readonly ILogger<TaskController> _logger;
        private readonly JwtService _jwtService;

        public TaskController(AppDbContext context, ILogger<TaskController> logger, JwtService _jwtservice)
        {
            _context = context;
            _logger = logger;
            _jwtService = _jwtservice;
        }

        [Authorize]
        [HttpGet("dashboard-stats")]
        public IActionResult DashboardStats()
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var query = _context.TaskItems.AsQueryable();

            if (UserRole != "Admin")
            {
                int parsedUserId = Convert.ToInt32(userIdclaim);
                query = query.Where(t => t.UserId == parsedUserId);
            }
            var stats = new
            {
                PendingCount = query.Count(t => t.TaskStatus == "Pending"),
                InProgressCount = query.Count(t => t.TaskStatus == "InProgress"),
                CompletedCount = query.Count(t => t.TaskStatus == "Completed")
            };

            _logger.LogInformation("Dashboard stats retrieved for user {UserId} with role {UserRole}", userIdclaim, UserRole);
            return Ok(stats);
        }

        [Authorize]
        [HttpGet("My-tasks")]
        public IActionResult MyTask()
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var query = _context.TaskItems.AsQueryable();
            if (UserRole != "Admin")
            {
                int parsedUserId = Convert.ToInt32(userIdclaim);
                query = query.Where(t => t.UserId == parsedUserId);
            }
            var tasks = query.ToList();
            _logger.LogInformation("Tasks retrieved for user {UserId} with role {UserRole}", userIdclaim, UserRole);
            return Ok(tasks);
        }
        [Authorize]
        [HttpPost("create-task")]
        public IActionResult CreateTask([FromBody] CreateTaskDto taskDto)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = Convert.ToInt32(userIdClaim);

            var newTask = new TaskItem // Apne model ka naam check kar lena
            {
                Title = taskDto.Title,
                Descriptions = taskDto.Descriptions,
                TaskStatus = "Pending", // Default status
                UserId = userId,
                CreatedDate = DateTime.Now,
                CreatedBy = userId,
                DueDate = taskDto.DueDate,
                TaskPriority = taskDto.TaskPriority ?? "Medium"
            };

            _context.TaskItems.Add(newTask);
            _context.SaveChanges();

            _logger.LogInformation("Task '{Title}' created by User {Id}", newTask.Title, userId);
            return Ok(new { message = "Task Created Successfully!", task = newTask });
        }

        [Authorize]
        [HttpDelete("delete-task/{id}")]
        public IActionResult DeleteTask(int id)
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var task = _context.TaskItems.Find(id);
            if (task == null)
            {
                return NotFound("Task not found.");
            }
            if (UserRole != "Admin" && task.CreatedBy != Convert.ToInt32(userIdclaim))
            {
                return Forbid("You are not authorized to delete this task.");
            }
            var deletedTask = new TaskItem
            {
                TaskId = task.TaskId,
                Title = task.Title,
                Descriptions = task.Descriptions,
                TaskStatus = task.TaskStatus,
                TaskPriority = task.TaskPriority,
                DueDate = task.DueDate,
                CreatedBy = task.CreatedBy,
                CreatedDate = task.CreatedDate,
                IsDeleted = true
            };
            _context.TaskItems.Remove(task);
            _context.SaveChanges();
            _logger.LogInformation("Task with id {TaskId} deleted by user {UserId} with role {UserRole}", id, userIdclaim, UserRole);
            return Ok("Task deleted successfully.");
        }

        [Authorize]
        [HttpPut("update-task/{id}")]
        public IActionResult UpdateTask(int id, [FromBody] TaskItem updatedTask)
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var task = _context.TaskItems.Find(id);

            if (task == null)
            {
                return NotFound("Task not found.");
            }
            if (UserRole != "Admin" && task.CreatedBy != Convert.ToInt32(userIdclaim))
            {
                return Forbid("You are not authorized to update this task.");
            }
            var oldTask = new TaskItem
            {
                TaskId = updatedTask.TaskId,
                Title = updatedTask.Title,
                Descriptions = updatedTask.Descriptions,
                TaskStatus = updatedTask.TaskStatus,
                TaskPriority = updatedTask.TaskPriority,
                DueDate = updatedTask.DueDate,
                UpdatedBy = Convert.ToInt32(userIdclaim),
                UpdatedDate = DateTime.UtcNow
            };
            
            _context.SaveChanges();
            _logger.LogInformation("Task with id {TaskId} updated by user {UserId} with role {UserRole}", id, userIdclaim, UserRole);
            return Ok(task);
        }
        
    }

}
