using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(AppDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var tasks = await _context.TaskItems
                .Include(t => t.Status)
                .Include(t => t.Sprint)
                .Where(t => !t.IsDeleted)
                .ToListAsync();

            int totalIssues = tasks.Count;
            int completedIssues = tasks.Count(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed");
            int inProgressIssues = tasks.Count(t => (t.Status != null && t.Status.Category == "InProgress") || t.TaskStatus == "InProgress" || t.TaskStatus == "In Progress");
            int todoIssues = tasks.Count(t => (t.Status != null && t.Status.Category == "Todo") || t.TaskStatus == "Pending");
            int backlogIssues = tasks.Count(t => t.SprintId == null);

            var now = DateTime.Now;
            int overdueIssues = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now &&
                (t.Status == null || t.Status.Category != "Done") && t.TaskStatus != "Completed");

            int totalStoryPoints = tasks.Sum(t => t.StoryPoints ?? 0);
            int completedStoryPoints = tasks
                .Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed")
                .Sum(t => t.StoryPoints ?? 0);
            int remainingStoryPoints = Math.Max(0, totalStoryPoints - completedStoryPoints);
            double completionPct = totalStoryPoints > 0
                ? Math.Round((double)completedStoryPoints / totalStoryPoints * 100, 1)
                : (totalIssues > 0 ? Math.Round((double)completedIssues / totalIssues * 100, 1) : 0);

            // Active Sprint Summary
            var activeSprintEntity = await _context.Sprints
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.Status)
                .FirstOrDefaultAsync(s => s.Status == "Active");

            ActiveSprintReportSummaryDto? activeSprintDto = null;
            if (activeSprintEntity != null)
            {
                var sprintTasks = activeSprintEntity.Tasks.Where(t => !t.IsDeleted).ToList();
                int sTotalIssues = sprintTasks.Count;
                int sCompletedIssues = sprintTasks.Count(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed");
                int sTotalPts = sprintTasks.Sum(t => t.StoryPoints ?? 0);
                int sCompletedPts = sprintTasks
                    .Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed")
                    .Sum(t => t.StoryPoints ?? 0);
                int sRemainingPts = Math.Max(0, sTotalPts - sCompletedPts);

                int daysRemaining = 0;
                if (activeSprintEntity.EndDate.HasValue)
                {
                    var span = activeSprintEntity.EndDate.Value - now;
                    daysRemaining = Math.Max(0, (int)Math.Ceiling(span.TotalDays));
                }

                activeSprintDto = new ActiveSprintReportSummaryDto
                {
                    SprintId = activeSprintEntity.Id,
                    Name = activeSprintEntity.Name,
                    Goal = activeSprintEntity.Goal,
                    StartDate = activeSprintEntity.StartDate,
                    EndDate = activeSprintEntity.EndDate,
                    TotalIssues = sTotalIssues,
                    CompletedIssues = sCompletedIssues,
                    TotalStoryPoints = sTotalPts,
                    CompletedStoryPoints = sCompletedPts,
                    RemainingStoryPoints = sRemainingPts,
                    CompletionPercentage = sTotalPts > 0
                        ? Math.Round((double)sCompletedPts / sTotalPts * 100, 1)
                        : (sTotalIssues > 0 ? Math.Round((double)sCompletedIssues / sTotalIssues * 100, 1) : 0),
                    DaysRemaining = daysRemaining
                };
            }

            // Epic Progress List
            var epics = await _context.Epics
                .Include(e => e.Tasks)
                    .ThenInclude(t => t.Status)
                .ToListAsync();

            var epicDtos = epics.Select(e =>
            {
                var eTasks = e.Tasks.Where(t => !t.IsDeleted).ToList();
                int eTotalIssues = eTasks.Count;
                int eCompletedIssues = eTasks.Count(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed");
                int eTotalPts = eTasks.Sum(t => t.StoryPoints ?? 0);
                int eCompletedPts = eTasks
                    .Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed")
                    .Sum(t => t.StoryPoints ?? 0);

                return new EpicProgressReportDto
                {
                    EpicId = e.Id,
                    Key = e.Key,
                    Name = e.Name,
                    Summary = e.Summary,
                    ColorHex = e.ColorHex,
                    Status = e.Status,
                    TotalIssues = eTotalIssues,
                    CompletedIssues = eCompletedIssues,
                    TotalStoryPoints = eTotalPts,
                    CompletedStoryPoints = eCompletedPts,
                    CompletionPercentage = eTotalPts > 0
                        ? Math.Round((double)eCompletedPts / eTotalPts * 100, 1)
                        : (eTotalIssues > 0 ? Math.Round((double)eCompletedIssues / eTotalIssues * 100, 1) : 0)
                };
            }).ToList();

            var summary = new ProjectDashboardSummaryDto
            {
                TotalIssues = totalIssues,
                CompletedIssues = completedIssues,
                InProgressIssues = inProgressIssues,
                TodoIssues = todoIssues,
                BacklogIssues = backlogIssues,
                OverdueIssues = overdueIssues,
                TotalStoryPoints = totalStoryPoints,
                CompletedStoryPoints = completedStoryPoints,
                RemainingStoryPoints = remainingStoryPoints,
                CompletionPercentage = completionPct,
                ActiveSprint = activeSprintDto,
                EpicProgress = epicDtos
            };

            return Ok(summary);
        }

        [HttpGet("breakdowns")]
        public async Task<IActionResult> GetReportBreakdowns()
        {
            var tasks = await _context.TaskItems
                .Include(t => t.Status)
                .Include(t => t.Priority)
                .Include(t => t.IssueType)
                .Include(t => t.User)
                .Where(t => !t.IsDeleted)
                .ToListAsync();

            int totalIssues = tasks.Count;

            // 1. By Status
            var statuses = await _context.ProjectStatuses.OrderBy(s => s.OrderIndex).ToListAsync();
            var byStatus = new List<StatusBreakdownItemDto>();
            foreach (var status in statuses)
            {
                var matchingTasks = tasks.Where(t => t.StatusId == status.Id || (t.StatusId == null && t.TaskStatus == status.Name)).ToList();
                byStatus.Add(new StatusBreakdownItemDto
                {
                    StatusId = status.Id,
                    Name = status.Name,
                    DisplayName = status.DisplayName,
                    Category = status.Category,
                    ColorHex = status.ColorHex,
                    Count = matchingTasks.Count,
                    Percentage = totalIssues > 0 ? Math.Round((double)matchingTasks.Count / totalIssues * 100, 1) : 0,
                    StoryPoints = matchingTasks.Sum(t => t.StoryPoints ?? 0)
                });
            }

            // 2. By Priority
            var priorities = await _context.TaskPriorities.OrderBy(p => p.OrderIndex).ToListAsync();
            var byPriority = new List<PriorityBreakdownItemDto>();
            foreach (var p in priorities)
            {
                var matchingTasks = tasks.Where(t => t.PriorityId == p.Id || (t.PriorityId == null && t.TaskPriority == p.Name)).ToList();
                byPriority.Add(new PriorityBreakdownItemDto
                {
                    PriorityId = p.Id,
                    Name = p.Name,
                    ColorHex = p.ColorHex,
                    Count = matchingTasks.Count,
                    Percentage = totalIssues > 0 ? Math.Round((double)matchingTasks.Count / totalIssues * 100, 1) : 0,
                    StoryPoints = matchingTasks.Sum(t => t.StoryPoints ?? 0)
                });
            }

            // 3. By Assignee
            var users = await _context.Users.Where(u => !u.IsDeleted).ToListAsync();
            var byAssignee = new List<AssigneeBreakdownItemDto>();

            foreach (var user in users)
            {
                var userTasks = tasks.Where(t => t.UserId == user.UserId).ToList();
                int uTotalPts = userTasks.Sum(t => t.StoryPoints ?? 0);
                int uDonePts = userTasks.Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed").Sum(t => t.StoryPoints ?? 0);
                int uDoneIssues = userTasks.Count(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed");

                byAssignee.Add(new AssigneeBreakdownItemDto
                {
                    UserId = user.UserId,
                    UserName = user.UserName,
                    Email = user.Email,
                    TotalIssues = userTasks.Count,
                    CompletedIssues = uDoneIssues,
                    TotalStoryPoints = uTotalPts,
                    CompletedStoryPoints = uDonePts,
                    CompletionPercentage = userTasks.Count > 0 ? Math.Round((double)uDoneIssues / userTasks.Count * 100, 1) : 0
                });
            }

            // Also check for unassigned
            var unassignedTasks = tasks.Where(t => t.UserId == 0).ToList();
            if (unassignedTasks.Any())
            {
                byAssignee.Add(new AssigneeBreakdownItemDto
                {
                    UserId = 0,
                    UserName = "Unassigned",
                    Email = string.Empty,
                    TotalIssues = unassignedTasks.Count,
                    CompletedIssues = unassignedTasks.Count(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed"),
                    TotalStoryPoints = unassignedTasks.Sum(t => t.StoryPoints ?? 0),
                    CompletedStoryPoints = unassignedTasks.Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed").Sum(t => t.StoryPoints ?? 0),
                    CompletionPercentage = 0
                });
            }

            // 4. By Issue Type
            var issueTypes = await _context.IssueTypes.OrderBy(i => i.OrderIndex).ToListAsync();
            var byIssueType = new List<IssueTypeBreakdownItemDto>();
            foreach (var it in issueTypes)
            {
                var matchingTasks = tasks.Where(t => t.IssueTypeId == it.Id || (t.IssueTypeId == null && it.Name == "Task")).ToList();
                byIssueType.Add(new IssueTypeBreakdownItemDto
                {
                    IssueTypeId = it.Id,
                    Name = it.Name,
                    Icon = it.Icon,
                    ColorHex = it.ColorHex,
                    Count = matchingTasks.Count,
                    Percentage = totalIssues > 0 ? Math.Round((double)matchingTasks.Count / totalIssues * 100, 1) : 0
                });
            }

            // 5. Overdue Issues List
            var now = DateTime.Now;
            var overdueList = tasks
                .Where(t => t.DueDate.HasValue && t.DueDate.Value < now &&
                    (t.Status == null || t.Status.Category != "Done") && t.TaskStatus != "Completed")
                .OrderBy(t => t.DueDate)
                .Select(t => new OverdueIssueItemDto
                {
                    TaskId = t.TaskId,
                    IssueKey = !string.IsNullOrEmpty(t.JiraIssueKey) ? t.JiraIssueKey : $"TASK-{t.TaskId}",
                    Title = t.Title,
                    DueDate = t.DueDate!.Value,
                    DaysOverdue = Math.Max(1, (int)(now.Date - t.DueDate.Value.Date).TotalDays),
                    PriorityName = t.Priority?.Name ?? t.TaskPriority ?? "Medium",
                    PriorityColor = t.Priority?.ColorHex ?? "#ffab00",
                    StatusName = t.Status?.DisplayName ?? t.TaskStatus,
                    AssigneeName = t.User?.UserName ?? "Unassigned",
                    StoryPoints = t.StoryPoints
                })
                .ToList();

            var breakdowns = new ReportBreakdownsDto
            {
                ByStatus = byStatus,
                ByPriority = byPriority,
                ByAssignee = byAssignee,
                ByIssueType = byIssueType,
                OverdueIssues = overdueList
            };

            return Ok(breakdowns);
        }

        [HttpGet("sprint-burndown")]
        public async Task<IActionResult> GetSprintBurndown([FromQuery] int? sprintId)
        {
            Sprint? sprint = null;
            if (sprintId.HasValue && sprintId.Value > 0)
            {
                sprint = await _context.Sprints
                    .Include(s => s.Tasks)
                        .ThenInclude(t => t.Status)
                    .FirstOrDefaultAsync(s => s.Id == sprintId.Value);
            }
            else
            {
                sprint = await _context.Sprints
                    .Include(s => s.Tasks)
                        .ThenInclude(t => t.Status)
                    .FirstOrDefaultAsync(s => s.Status == "Active")
                    ?? await _context.Sprints
                        .Include(s => s.Tasks)
                            .ThenInclude(t => t.Status)
                        .OrderByDescending(s => s.CompletedDate ?? s.StartDate)
                        .FirstOrDefaultAsync(s => s.Status == "Completed");
            }

            if (sprint == null)
            {
                return Ok(new SprintBurndownDto
                {
                    SprintId = 0,
                    SprintName = "No Sprints Available",
                    SprintGoal = "Create a sprint in Backlog to see burndown charts.",
                    Status = "None",
                    StartDate = DateTime.Now,
                    EndDate = DateTime.Now.AddDays(14),
                    TotalStoryPoints = 0,
                    CompletedStoryPoints = 0,
                    RemainingStoryPoints = 0,
                    DataPoints = new List<BurndownDayPointDto>()
                });
            }

            var tasks = sprint.Tasks.Where(t => !t.IsDeleted).ToList();
            int totalPts = tasks.Sum(t => t.StoryPoints ?? 0);
            int completedPts = tasks
                .Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed")
                .Sum(t => t.StoryPoints ?? 0);
            int remainingPts = Math.Max(0, totalPts - completedPts);

            var start = (sprint.StartDate ?? sprint.CreatedDate).Date;
            var end = (sprint.EndDate ?? start.AddDays(14)).Date;
            if (end <= start) end = start.AddDays(14);

            int totalDays = (int)(end - start).TotalDays;
            if (totalDays <= 0) totalDays = 14;

            var dataPoints = new List<BurndownDayPointDto>();
            var today = DateTime.Today;

            for (int i = 0; i <= totalDays; i++)
            {
                var currentDay = start.AddDays(i);

                // Ideal burn: linear decrement from total points on start date to 0 on end date
                double ideal = Math.Max(0, Math.Round(totalPts - ((double)totalPts / totalDays * i), 1));

                // Actual remaining: tasks finished on or before currentDay
                double actual;
                if (currentDay > today && sprint.Status == "Active")
                {
                    // For future dates in an active sprint, actual remains at current state
                    actual = remainingPts;
                }
                else
                {
                    int burnedUpToDay = tasks
                        .Where(t => ((t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed") &&
                                    (t.UpdatedDate ?? t.CreatedDate).Date <= currentDay)
                        .Sum(t => t.StoryPoints ?? 0);

                    actual = Math.Max(0, totalPts - burnedUpToDay);
                }

                int completedOnDay = tasks
                    .Where(t => ((t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed") &&
                                (t.UpdatedDate ?? t.CreatedDate).Date == currentDay)
                    .Sum(t => t.StoryPoints ?? 0);

                dataPoints.Add(new BurndownDayPointDto
                {
                    Date = currentDay.ToString("yyyy-MM-dd"),
                    DisplayLabel = $"Day {i} ({currentDay:MMM dd})",
                    IdealRemaining = ideal,
                    ActualRemaining = actual,
                    CompletedOnThisDay = completedOnDay
                });
            }

            var result = new SprintBurndownDto
            {
                SprintId = sprint.Id,
                SprintName = sprint.Name,
                SprintGoal = sprint.Goal,
                Status = sprint.Status,
                StartDate = start,
                EndDate = end,
                TotalStoryPoints = totalPts,
                CompletedStoryPoints = completedPts,
                RemainingStoryPoints = remainingPts,
                DataPoints = dataPoints
            };

            return Ok(result);
        }

        [HttpGet("sprint-velocity")]
        public async Task<IActionResult> GetSprintVelocity()
        {
            var sprints = await _context.Sprints
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.Status)
                .Where(s => s.Status == "Completed" || s.Status == "Active")
                .OrderBy(s => s.StartDate ?? s.CreatedDate)
                .ToListAsync();

            var velocityItems = sprints.Select(s =>
            {
                var sTasks = s.Tasks.Where(t => !t.IsDeleted).ToList();
                int totalPts = sTasks.Sum(t => t.StoryPoints ?? 0);
                int donePts = sTasks
                    .Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed")
                    .Sum(t => t.StoryPoints ?? 0);
                int totalIssues = sTasks.Count;
                int doneIssues = sTasks.Count(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed");

                return new SprintVelocityItemDto
                {
                    SprintId = s.Id,
                    SprintName = s.Name,
                    Status = s.Status,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    CompletedDate = s.CompletedDate,
                    CommittedStoryPoints = totalPts,
                    CompletedStoryPoints = donePts,
                    TotalIssues = totalIssues,
                    CompletedIssues = doneIssues,
                    CompletionPercentage = totalPts > 0
                        ? Math.Round((double)donePts / totalPts * 100, 1)
                        : (totalIssues > 0 ? Math.Round((double)doneIssues / totalIssues * 100, 1) : 0)
                };
            }).ToList();

            var completedOnly = velocityItems.Where(v => v.Status == "Completed").ToList();
            double avgVelocity = completedOnly.Any()
                ? Math.Round(completedOnly.Average(v => v.CompletedStoryPoints), 1)
                : (velocityItems.Any() ? Math.Round(velocityItems.Average(v => v.CompletedStoryPoints), 1) : 0);

            var report = new SprintVelocityReportDto
            {
                AverageVelocity = avgVelocity,
                Sprints = velocityItems
            };

            return Ok(report);
        }

        [HttpGet("sprint-report/{sprintId}")]
        public async Task<IActionResult> GetSprintDetailedReport(int sprintId)
        {
            var sprint = await _context.Sprints
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
                .FirstOrDefaultAsync(s => s.Id == sprintId);

            if (sprint == null)
            {
                return NotFound(new { message = "Sprint not found." });
            }

            var tasks = sprint.Tasks.Where(t => !t.IsDeleted).ToList();
            var doneTasks = tasks.Where(t => (t.Status != null && t.Status.Category == "Done") || t.TaskStatus == "Completed").ToList();
            var incompleteTasks = tasks.Where(t => !doneTasks.Contains(t)).ToList();

            int totalPts = tasks.Sum(t => t.StoryPoints ?? 0);
            int donePts = doneTasks.Sum(t => t.StoryPoints ?? 0);
            int remainingPts = Math.Max(0, totalPts - donePts);

            var completedIssueDtos = doneTasks.Select(t => new SprintReportIssueDto
            {
                TaskId = t.TaskId,
                IssueKey = !string.IsNullOrEmpty(t.JiraIssueKey) ? t.JiraIssueKey : $"TASK-{t.TaskId}",
                Title = t.Title,
                StatusName = t.Status?.DisplayName ?? t.TaskStatus,
                StatusCategory = t.Status?.Category ?? "Done",
                PriorityName = t.Priority?.Name ?? t.TaskPriority ?? "Medium",
                PriorityColor = t.Priority?.ColorHex ?? "#ffab00",
                IssueTypeName = t.IssueType?.Name ?? "Task",
                AssigneeName = t.User?.UserName ?? "Unassigned",
                StoryPoints = t.StoryPoints,
                EpicName = t.Epic?.Name,
                EpicColor = t.Epic?.ColorHex
            }).ToList();

            var incompleteIssueDtos = incompleteTasks.Select(t => new SprintReportIssueDto
            {
                TaskId = t.TaskId,
                IssueKey = !string.IsNullOrEmpty(t.JiraIssueKey) ? t.JiraIssueKey : $"TASK-{t.TaskId}",
                Title = t.Title,
                StatusName = t.Status?.DisplayName ?? t.TaskStatus,
                StatusCategory = t.Status?.Category ?? "InProgress",
                PriorityName = t.Priority?.Name ?? t.TaskPriority ?? "Medium",
                PriorityColor = t.Priority?.ColorHex ?? "#ffab00",
                IssueTypeName = t.IssueType?.Name ?? "Task",
                AssigneeName = t.User?.UserName ?? "Unassigned",
                StoryPoints = t.StoryPoints,
                EpicName = t.Epic?.Name,
                EpicColor = t.Epic?.ColorHex
            }).ToList();

            var report = new SprintDetailedReportDto
            {
                SprintId = sprint.Id,
                Name = sprint.Name,
                Goal = sprint.Goal,
                Status = sprint.Status,
                StartDate = sprint.StartDate,
                EndDate = sprint.EndDate,
                CompletedDate = sprint.CompletedDate,
                TotalStoryPoints = totalPts,
                CompletedStoryPoints = donePts,
                RemainingStoryPoints = remainingPts,
                CompletionPercentage = totalPts > 0
                    ? Math.Round((double)donePts / totalPts * 100, 1)
                    : (tasks.Count > 0 ? Math.Round((double)doneTasks.Count / tasks.Count * 100, 1) : 0),
                TotalIssues = tasks.Count,
                CompletedIssuesCount = doneTasks.Count,
                IncompleteIssuesCount = incompleteTasks.Count,
                CompletedIssues = completedIssueDtos,
                IncompleteIssues = incompleteIssueDtos
            };

            return Ok(report);
        }

        [HttpGet("sprints-list")]
        public async Task<IActionResult> GetSprintsList()
        {
            var list = await _context.Sprints
                .OrderByDescending(s => s.Status == "Active")
                .ThenByDescending(s => s.Status == "Future")
                .ThenByDescending(s => s.StartDate)
                .Select(s => new SprintSelectionItemDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Status = s.Status,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate
                })
                .ToListAsync();

            return Ok(list);
        }
    }
}
