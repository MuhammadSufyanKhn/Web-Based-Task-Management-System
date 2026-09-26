using System;
using System.Collections.Generic;

namespace TaskManagementAPI.Models.DTOS
{
    public class BacklogViewDto
    {
        public SprintSummaryDto? ActiveSprint { get; set; }
        public List<SprintSummaryDto> FutureSprints { get; set; } = new List<SprintSummaryDto>();
        public List<BacklogIssueDto> BacklogIssues { get; set; } = new List<BacklogIssueDto>();
        public List<EpicSummaryDto> Epics { get; set; } = new List<EpicSummaryDto>();
        public List<ProjectMemberDto> Members { get; set; } = new List<ProjectMemberDto>();
        public List<string> Priorities { get; set; } = new List<string>();
        public List<string> IssueTypes { get; set; } = new List<string>();
        public List<string> Labels { get; set; } = new List<string>();
        public List<string> Components { get; set; } = new List<string>();
    }

    public class SprintSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Goal { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Future";
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public List<BacklogIssueDto> Issues { get; set; } = new List<BacklogIssueDto>();
    }

    public class BacklogIssueDto
    {
        public int TaskId { get; set; }
        public string IssueKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Descriptions { get; set; }
        public int? StatusId { get; set; }
        public string StatusName { get; set; } = "Pending";
        public string StatusDisplayName { get; set; } = "To Do";
        public string StatusCategory { get; set; } = "Todo"; // Todo, InProgress, Done
        public string PriorityName { get; set; } = "Medium";
        public string PriorityColor { get; set; } = "#ffab00";
        public string IssueTypeName { get; set; } = "Task";
        public string IssueTypeIcon { get; set; } = "task";
        public string IssueTypeColor { get; set; } = "#4a90e2";
        public int? StoryPoints { get; set; }
        public DateTime? DueDate { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = "Unassigned";
        public string UserEmail { get; set; } = string.Empty;
        public int BacklogOrder { get; set; }
        public int? SprintId { get; set; }
        public string? SprintName { get; set; }
        public int? EpicId { get; set; }
        public string? EpicKey { get; set; }
        public string? EpicName { get; set; }
        public string? EpicColor { get; set; }
        public string? ComponentName { get; set; }
        public List<string> Labels { get; set; } = new List<string>();
        public int? ParentTaskId { get; set; }
        public int SubtasksCount { get; set; }
        public int? OriginalEstimateMinutes { get; set; }
        public int? RemainingEstimateMinutes { get; set; }
        public int TimeSpentMinutes { get; set; }
    }

    public class EpicSummaryDto
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string ColorHex { get; set; } = "#8777D9";
        public string Status { get; set; } = "To Do";
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public int TotalStoryPoints { get; set; }
    }

    public class CreateSprintDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Goal { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class UpdateSprintDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Goal { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class StartSprintDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Goal { get; set; }
    }

    public class CompleteSprintDto
    {
        public int? MoveUnfinishedToSprintId { get; set; } // Null moves incomplete issues to Backlog
    }

    public class CreateEpicDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string ColorHex { get; set; } = "#8777D9";
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class UpdateEpicDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string ColorHex { get; set; } = "#8777D9";
        public string Status { get; set; } = "To Do";
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class MoveIssueSprintDto
    {
        public int TaskId { get; set; }
        public int? TargetSprintId { get; set; } // null = Backlog
        public int TargetPosition { get; set; }
    }

    public class AssignEpicDto
    {
        public int TaskId { get; set; }
        public int? EpicId { get; set; }
    }
}
