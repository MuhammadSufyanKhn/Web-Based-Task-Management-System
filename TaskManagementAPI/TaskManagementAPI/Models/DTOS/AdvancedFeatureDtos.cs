using System;
using System.Collections.Generic;

namespace TaskManagementAPI.Models.DTOS
{
    // ==========================================
    // TIME TRACKING DTOS
    // ==========================================
    public class LogWorkDto
    {
        public int TaskId { get; set; }
        public int TimeSpentMinutes { get; set; }
        public int? RemainingEstimateMinutes { get; set; }
        public string? Description { get; set; }
        public DateTime? LoggedAt { get; set; }
    }

    public class UpdateEstimatesDto
    {
        public int? OriginalEstimateMinutes { get; set; }
        public int? RemainingEstimateMinutes { get; set; }
    }

    public class TimeLogDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int TimeSpentMinutes { get; set; }
        public int? RemainingEstimateMinutes { get; set; }
        public string? Description { get; set; }
        public DateTime LoggedAt { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class TaskTimeSummaryDto
    {
        public int TaskId { get; set; }
        public int? OriginalEstimateMinutes { get; set; }
        public int? RemainingEstimateMinutes { get; set; }
        public int TimeSpentMinutes { get; set; }
        public List<TimeLogDto> Logs { get; set; } = new();
    }

    // ==========================================
    // TASK DEPENDENCY DTOS
    // ==========================================
    public class CreateDependencyDto
    {
        public int SourceTaskId { get; set; }
        public int TargetTaskId { get; set; }
        public string DependencyType { get; set; } = "Blocks"; // Blocks, IsBlockedBy, RelatesTo
    }

    public class DependencyDto
    {
        public int Id { get; set; }
        public int SourceTaskId { get; set; }
        public string SourceTaskKey { get; set; } = string.Empty;
        public string SourceTaskTitle { get; set; } = string.Empty;
        public int TargetTaskId { get; set; }
        public string TargetTaskKey { get; set; } = string.Empty;
        public string TargetTaskTitle { get; set; } = string.Empty;
        public string DependencyType { get; set; } = string.Empty;
        public int CreatedBy { get; set; }
        public string CreatorName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }

    // ==========================================
    // ACTIVITY AUDIT LOG DTOS
    // ==========================================
    public class ActivityLogDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? FieldName { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    // ==========================================
    // NOTIFICATION DTOS
    // ==========================================
    public class NotificationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public int? TaskId { get; set; }
        public string? TaskKey { get; set; }
        public int? SprintId { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class NotificationSummaryDto
    {
        public int UnreadCount { get; set; }
        public List<NotificationDto> Notifications { get; set; } = new();
    }

    // ==========================================
    // JIRA INTEGRATION DTOS
    // ==========================================
    public class JiraConfigDto
    {
        public string JiraUrl { get; set; } = string.Empty;
        public string ProjectKey { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ApiToken { get; set; }
        public bool AutoSync { get; set; }
        public string ConnectionStatus { get; set; } = "Disconnected";
        public DateTime? LastSyncedAt { get; set; }
        public string? LastSyncError { get; set; }
        public bool HasApiToken { get; set; }
    }

    public class JiraTestConnectionResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? JiraProjectName { get; set; }
        public string? JiraUserDisplayName { get; set; }
    }

    public class JiraSyncRequestDto
    {
        public string Direction { get; set; } = "both"; // "push", "pull", "both"
    }

    public class JiraSyncResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ItemsProcessed { get; set; }
        public int ItemsCreated { get; set; }
        public int ItemsUpdated { get; set; }
        public int ItemsFailed { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    public class JiraSyncLogDto
    {
        public int Id { get; set; }
        public string SyncType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ItemsProcessed { get; set; }
        public int ItemsCreated { get; set; }
        public int ItemsUpdated { get; set; }
        public int ItemsFailed { get; set; }
        public string? ErrorMessage { get; set; }
        public string? TriggeredByName { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    // ==========================================
    // MULTI-VIEW ALL TASKS DTO (List, Calendar, Timeline, Gantt)
    // ==========================================
    public class TaskViewItemDto
    {
        public int TaskId { get; set; }
        public string IssueKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Descriptions { get; set; }
        public int StatusId { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public string StatusCategory { get; set; } = "Todo";
        public string? StatusColor { get; set; }
        public string PriorityName { get; set; } = "Medium";
        public string PriorityColor { get; set; } = "#ffab00";
        public string IssueTypeName { get; set; } = "Task";
        public string IssueTypeIcon { get; set; } = "task";
        public string IssueTypeColor { get; set; } = "#4a90e2";
        public int? StoryPoints { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserEmail { get; set; }
        public int? SprintId { get; set; }
        public string? SprintName { get; set; }
        public DateTime? SprintStartDate { get; set; }
        public DateTime? SprintEndDate { get; set; }
        public int? EpicId { get; set; }
        public string? EpicName { get; set; }
        public string? EpicColor { get; set; }
        public int? ParentTaskId { get; set; }
        public string? ParentTaskTitle { get; set; }
        public int SubtaskCount { get; set; }
        public int SubtaskCompletedCount { get; set; }
        public int? OriginalEstimateMinutes { get; set; }
        public int? RemainingEstimateMinutes { get; set; }
        public int TimeSpentMinutes { get; set; }
        public List<int> BlockedByTaskIds { get; set; } = new();
        public List<int> BlocksTaskIds { get; set; } = new();
        public List<string> Labels { get; set; } = new();
    }
}
