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
    public class KanbanController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<KanbanController> _logger;

        public KanbanController(AppDbContext context, ILogger<KanbanController> logger)
        {
            _context = context;
            _logger = logger;
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

        [HttpGet("board")]
        public async Task<IActionResult> GetBoard(
            [FromQuery] int? assigneeId = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? issueType = null,
            [FromQuery] string? label = null,
            [FromQuery] string? search = null,
            [FromQuery] bool onlyMyTasks = false,
            [FromQuery] int? sprintId = null,
            [FromQuery] bool activeSprintOnly = false)
        {
            var currentUserId = GetCurrentUserId();

            // 1. Fetch active columns/statuses ordered by OrderIndex
            var statuses = await _context.ProjectStatuses
                .Where(s => s.IsActive)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync();

            if (!statuses.Any())
            {
                statuses = new List<ProjectStatus>
                {
                    new ProjectStatus { Id = 1, Name = "Pending", DisplayName = "To Do", Category = "Todo", ColorHex = "#42526E", OrderIndex = 1 },
                    new ProjectStatus { Id = 2, Name = "InProgress", DisplayName = "In Progress", Category = "InProgress", ColorHex = "#0052CC", OrderIndex = 2 },
                    new ProjectStatus { Id = 3, Name = "Completed", DisplayName = "Done", Category = "Done", ColorHex = "#36B37E", OrderIndex = 3 }
                };
            }

            // 2. Active Sprint details
            var activeSprint = await _context.Sprints.FirstOrDefaultAsync(s => s.Status == "Active");
            var allSprints = await _context.Sprints
                .Where(s => s.Status != "Completed")
                .OrderByDescending(s => s.Status == "Active")
                .ThenBy(s => s.StartDate)
                .Select(s => new SprintSummaryDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Goal = s.Goal,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    Status = s.Status
                })
                .ToListAsync();

            // 3. Query tasks
            var query = _context.TaskItems
                .Include(t => t.User)
                .Include(t => t.Status)
                .Include(t => t.Priority)
                .Include(t => t.IssueType)
                .Include(t => t.Component)
                .Include(t => t.Sprint)
                .Include(t => t.Epic)
                .Include(t => t.TaskLabels)
                    .ThenInclude(tl => tl.Label)
                .Where(t => !t.IsDeleted && !t.User.IsDeleted);

            // Sprint filtering
            if (activeSprintOnly && activeSprint != null)
            {
                query = query.Where(t => t.SprintId == activeSprint.Id);
            }
            else if (sprintId.HasValue && sprintId.Value > 0)
            {
                query = query.Where(t => t.SprintId == sprintId.Value);
            }

            if (onlyMyTasks)
            {
                query = query.Where(t => t.UserId == currentUserId);
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

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(s) ||
                                         (t.Descriptions != null && t.Descriptions.ToLower().Contains(s)) ||
                                         (t.JiraIssueKey != null && t.JiraIssueKey.ToLower().Contains(s)) ||
                                         (t.Epic != null && t.Epic.Name.ToLower().Contains(s)));
            }

            var tasks = await query.ToListAsync();

            // 4. Populate columns with ordered cards
            var columnDtos = new List<KanbanColumnDto>();
            foreach (var status in statuses)
            {
                var statusTasks = tasks
                    .Where(t => (t.StatusId.HasValue && t.StatusId.Value == status.Id) ||
                                (!t.StatusId.HasValue && string.Equals(t.TaskStatus, status.Name, StringComparison.OrdinalIgnoreCase)))
                    .OrderBy(t => t.BoardOrder)
                    .ThenBy(t => t.TaskId)
                    .Select(t => new KanbanCardDto
                    {
                        TaskId = t.TaskId,
                        IssueKey = !string.IsNullOrEmpty(t.JiraIssueKey) ? t.JiraIssueKey : $"TASK-{t.TaskId}",
                        Title = t.Title,
                        Descriptions = t.Descriptions,
                        StatusName = status.Name,
                        StatusDisplayName = status.DisplayName,
                        StatusId = status.Id,
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
                        BoardOrder = t.BoardOrder,
                        ComponentName = t.Component?.Name,
                        Labels = t.TaskLabels.Select(tl => tl.Label.Name).ToList(),
                        JiraIssueKey = t.JiraIssueKey,
                        JiraIssueUrl = t.JiraIssueUrl,
                        SprintId = t.SprintId,
                        SprintName = t.Sprint?.Name,
                        EpicId = t.EpicId,
                        EpicKey = t.Epic?.Key,
                        EpicName = t.Epic?.Name,
                        EpicColor = t.Epic?.ColorHex
                    })
                    .ToList();

                columnDtos.Add(new KanbanColumnDto
                {
                    Id = status.Id,
                    Name = status.Name,
                    DisplayName = status.DisplayName,
                    Category = status.Category,
                    ColorHex = status.ColorHex,
                    OrderIndex = status.OrderIndex,
                    Cards = statusTasks
                });
            }

            // 5. Fetch filter choices
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

            var priorities = await _context.TaskPriorities
                .Where(p => p.IsActive)
                .OrderBy(p => p.OrderIndex)
                .Select(p => p.Name)
                .ToListAsync();

            var issueTypes = await _context.IssueTypes
                .Where(i => i.IsActive)
                .OrderBy(i => i.OrderIndex)
                .Select(i => i.Name)
                .ToListAsync();

            var labels = await _context.Labels
                .OrderBy(l => l.Name)
                .Select(l => l.Name)
                .ToListAsync();

            return Ok(new KanbanBoardResponseDto
            {
                Columns = columnDtos,
                Members = members,
                Priorities = priorities,
                IssueTypes = issueTypes,
                Labels = labels,
                ActiveSprintId = activeSprint?.Id,
                ActiveSprintName = activeSprint?.Name,
                ActiveSprintGoal = activeSprint?.Goal,
                ActiveSprintEndDate = activeSprint?.EndDate,
                Sprints = allSprints
            });
        }

        [HttpPut("move-card")]
        public async Task<IActionResult> MoveCard([FromBody] MoveCardDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            var task = await _context.TaskItems
                .Include(t => t.Status)
                .FirstOrDefaultAsync(t => t.TaskId == dto.TaskId && !t.IsDeleted);

            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (currentUserRole != "Admin" && task.UserId != currentUserId && task.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            var targetStatus = await _context.ProjectStatuses.FirstOrDefaultAsync(s => s.Id == dto.TargetStatusId);
            if (targetStatus == null)
            {
                return BadRequest(new { message = "Target status does not exist." });
            }

            if (task.StatusId.HasValue && task.StatusId.Value != targetStatus.Id)
            {
                var definedTransitions = await _context.WorkflowTransitions
                    .Where(w => w.FromStatusId == task.StatusId.Value)
                    .ToListAsync();

                if (definedTransitions.Any())
                {
                    var allowed = definedTransitions.Any(w => w.ToStatusId == targetStatus.Id &&
                        (string.IsNullOrEmpty(w.RoleAllowed) || string.Equals(w.RoleAllowed, currentUserRole, StringComparison.OrdinalIgnoreCase)));

                    if (!allowed)
                    {
                        return BadRequest(new { message = $"Workflow rule prohibits moving from {task.Status?.DisplayName ?? "Current"} to {targetStatus.DisplayName}." });
                    }
                }
            }

            task.StatusId = targetStatus.Id;
            task.TaskStatus = targetStatus.Name;
            task.UpdatedDate = DateTime.Now;
            task.UpdatedBy = currentUserId;

            var columnTasks = await _context.TaskItems
                .Where(t => !t.IsDeleted && t.StatusId == targetStatus.Id && t.TaskId != task.TaskId)
                .OrderBy(t => t.BoardOrder)
                .ThenBy(t => t.TaskId)
                .ToListAsync();

            int targetPos = Math.Clamp(dto.TargetPosition, 0, columnTasks.Count);
            columnTasks.Insert(targetPos, task);

            for (int i = 0; i < columnTasks.Count; i++)
            {
                columnTasks[i].BoardOrder = i;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Card moved successfully." });
        }

        [HttpGet("task/{id}")]
        public async Task<IActionResult> GetTaskDetail(int id)
        {
            var task = await _context.TaskItems
                .Include(t => t.User)
                .Include(t => t.Status)
                .Include(t => t.Priority)
                .Include(t => t.IssueType)
                .Include(t => t.Component)
                .Include(t => t.Sprint)
                .Include(t => t.Epic)
                .Include(t => t.TaskLabels)
                    .ThenInclude(tl => tl.Label)
                .FirstOrDefaultAsync(t => t.TaskId == id && !t.IsDeleted);

            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            return Ok(new
            {
                task.TaskId,
                IssueKey = !string.IsNullOrEmpty(task.JiraIssueKey) ? task.JiraIssueKey : $"TASK-{task.TaskId}",
                task.Title,
                task.Descriptions,
                task.StatusId,
                StatusName = task.Status?.Name ?? task.TaskStatus,
                StatusDisplayName = task.Status?.DisplayName ?? task.TaskStatus,
                task.PriorityId,
                PriorityName = task.Priority?.Name ?? task.TaskPriority ?? "Medium",
                PriorityColor = task.Priority?.ColorHex ?? "#ffab00",
                task.IssueTypeId,
                IssueTypeName = task.IssueType?.Name ?? "Task",
                IssueTypeIcon = task.IssueType?.Icon ?? "task",
                IssueTypeColor = task.IssueType?.ColorHex ?? "#4a90e2",
                task.ComponentId,
                ComponentName = task.Component?.Name,
                task.StoryPoints,
                task.DueDate,
                task.UserId,
                AssigneeName = task.User?.UserName,
                task.SprintId,
                SprintName = task.Sprint?.Name,
                task.EpicId,
                EpicKey = task.Epic?.Key,
                EpicName = task.Epic?.Name,
                EpicColor = task.Epic?.ColorHex,
                task.CreatedBy,
                task.CreatedDate,
                task.UpdatedDate,
                Labels = task.TaskLabels.Select(tl => tl.Label.Name).ToList(),
                task.JiraIssueKey,
                task.JiraIssueUrl
            });
        }

        [HttpPut("task/{id}")]
        public async Task<IActionResult> UpdateTaskDetail(int id, [FromBody] UpdateTaskDetailDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            var task = await _context.TaskItems
                .Include(t => t.TaskLabels)
                .FirstOrDefaultAsync(t => t.TaskId == id && !t.IsDeleted);

            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (currentUserRole != "Admin" && task.UserId != currentUserId && task.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            task.Title = dto.Title;
            task.Descriptions = dto.Descriptions;
            task.DueDate = dto.DueDate;
            task.StoryPoints = dto.StoryPoints;
            task.SprintId = dto.SprintId;
            task.EpicId = dto.EpicId;

            if (dto.UserId.HasValue && dto.UserId.Value > 0)
            {
                task.UserId = dto.UserId.Value;
            }

            if (dto.StatusId.HasValue)
            {
                var status = await _context.ProjectStatuses.FindAsync(dto.StatusId.Value);
                if (status != null)
                {
                    task.StatusId = status.Id;
                    task.TaskStatus = status.Name;
                }
            }

            if (dto.PriorityId.HasValue)
            {
                var priority = await _context.TaskPriorities.FindAsync(dto.PriorityId.Value);
                if (priority != null)
                {
                    task.PriorityId = priority.Id;
                    task.TaskPriority = priority.Name;
                }
            }

            if (dto.IssueTypeId.HasValue)
            {
                task.IssueTypeId = dto.IssueTypeId.Value;
            }

            task.ComponentId = dto.ComponentId;
            task.UpdatedDate = DateTime.Now;
            task.UpdatedBy = currentUserId;

            if (dto.Labels != null)
            {
                _context.TaskLabels.RemoveRange(task.TaskLabels);

                foreach (var labelName in dto.Labels)
                {
                    if (string.IsNullOrWhiteSpace(labelName)) continue;
                    var trimmed = labelName.Trim();
                    var labelEntity = await _context.Labels.FirstOrDefaultAsync(l => l.Name.ToLower() == trimmed.ToLower());
                    if (labelEntity == null)
                    {
                        labelEntity = new Label { Name = trimmed, ColorHex = "#6554C0" };
                        _context.Labels.Add(labelEntity);
                        await _context.SaveChangesAsync();
                    }

                    _context.TaskLabels.Add(new TaskLabel { TaskId = task.TaskId, LabelId = labelEntity.Id });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Task updated successfully." });
        }

        [HttpPost("task")]
        public async Task<IActionResult> CreateTask([FromBody] CreateKanbanTaskDto dto)
        {
            var currentUserId = GetCurrentUserId();

            int assignedUserId = dto.UserId.HasValue && dto.UserId.Value > 0 ? dto.UserId.Value : currentUserId;

            ProjectStatus? status = null;
            if (dto.StatusId.HasValue)
            {
                status = await _context.ProjectStatuses.FindAsync(dto.StatusId.Value);
            }
            if (status == null)
            {
                status = await _context.ProjectStatuses.FirstOrDefaultAsync(s => s.IsDefault && s.IsActive)
                         ?? await _context.ProjectStatuses.OrderBy(s => s.OrderIndex).FirstOrDefaultAsync();
            }

            TaskPriority? priority = null;
            if (dto.PriorityId.HasValue)
            {
                priority = await _context.TaskPriorities.FindAsync(dto.PriorityId.Value);
            }
            if (priority == null)
            {
                priority = await _context.TaskPriorities.FirstOrDefaultAsync(p => p.IsDefault && p.IsActive)
                           ?? await _context.TaskPriorities.OrderBy(p => p.OrderIndex).FirstOrDefaultAsync();
            }

            int? issueTypeId = dto.IssueTypeId;
            if (!issueTypeId.HasValue)
            {
                var defaultType = await _context.IssueTypes.FirstOrDefaultAsync(i => i.Name == "Task");
                issueTypeId = defaultType?.Id;
            }

            int nextOrder = 0;
            if (status != null)
            {
                var maxOrder = await _context.TaskItems
                    .Where(t => t.StatusId == status.Id && !t.IsDeleted)
                    .Select(t => (int?)t.BoardOrder)
                    .MaxAsync();
                nextOrder = (maxOrder ?? -1) + 1;
            }

            var newTask = new TaskItem
            {
                Title = dto.Title,
                Descriptions = dto.Descriptions,
                UserId = assignedUserId,
                CreatedBy = currentUserId,
                CreatedDate = DateTime.Now,
                DueDate = dto.DueDate,
                StatusId = status?.Id,
                TaskStatus = status?.Name ?? "Pending",
                PriorityId = priority?.Id,
                TaskPriority = priority?.Name ?? "Medium",
                IssueTypeId = issueTypeId,
                ComponentId = dto.ComponentId,
                StoryPoints = dto.StoryPoints,
                BoardOrder = nextOrder,
                SprintId = dto.SprintId,
                EpicId = dto.EpicId,
                IsDeleted = false
            };

            _context.TaskItems.Add(newTask);
            await _context.SaveChangesAsync();

            newTask.JiraIssueKey = $"TASK-{newTask.TaskId}";

            if (dto.Labels != null && dto.Labels.Any())
            {
                foreach (var labelName in dto.Labels)
                {
                    if (string.IsNullOrWhiteSpace(labelName)) continue;
                    var trimmed = labelName.Trim();
                    var labelEntity = await _context.Labels.FirstOrDefaultAsync(l => l.Name.ToLower() == trimmed.ToLower());
                    if (labelEntity == null)
                    {
                        labelEntity = new Label { Name = trimmed, ColorHex = "#6554C0" };
                        _context.Labels.Add(labelEntity);
                        await _context.SaveChangesAsync();
                    }

                    _context.TaskLabels.Add(new TaskLabel { TaskId = newTask.TaskId, LabelId = labelEntity.Id });
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Task created successfully.", taskId = newTask.TaskId, issueKey = newTask.JiraIssueKey });
        }
    }
}
