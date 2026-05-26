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
        private const string AdminRole = "Admin";
        private readonly AppDbContext _context;
        private readonly ILogger<TaskController> _logger;

        public TaskController(AppDbContext context, ILogger<TaskController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [Authorize(Roles = AdminRole)]
        [HttpGet("AdminStats")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public IActionResult AdminStats()
        {
            var totalUsers = _context.Users.Count(u => !u.IsDeleted && u.UserRole == "User");
            var totalTasks = _context.TaskItems.Count(t => !t.IsDeleted && !t.User.IsDeleted);
            var pendingTasks = _context.TaskItems.Count(t => t.TaskStatus == "Pending" && !t.IsDeleted && !t.User.IsDeleted);
            var inProgressTasks = _context.TaskItems.Count(t => t.TaskStatus == "InProgress" && !t.IsDeleted && !t.User.IsDeleted);
            var completedTasks = _context.TaskItems.Count(t => t.TaskStatus == "Completed" && !t.IsDeleted && !t.User.IsDeleted);
            var stats = new
            {
                TotalUsers = totalUsers,
                TotalTasks = totalTasks,
                PendingTasks = pendingTasks,
                InProgressTasks = inProgressTasks,
                CompletedTasks = completedTasks
            };
            _logger.LogInformation("Admin stats retrieved.");
            return Ok(stats);
        }

        [Authorize(Roles = AdminRole)]
        [HttpGet("AllUsers")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public IActionResult GetAllUsers()
        {
            var users = _context.Users.Where(u => u.UserRole == "User" && !u.IsDeleted ).Select(u => new 
            {
                u.UserId,
                u.UserName,
                u.Email,          
                u.CreatedDate,
                TotalTasks = _context.TaskItems.Count(t => t.UserId == u.UserId && !t.IsDeleted)
            }).ToList();

            _logger.LogInformation("All users retrieved by admin.");
            return Ok(users);
        }

        [Authorize(Roles = AdminRole)]
        [HttpGet("AllTasks")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]

        public IActionResult GetAllTasks()
        {
            var tasks = _context.TaskItems
                .Include(t => t.User)
                .Where(t => !t.IsDeleted && !t.User.IsDeleted )
                .Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.TaskStatus,
                    t.TaskPriority,
                    t.DueDate,
                    t.UserId,
                    UserName = t.User != null ? t.User.UserName : "Unknown",

                    AssignedBy = _context.Users
                        .Where(u => u.UserId == t.CreatedBy)
                        .Select(u => u.UserName)
                        .FirstOrDefault() ?? "Unknown"
                })
                .ToList();

            _logger.LogInformation("All tasks retrieved by admin.");
            return Ok(tasks);
        }



        [Authorize]
        [HttpGet("dashboard-stats")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]

        public IActionResult DashboardStats()
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var query = _context.TaskItems.AsQueryable();

            if (UserRole != AdminRole)
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

            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Dashboard stats retrieved for user {UserId} with role {UserRole}", userIdclaim, UserRole);
            return Ok(stats);
        }

        [Authorize]
        [HttpGet("My-tasks")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]

        public IActionResult MyTask()
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var query = _context.TaskItems.AsQueryable();
            if (UserRole != AdminRole)
            {
                int parsedUserId = Convert.ToInt32(userIdclaim);
                query = query.Where(t => t.UserId == parsedUserId);
            }
            var tasks = query.Where(c => c.IsDeleted == false).ToList();
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Tasks retrieved for user {UserId} with role {UserRole}", userIdclaim, UserRole);

            return Ok(tasks);
        }

        [Authorize(Roles = AdminRole)]
        [HttpGet("user-tasks/{userId}")]
        public IActionResult GetTasksByUserId(int userId)
        {
            var userExists = _context.Users.Any(u => u.UserId == userId && u.IsDeleted == false);
            if (!userExists)
            {
                return NotFound("User not found");
            }

            var tasks = _context.TaskItems
                .Where(t => t.UserId == userId && t.IsDeleted == false)
                .ToList();
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Admin has viewed the task of User {UserId}.", userId);

            return Ok(tasks);
        }


        [Authorize]
        [HttpPost("create-task")]
        public IActionResult CreateTask([FromBody] CreateTaskDto taskDto)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int loggedInUserId = Convert.ToInt32(userIdClaim);

            int assignedUserId = taskDto.UserId > 0 ? taskDto.UserId : loggedInUserId;

            var newTask = new TaskItem
            {
                Title = taskDto.Title,
                Descriptions = taskDto.Descriptions,
                TaskStatus = "Pending",
                UserId = assignedUserId,     
                CreatedDate = DateTime.Now,
                CreatedBy = loggedInUserId, 
                DueDate = taskDto.DueDate,
                TaskPriority = taskDto.TaskPriority ?? "Medium"
            };

            _context.TaskItems.Add(newTask);
            _context.SaveChanges();
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Task '{Title}' created by {Id}", newTask.Title, loggedInUserId);

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
            if (UserRole != AdminRole && task.CreatedBy != Convert.ToInt32(userIdclaim))
            {
                return Forbid("You are not authorized to delete this task.");
            }

            task.IsDeleted = true;
            
            _context.TaskItems.Update(task);
            _context.SaveChanges();

            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Task with id {TaskId} deleted by user {UserId} with role {UserRole}", id, userIdclaim, UserRole);
            return Ok("Task deleted successfully.");
        }

        [Authorize]
        [HttpGet("{id}")] 
        public IActionResult GetTaskById(int id)    
        {
            var userIdclaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var UserRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            int currentUserId = Convert.ToInt32(userIdclaim);

            var task = _context.TaskItems
        .Where(t => t.TaskId == id)
        .Select(t => new
        {
            t.TaskId,
            t.Title,
            t.Descriptions,
            t.TaskStatus,
            t.TaskPriority,
            t.DueDate,
            t.CreatedBy,
            t.UserId
        })
        .FirstOrDefault();

            if (task == null) return NotFound("Task not found.");

            if (UserRole != AdminRole && task.CreatedBy != currentUserId && task.UserId != currentUserId)
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
            int currentUserId = Convert.ToInt32(userIdclaim);

            var task = _context.TaskItems.Find(id);

            if (task == null)
            {
                return NotFound("Task not found.");
            }
            if (UserRole != AdminRole && task.CreatedBy != currentUserId && task.UserId != currentUserId)
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
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Task with id {TaskId} updated by user {UserId} with role {UserRole}", id, userIdclaim, UserRole);

            return Ok(task);
        }


        
    }

}
