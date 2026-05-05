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
                PendingCount = query.Count(t => t.TaskStatus == "Pending" && t.IsDeleted == false),
                InProgressCount = query.Count(t => t.TaskStatus == "InProgress" && t.IsDeleted == false),
                CompletedCount = query.Count(t => t.TaskStatus == "Completed" && t.IsDeleted == false)
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
            var tasks = query.Where(c => c.IsDeleted == false).ToList();
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

            task.IsDeleted = true;
            
            _context.TaskItems.Update(task);
            _context.SaveChanges();
            _logger.LogInformation("Task with id {TaskId} deleted by user {UserId} with role {UserRole}", id, userIdclaim, UserRole);
            return Ok("Task deleted successfully.");
        }

        [Authorize]
        [HttpGet("{id}")] 
        public IActionResult GetTaskById(int id)
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var task = _context.TaskItems.Find(id);

            if (task == null) return NotFound("Task not found.");

            if (UserRole != "Admin" && task.CreatedBy != Convert.ToInt32(userIdclaim))
            {
                return Forbid();
            }

            return Ok(task);
        }

        [Authorize]
        [HttpPut("update-task/{id}")]
        public IActionResult UpdateTask(int id, [FromBody] UpdateTaskDto updatedTask)
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

            task.Title = updatedTask.Title;
            task.Descriptions = updatedTask.Descriptions;
            task.TaskStatus = updatedTask.TaskStatus;
            task.TaskPriority = updatedTask.TaskPriority;
            task.DueDate = updatedTask.DueDate;
            task.UpdatedBy = Convert.ToInt32(userIdclaim);
            task.UpdatedDate = DateTime.UtcNow;


            _context.SaveChanges();
            _logger.LogInformation("Task with id {TaskId} updated by user {UserId} with role {UserRole}", id, userIdclaim, UserRole);
            return Ok(task);
        }
        
    }

}
