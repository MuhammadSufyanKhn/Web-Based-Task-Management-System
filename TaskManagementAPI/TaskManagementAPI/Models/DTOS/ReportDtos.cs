using System;
using System.Collections.Generic;

namespace TaskManagementAPI.Models.DTOS
{
    public class ProjectDashboardSummaryDto
    {
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public int InProgressIssues { get; set; }
        public int TodoIssues { get; set; }
        public int BacklogIssues { get; set; }
        public int OverdueIssues { get; set; }
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int RemainingStoryPoints { get; set; }
        public double CompletionPercentage { get; set; }
        public ActiveSprintReportSummaryDto? ActiveSprint { get; set; }
        public List<EpicProgressReportDto> EpicProgress { get; set; } = new List<EpicProgressReportDto>();
    }

    public class ActiveSprintReportSummaryDto
    {
        public int SprintId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Goal { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int RemainingStoryPoints { get; set; }
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public double CompletionPercentage { get; set; }
        public int DaysRemaining { get; set; }
    }

    public class ReportBreakdownsDto
    {
        public List<StatusBreakdownItemDto> ByStatus { get; set; } = new List<StatusBreakdownItemDto>();
        public List<PriorityBreakdownItemDto> ByPriority { get; set; } = new List<PriorityBreakdownItemDto>();
        public List<AssigneeBreakdownItemDto> ByAssignee { get; set; } = new List<AssigneeBreakdownItemDto>();
        public List<IssueTypeBreakdownItemDto> ByIssueType { get; set; } = new List<IssueTypeBreakdownItemDto>();
        public List<OverdueIssueItemDto> OverdueIssues { get; set; } = new List<OverdueIssueItemDto>();
    }

    public class StatusBreakdownItemDto
    {
        public int? StatusId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = "InProgress";
        public string ColorHex { get; set; } = "#6c757d";
        public int Count { get; set; }
        public double Percentage { get; set; }
        public int StoryPoints { get; set; }
    }

    public class PriorityBreakdownItemDto
    {
        public int? PriorityId { get; set; }
        public string Name { get; set; } = "Medium";
        public string ColorHex { get; set; } = "#ffab00";
        public int Count { get; set; }
        public double Percentage { get; set; }
        public int StoryPoints { get; set; }
    }

    public class AssigneeBreakdownItemDto
    {
        public int? UserId { get; set; }
        public string UserName { get; set; } = "Unassigned";
        public string Email { get; set; } = string.Empty;
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public double CompletionPercentage { get; set; }
    }

    public class IssueTypeBreakdownItemDto
    {
        public int? IssueTypeId { get; set; }
        public string Name { get; set; } = "Task";
        public string Icon { get; set; } = "task";
        public string ColorHex { get; set; } = "#4a90e2";
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class EpicProgressReportDto
    {
        public int EpicId { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string ColorHex { get; set; } = "#8777D9";
        public string Status { get; set; } = "To Do";
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public double CompletionPercentage { get; set; }
    }

    public class OverdueIssueItemDto
    {
        public int TaskId { get; set; }
        public string IssueKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int DaysOverdue { get; set; }
        public string PriorityName { get; set; } = "Medium";
        public string PriorityColor { get; set; } = "#ffab00";
        public string StatusName { get; set; } = "Pending";
        public string AssigneeName { get; set; } = "Unassigned";
        public int? StoryPoints { get; set; }
    }

    public class SprintBurndownDto
    {
        public int SprintId { get; set; }
        public string SprintName { get; set; } = string.Empty;
        public string? SprintGoal { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int RemainingStoryPoints { get; set; }
        public List<BurndownDayPointDto> DataPoints { get; set; } = new List<BurndownDayPointDto>();
    }

    public class BurndownDayPointDto
    {
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public string DisplayLabel { get; set; } = string.Empty; // e.g. "Day 1 (May 10)"
        public double IdealRemaining { get; set; }
        public double ActualRemaining { get; set; }
        public int CompletedOnThisDay { get; set; }
    }

    public class SprintVelocityReportDto
    {
        public double AverageVelocity { get; set; }
        public List<SprintVelocityItemDto> Sprints { get; set; } = new List<SprintVelocityItemDto>();
    }

    public class SprintVelocityItemDto
    {
        public int SprintId { get; set; }
        public string SprintName { get; set; } = string.Empty;
        public string Status { get; set; } = "Completed";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public int CommittedStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public double CompletionPercentage { get; set; }
    }

    public class SprintDetailedReportDto
    {
        public int SprintId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Goal { get; set; }
        public string Status { get; set; } = "Completed";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int RemainingStoryPoints { get; set; }
        public double CompletionPercentage { get; set; }
        public int TotalIssues { get; set; }
        public int CompletedIssuesCount { get; set; }
        public int IncompleteIssuesCount { get; set; }
        public List<SprintReportIssueDto> CompletedIssues { get; set; } = new List<SprintReportIssueDto>();
        public List<SprintReportIssueDto> IncompleteIssues { get; set; } = new List<SprintReportIssueDto>();
    }

    public class SprintReportIssueDto
    {
        public int TaskId { get; set; }
        public string IssueKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public string StatusCategory { get; set; } = "InProgress";
        public string PriorityName { get; set; } = "Medium";
        public string PriorityColor { get; set; } = "#ffab00";
        public string IssueTypeName { get; set; } = "Task";
        public string AssigneeName { get; set; } = "Unassigned";
        public int? StoryPoints { get; set; }
        public string? EpicName { get; set; }
        public string? EpicColor { get; set; }
    }

    public class SprintSelectionItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
