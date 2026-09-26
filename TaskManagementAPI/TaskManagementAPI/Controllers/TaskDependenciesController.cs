using System;
using System.Collections.Generic;
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
    public class TaskDependenciesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog;

        public TaskDependenciesController(AppDbContext context, IActivityLogService activityLog)
        {
            _context = context;
            _activityLog = activityLog;
        }

        private int GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetTaskDependencies(int taskId)
        {
            var deps = await _context.TaskDependencies
                .Include(d => d.SourceTask)
                .Include(d => d.TargetTask)
                .Include(d => d.Creator)
                .Where(d => (d.SourceTaskId == taskId || d.TargetTaskId == taskId)
                            && !d.SourceTask.IsDeleted && !d.TargetTask.IsDeleted)
                .Select(d => new DependencyDto
                {
                    Id = d.Id,
                    SourceTaskId = d.SourceTaskId,
                    SourceTaskKey = !string.IsNullOrEmpty(d.SourceTask.JiraIssueKey) ? d.SourceTask.JiraIssueKey : $"TASK-{d.SourceTaskId}",
                    SourceTaskTitle = d.SourceTask.Title,
                    TargetTaskId = d.TargetTaskId,
                    TargetTaskKey = !string.IsNullOrEmpty(d.TargetTask.JiraIssueKey) ? d.TargetTask.JiraIssueKey : $"TASK-{d.TargetTaskId}",
                    TargetTaskTitle = d.TargetTask.Title,
                    DependencyType = d.DependencyType,
                    CreatedBy = d.CreatedBy,
                    CreatorName = d.Creator.UserName,
                    CreatedDate = d.CreatedDate
                })
                .ToListAsync();

            return Ok(deps);
        }

        [HttpPost]
        public async Task<IActionResult> AddDependency([FromBody] CreateDependencyDto dto)
        {
            if (dto.SourceTaskId == dto.TargetTaskId)
            {
                return BadRequest(new { message = "A task cannot depend on itself." });
            }

            var sourceExists = await _context.TaskItems.AnyAsync(t => t.TaskId == dto.SourceTaskId && !t.IsDeleted);
            var targetExists = await _context.TaskItems.AnyAsync(t => t.TaskId == dto.TargetTaskId && !t.IsDeleted);

            if (!sourceExists || !targetExists)
            {
                return NotFound(new { message = "Source or target task does not exist." });
            }

            var existing = await _context.TaskDependencies
                .FirstOrDefaultAsync(d => d.SourceTaskId == dto.SourceTaskId && d.TargetTaskId == dto.TargetTaskId);

            if (existing != null)
            {
                return BadRequest(new { message = "This dependency relationship already exists." });
            }

            // Circular dependency detection for "Blocks"
            if (dto.DependencyType == "Blocks")
            {
                var hasCycle = await CheckBlocksCycleAsync(dto.TargetTaskId, dto.SourceTaskId);
                if (hasCycle)
                {
                    return BadRequest(new { message = "Cannot add dependency: This would create a circular blocking loop." });
                }
            }

            var currentUserId = GetCurrentUserId();
            var dep = new TaskDependency
            {
                SourceTaskId = dto.SourceTaskId,
                TargetTaskId = dto.TargetTaskId,
                DependencyType = dto.DependencyType,
                CreatedBy = currentUserId,
                CreatedDate = DateTime.Now
            };

            _context.TaskDependencies.Add(dep);
            await _context.SaveChangesAsync();

            await _activityLog.LogActivityAsync(
                dto.SourceTaskId,
                currentUserId,
                "DependencyAdded",
                "Dependencies",
                null,
                $"TASK-{dto.TargetTaskId}",
                $"Added {dto.DependencyType} dependency to TASK-{dto.TargetTaskId}"
            );

            return Ok(new { message = "Dependency added successfully.", id = dep.Id });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveDependency(int id)
        {
            var dep = await _context.TaskDependencies.FindAsync(id);
            if (dep == null)
            {
                return NotFound(new { message = "Dependency not found." });
            }

            var currentUserId = GetCurrentUserId();
            var sourceId = dep.SourceTaskId;
            var targetId = dep.TargetTaskId;

            _context.TaskDependencies.Remove(dep);
            await _context.SaveChangesAsync();

            await _activityLog.LogActivityAsync(
                sourceId,
                currentUserId,
                "DependencyRemoved",
                "Dependencies",
                $"TASK-{targetId}",
                null,
                $"Removed dependency to TASK-{targetId}"
            );

            return Ok(new { message = "Dependency removed successfully." });
        }

        private async Task<bool> CheckBlocksCycleAsync(int startTaskId, int searchTargetTaskId)
        {
            // BFS traversal of "Blocks" dependencies
            var visited = new HashSet<int>();
            var queue = new Queue<int>();
            queue.Enqueue(startTaskId);

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (current == searchTargetTaskId)
                {
                    return true; // Cycle detected!
                }

                if (!visited.Add(current)) continue;

                var directBlocks = await _context.TaskDependencies
                    .Where(d => d.SourceTaskId == current && d.DependencyType == "Blocks")
                    .Select(d => d.TargetTaskId)
                    .ToListAsync();

                foreach (var next in directBlocks)
                {
                    if (!visited.Contains(next))
                    {
                        queue.Enqueue(next);
                    }
                }
            }

            return false;
        }
    }
}
