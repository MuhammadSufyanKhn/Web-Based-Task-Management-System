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
    public class BacklogController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<BacklogController> _logger;

        public BacklogController(AppDbContext context, ILogger<BacklogController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetBacklogView(
            [FromQuery] string? search = null,
            [FromQuery] int? assigneeId = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? issueType = null,
            [FromQuery] string? label = null,
            [FromQuery] int? componentId = null,
            [FromQuery] int? epicId = null)
        {
            // 1. Base query for non-deleted tasks
            var query = _context.TaskItems
                .Include(t => t.User)
                .Include(t => t.Status)
                .Include(t => t.Priority)
                .Include(t => t.IssueType)
                .Include(t => t.Component)
                .Include(t => t.Epic)
                .Include(t => t.Sprint)
                .Include(t => t.Subtasks)
                .Include(t => t.TaskLabels)
                    .ThenInclude(tl => tl.Label)
                .Where(t => !t.IsDeleted && !t.User.IsDeleted);

            // Filters
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(s) ||
                                         (t.Descriptions != null && t.Descriptions.ToLower().Contains(s)) ||
                                         (t.JiraIssueKey != null && t.JiraIssueKey.ToLower().Contains(s)));
            }

            if (assigneeId.HasValue && assigneeId.Value > 0)
            {
                query = query.Where(t => t.UserId == assigneeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(priority) && priority != "All")
            {
                query = query.Where(t => (t.Priority != null && t.Priority.Name == priority) || t.TaskPriority == priority);
            }

            if (!string.IsNullOrWhiteSpace(issueType) && issueType != "All")
            {
                query = query.Where(t => t.IssueType != null && t.IssueType.Name == issueType);
            }

            if (!string.IsNullOrWhiteSpace(label) && label != "All")
            {
                query = query.Where(t => t.TaskLabels.Any(tl => tl.Label.Name == label));
            }

            if (componentId.HasValue && componentId.Value > 0)
            {
                query = query.Where(t => t.ComponentId == componentId.Value);
            }

            if (epicId.HasValue && epicId.Value > 0)
            {
                query = query.Where(t => t.EpicId == epicId.Value);
            }

            var allMatchingTasks = await query.ToListAsync();

            Func<TaskItem, BacklogIssueDto> mapToDto = t => new BacklogIssueDto
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
                SprintName = t.Sprint?.Name,
                EpicId = t.EpicId,
                EpicKey = t.Epic?.Key,
                EpicName = t.Epic?.Name,
                EpicColor = t.Epic?.ColorHex,
                ComponentName = t.Component?.Name,
                Labels = t.TaskLabels.Select(tl => tl.Label.Name).ToList(),
                ParentTaskId = t.ParentTaskId,
                SubtasksCount = t.Subtasks.Count(st => !st.IsDeleted),
                OriginalEstimateMinutes = t.OriginalEstimateMinutes,
                RemainingEstimateMinutes = t.RemainingEstimateMinutes,
                TimeSpentMinutes = t.TimeSpentMinutes
            };

            // 2. Fetch Sprints
            var sprints = await _context.Sprints
                .Where(s => s.Status != "Completed")
                .OrderByDescending(s => s.Status == "Active")
                .ThenBy(s => s.StartDate)
                .ToListAsync();

            SprintSummaryDto? activeSprintDto = null;
            var futureSprintDtos = new List<SprintSummaryDto>();

            foreach (var sprint in sprints)
            {
                var sprintTasks = allMatchingTasks
                    .Where(t => t.SprintId == sprint.Id)
                    .OrderBy(t => t.BacklogOrder)
                    .ThenBy(t => t.TaskId)
                    .Select(mapToDto)
                    .ToList();

                var completedCount = sprintTasks.Count(t => t.StatusCategory == "Done");
                var totalPts = sprintTasks.Sum(t => t.StoryPoints ?? 0);
                var completedPts = sprintTasks.Where(t => t.StatusCategory == "Done").Sum(t => t.StoryPoints ?? 0);

                var sDto = new SprintSummaryDto
                {
                    Id = sprint.Id,
                    Name = sprint.Name,
                    Goal = sprint.Goal,
                    StartDate = sprint.StartDate,
                    EndDate = sprint.EndDate,
                    Status = sprint.Status,
                    TotalIssues = sprintTasks.Count,
                    CompletedIssues = completedCount,
                    TotalStoryPoints = totalPts,
                    CompletedStoryPoints = completedPts,
                    Issues = sprintTasks
                };

                if (sprint.Status == "Active")
                {
                    activeSprintDto = sDto;
                }
                else
                {
                    futureSprintDtos.Add(sDto);
                }
            }

            // 3. Backlog Issues (SprintId == null)
            var backlogIssues = allMatchingTasks
                .Where(t => t.SprintId == null)
                .OrderBy(t => t.BacklogOrder)
                .ThenBy(t => t.TaskId)
                .Select(mapToDto)
                .ToList();

            // 4. Epics with overall task stats (unfiltered by query to show real progress)
            var epics = await _context.Epics
                .Include(e => e.Tasks)
                    .ThenInclude(t => t.Status)
                .OrderBy(e => e.Id)
                .ToListAsync();

            var epicDtos = epics.Select(e =>
            {
                var tasks = e.Tasks.Where(t => !t.IsDeleted).ToList();
                var done = tasks.Where(t => t.Status != null && t.Status.Category == "Done").ToList();

                return new EpicSummaryDto
                {
                    Id = e.Id,
                    Key = e.Key,
                    Name = e.Name,
                    Summary = e.Summary,
                    ColorHex = e.ColorHex,
                    Status = e.Status,
                    StartDate = e.StartDate,
                    DueDate = e.DueDate,
                    TotalIssues = tasks.Count,
                    CompletedIssues = done.Count,
                    TotalStoryPoints = tasks.Sum(t => t.StoryPoints ?? 0)
                };
            }).ToList();

            // 5. Filter lists
            var members = await _context.Users
                .Where(u => !u.IsDeleted)
                .Select(u => new ProjectMemberDto
                {
                    UserId = u.UserId,
                    UserName = u.UserName,
                    Email = u.Email,
                    Role = u.UserRole
                })
                .ToListAsync();

            var priorities = await _context.TaskPriorities.Where(p => p.IsActive).OrderBy(p => p.OrderIndex).Select(p => p.Name).ToListAsync();
            var issueTypes = await _context.IssueTypes.Where(i => i.IsActive).OrderBy(i => i.OrderIndex).Select(i => i.Name).ToListAsync();
            var labels = await _context.Labels.OrderBy(l => l.Name).Select(l => l.Name).ToListAsync();
            var components = await _context.ProjectComponents.Where(c => c.IsActive).OrderBy(c => c.Name).Select(c => c.Name).ToListAsync();

            return Ok(new BacklogViewDto
            {
                ActiveSprint = activeSprintDto,
                FutureSprints = futureSprintDtos,
                BacklogIssues = backlogIssues,
                Epics = epicDtos,
                Members = members,
                Priorities = priorities,
                IssueTypes = issueTypes,
                Labels = labels,
                Components = components
            });
        }

        private int GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private string GetCurrentUserRole()
        {
            return User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value ?? "User";
        }

        [HttpPut("move-issue")]
        public async Task<IActionResult> MoveIssue([FromBody] MoveIssueSprintDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            var task = await _context.TaskItems.FindAsync(dto.TaskId);
            if (task == null) return NotFound(new { message = "Issue not found." });

            if (currentUserRole != "Admin" && task.UserId != currentUserId && task.CreatedBy != currentUserId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { 
                    message = "Only the task owner or an administrator can move this task." 
                });
            }

            if (dto.TargetSprintId.HasValue && dto.TargetSprintId.Value > 0)
            {
                var sprintExists = await _context.Sprints.AnyAsync(s => s.Id == dto.TargetSprintId.Value);
                if (!sprintExists) return BadRequest(new { message = "Target sprint does not exist." });
                task.SprintId = dto.TargetSprintId.Value;
            }
            else
            {
                task.SprintId = null; // Move to Backlog
            }

            // Re-index target container
            var targetTasks = await _context.TaskItems
                .Where(t => !t.IsDeleted && t.SprintId == task.SprintId && t.TaskId != task.TaskId)
                .OrderBy(t => t.BacklogOrder)
                .ThenBy(t => t.TaskId)
                .ToListAsync();

            int targetPos = Math.Clamp(dto.TargetPosition, 0, targetTasks.Count);
            targetTasks.Insert(targetPos, task);

            for (int i = 0; i < targetTasks.Count; i++)
            {
                targetTasks[i].BacklogOrder = i;
            }

            task.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Issue moved successfully." });
        }
    }
}
