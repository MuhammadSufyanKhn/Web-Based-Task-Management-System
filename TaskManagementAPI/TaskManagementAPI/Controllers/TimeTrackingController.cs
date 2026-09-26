using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagementAPI.Services;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TimeTrackingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog;

        public TimeTrackingController(AppDbContext context, IActivityLogService activityLog)
        {
            _context = context;
            _activityLog = activityLog;
        }

        private int GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }

        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetTaskTimeTracking(int taskId)
        {
            var task = await _context.TaskItems
                .Include(t => t.TaskTimeLogs)
                    .ThenInclude(ttl => ttl.User)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && !t.IsDeleted);

            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            var logs = task.TaskTimeLogs
                .OrderByDescending(l => l.LoggedAt)
                .Select(l => new TimeLogDto
                {
                    Id = l.Id,
                    TaskId = l.TaskId,
                    UserId = l.UserId,
                    UserName = l.User?.UserName ?? "Unknown",
                    TimeSpentMinutes = l.TimeSpentMinutes,
                    RemainingEstimateMinutes = l.RemainingEstimateMinutes,
                    Description = l.Description,
                    LoggedAt = l.LoggedAt,
                    CreatedDate = l.CreatedDate
                }).ToList();

            var summary = new TaskTimeSummaryDto
            {
                TaskId = task.TaskId,
                OriginalEstimateMinutes = task.OriginalEstimateMinutes,
                RemainingEstimateMinutes = task.RemainingEstimateMinutes,
                TimeSpentMinutes = task.TimeSpentMinutes,
                Logs = logs
            };

            return Ok(summary);
        }

        [HttpPost("log")]
        public async Task<IActionResult> LogWork([FromBody] LogWorkDto dto)
        {
            if (dto.TimeSpentMinutes <= 0)
            {
                return BadRequest(new { message = "Time spent must be greater than 0 minutes." });
            }

            var task = await _context.TaskItems.FirstOrDefaultAsync(t => t.TaskId == dto.TaskId && !t.IsDeleted);
            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            var currentUserId = GetCurrentUserId();

            // Permission rule: user can log on their own task, or admin on any task
            if (!IsAdmin() && task.UserId != currentUserId)
            {
                return StatusCode(403, new { message = "You can only log time on your own assigned tasks." });
            }

            var log = new TaskTimeLog
            {
                TaskId = dto.TaskId,
                UserId = currentUserId,
                TimeSpentMinutes = dto.TimeSpentMinutes,
                RemainingEstimateMinutes = dto.RemainingEstimateMinutes,
                Description = dto.Description?.Trim(),
                LoggedAt = dto.LoggedAt ?? DateTime.Now,
                CreatedDate = DateTime.Now
            };

            _context.TaskTimeLogs.Add(log);

            // Update Task spent minutes
            task.TimeSpentMinutes += dto.TimeSpentMinutes;

            // If user supplied new remaining estimate, update task
            if (dto.RemainingEstimateMinutes.HasValue)
            {
                task.RemainingEstimateMinutes = Math.Max(0, dto.RemainingEstimateMinutes.Value);
            }
            else if (task.RemainingEstimateMinutes.HasValue)
            {
                task.RemainingEstimateMinutes = Math.Max(0, task.RemainingEstimateMinutes.Value - dto.TimeSpentMinutes);
            }

            await _context.SaveChangesAsync();

            // Record audit log
            var hoursSpent = Math.Round((double)dto.TimeSpentMinutes / 60.0, 1);
            await _activityLog.LogActivityAsync(
                task.TaskId,
                currentUserId,
                "TimeLogged",
                "TimeSpentMinutes",
                null,
                $"{hoursSpent}h",
                dto.Description ?? "Work logged"
            );

            return Ok(new
            {
                message = "Work logged successfully.",
                logId = log.Id,
                totalTimeSpent = task.TimeSpentMinutes,
                remainingEstimate = task.RemainingEstimateMinutes
            });
        }

        [HttpPut("task/{taskId}/estimates")]
        public async Task<IActionResult> UpdateEstimates(int taskId, [FromBody] UpdateEstimatesDto dto)
        {
            var task = await _context.TaskItems.FirstOrDefaultAsync(t => t.TaskId == taskId && !t.IsDeleted);
            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            var currentUserId = GetCurrentUserId();
            if (!IsAdmin() && task.UserId != currentUserId)
            {
                return StatusCode(403, new { message = "You can only adjust estimates on your own assigned tasks." });
            }

            if (dto.OriginalEstimateMinutes.HasValue && dto.OriginalEstimateMinutes.Value < 0)
            {
                return BadRequest(new { message = "Original estimate cannot be negative." });
            }

            if (dto.RemainingEstimateMinutes.HasValue && dto.RemainingEstimateMinutes.Value < 0)
            {
                return BadRequest(new { message = "Remaining estimate cannot be negative." });
            }

            var oldOriginal = task.OriginalEstimateMinutes;
            var oldRemaining = task.RemainingEstimateMinutes;

            task.OriginalEstimateMinutes = dto.OriginalEstimateMinutes;
            task.RemainingEstimateMinutes = dto.RemainingEstimateMinutes;

            await _context.SaveChangesAsync();

            await _activityLog.LogActivityAsync(
                task.TaskId,
                currentUserId,
                "EstimateUpdated",
                "RemainingEstimateMinutes",
                $"{oldRemaining}m",
                $"{task.RemainingEstimateMinutes}m",
                $"Estimates updated by user"
            );

            return Ok(new
            {
                message = "Estimates updated successfully.",
                originalEstimate = task.OriginalEstimateMinutes,
                remainingEstimate = task.RemainingEstimateMinutes
            });
        }

        [HttpDelete("log/{id}")]
        public async Task<IActionResult> DeleteTimeLog(int id)
        {
            var log = await _context.TaskTimeLogs
                .Include(l => l.Task)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (log == null)
            {
                return NotFound(new { message = "Time log not found." });
            }

            var currentUserId = GetCurrentUserId();
            if (!IsAdmin() && log.UserId != currentUserId)
            {
                return StatusCode(403, new { message = "You can only delete your own time logs." });
            }

            var task = log.Task;
            if (task != null)
            {
                task.TimeSpentMinutes = Math.Max(0, task.TimeSpentMinutes - log.TimeSpentMinutes);
            }

            _context.TaskTimeLogs.Remove(log);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Time log deleted successfully." });
        }
    }
}
