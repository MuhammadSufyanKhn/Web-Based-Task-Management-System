using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SprintController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SprintController> _logger;

        public SprintController(AppDbContext context, ILogger<SprintController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllSprints()
        {
            var sprints = await _context.Sprints
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.Status)
                .OrderByDescending(s => s.Status == "Active")
                .ThenByDescending(s => s.Status == "Future")
                .ThenByDescending(s => s.StartDate)
                .ToListAsync();

            var result = sprints.Select(s =>
            {
                var activeTasks = s.Tasks.Where(t => !t.IsDeleted).ToList();
                var completedTasks = activeTasks.Where(t => t.Status != null && t.Status.Category == "Done").ToList();

                return new SprintSummaryDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Goal = s.Goal,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    Status = s.Status,
                    TotalIssues = activeTasks.Count,
                    CompletedIssues = completedTasks.Count,
                    TotalStoryPoints = activeTasks.Sum(t => t.StoryPoints ?? 0),
                    CompletedStoryPoints = completedTasks.Sum(t => t.StoryPoints ?? 0)
                };
            }).ToList();

            return Ok(result);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSprint()
        {
            var activeSprint = await _context.Sprints
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.Status)
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.Priority)
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.IssueType)
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.User)
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.Epic)
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.TaskLabels)
                        .ThenInclude(tl => tl.Label)
                .FirstOrDefaultAsync(s => s.Status == "Active");

            if (activeSprint == null)
            {
                return Ok(null);
            }

            var activeTasks = activeSprint.Tasks.Where(t => !t.IsDeleted).OrderBy(t => t.BacklogOrder).ToList();
            var completedTasks = activeTasks.Where(t => t.Status != null && t.Status.Category == "Done").ToList();

            var issues = activeTasks.Select(t => new BacklogIssueDto
            {
                TaskId = t.TaskId,
                IssueKey = !string.IsNullOrEmpty(t.JiraIssueKey) ? t.JiraIssueKey : $"TASK-{t.TaskId}",
                Title = t.Title,
                Descriptions = t.Descriptions,
                StatusId = t.StatusId,
                StatusName = t.Status?.Name ?? t.TaskStatus,
                StatusDisplayName = t.Status?.DisplayName ?? t.TaskStatus,
                StatusCategory = t.Status?.Category ?? "Todo",
                PriorityName = t.Priority?.Name ?? t.TaskPriority ?? "Medium",
                PriorityColor = t.Priority?.ColorHex ?? "#ffab00",
                IssueTypeName = t.IssueType?.Name ?? "Task",
                IssueTypeIcon = t.IssueType?.Icon ?? "task",
                IssueTypeColor = t.IssueType?.ColorHex ?? "#4a90e2",
                StoryPoints = t.StoryPoints,
                DueDate = t.DueDate,
                UserId = t.UserId,
                UserName = t.User?.UserName ?? "Unassigned",
                UserEmail = t.User?.Email ?? string.Empty,
                BacklogOrder = t.BacklogOrder,
                SprintId = t.SprintId,
                SprintName = activeSprint.Name,
                EpicId = t.EpicId,
                EpicKey = t.Epic?.Key,
                EpicName = t.Epic?.Name,
                EpicColor = t.Epic?.ColorHex,
                Labels = t.TaskLabels.Select(tl => tl.Label.Name).ToList()
            }).ToList();

            return Ok(new SprintSummaryDto
            {
                Id = activeSprint.Id,
                Name = activeSprint.Name,
                Goal = activeSprint.Goal,
                StartDate = activeSprint.StartDate,
                EndDate = activeSprint.EndDate,
                Status = activeSprint.Status,
                TotalIssues = activeTasks.Count,
                CompletedIssues = completedTasks.Count,
                TotalStoryPoints = activeTasks.Sum(t => t.StoryPoints ?? 0),
                CompletedStoryPoints = completedTasks.Sum(t => t.StoryPoints ?? 0),
                Issues = issues
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateSprint([FromBody] CreateSprintDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Sprint name is required." });
            }

            var currentUserId = GetCurrentUserId();

            var sprint = new Sprint
            {
                Name = dto.Name.Trim(),
                Goal = dto.Goal,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = "Future",
                CreatedDate = DateTime.Now,
                CreatedBy = currentUserId
            };

            _context.Sprints.Add(sprint);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Sprint created successfully.", sprintId = sprint.Id });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSprint(int id, [FromBody] UpdateSprintDto dto)
        {
            var sprint = await _context.Sprints.FindAsync(id);
            if (sprint == null) return NotFound(new { message = "Sprint not found." });

            sprint.Name = dto.Name.Trim();
            sprint.Goal = dto.Goal;
            sprint.StartDate = dto.StartDate;
            sprint.EndDate = dto.EndDate;
            sprint.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Sprint updated successfully." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/start")]
        public async Task<IActionResult> StartSprint(int id, [FromBody] StartSprintDto dto)
        {
            var sprint = await _context.Sprints.FindAsync(id);
            if (sprint == null) return NotFound(new { message = "Sprint not found." });

            // Ensure only one sprint is active at a time
            var existingActive = await _context.Sprints.AnyAsync(s => s.Status == "Active" && s.Id != id);
            if (existingActive)
            {
                return BadRequest(new { message = "Another sprint is already active. Complete it before starting a new sprint." });
            }

            sprint.Status = "Active";
            sprint.StartDate = dto.StartDate;
            sprint.EndDate = dto.EndDate;
            if (!string.IsNullOrWhiteSpace(dto.Goal))
            {
                sprint.Goal = dto.Goal;
            }
            sprint.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Sprint {SprintId} started with dates {Start} - {End}", sprint.Id, sprint.StartDate, sprint.EndDate);

            return Ok(new { message = "Sprint started successfully." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteSprint(int id, [FromBody] CompleteSprintDto dto)
        {
            var sprint = await _context.Sprints
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.Status)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sprint == null) return NotFound(new { message = "Sprint not found." });

            var incompleteTasks = sprint.Tasks
                .Where(t => !t.IsDeleted && (t.Status == null || t.Status.Category != "Done"))
                .ToList();

            // Destination for unfinished issues
            int? targetSprintId = null;
            if (dto.MoveUnfinishedToSprintId.HasValue && dto.MoveUnfinishedToSprintId.Value > 0)
            {
                var targetExists = await _context.Sprints.AnyAsync(s => s.Id == dto.MoveUnfinishedToSprintId.Value && s.Status != "Completed");
                if (targetExists)
                {
                    targetSprintId = dto.MoveUnfinishedToSprintId.Value;
                }
            }

            foreach (var task in incompleteTasks)
            {
                task.SprintId = targetSprintId; // Null moves it to Backlog
                task.UpdatedDate = DateTime.Now;
            }

            sprint.Status = "Completed";
            sprint.CompletedDate = DateTime.Now;
            sprint.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Sprint {SprintId} completed. Moved {Count} unfinished issues to sprint {Target}", sprint.Id, incompleteTasks.Count, targetSprintId?.ToString() ?? "Backlog");

            return Ok(new
            {
                message = "Sprint completed successfully.",
                incompleteIssuesMoved = incompleteTasks.Count,
                destination = targetSprintId.HasValue ? $"Sprint {targetSprintId.Value}" : "Backlog"
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSprint(int id)
        {
            var sprint = await _context.Sprints.Include(s => s.Tasks).FirstOrDefaultAsync(s => s.Id == id);
            if (sprint == null) return NotFound(new { message = "Sprint not found." });

            // Move tasks back to Backlog
            foreach (var task in sprint.Tasks)
            {
                task.SprintId = null;
            }

            _context.Sprints.Remove(sprint);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Sprint deleted. Associated issues were moved to the Backlog." });
        }
    }
}
