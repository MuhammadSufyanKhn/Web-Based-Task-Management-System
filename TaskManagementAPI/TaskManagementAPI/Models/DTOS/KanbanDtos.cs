using System;
using System.Collections.Generic;

namespace TaskManagementAPI.Models.DTOS
{
    public class KanbanBoardResponseDto
    {
        public List<KanbanColumnDto> Columns { get; set; } = new List<KanbanColumnDto>();
        public List<ProjectMemberDto> Members { get; set; } = new List<ProjectMemberDto>();
        public List<string> Priorities { get; set; } = new List<string>();
        public List<string> IssueTypes { get; set; } = new List<string>();
        public List<string> Labels { get; set; } = new List<string>();
        public int? ActiveSprintId { get; set; }
        public string? ActiveSprintName { get; set; }
        public string? ActiveSprintGoal { get; set; }
        public DateTime? ActiveSprintEndDate { get; set; }
        public List<SprintSummaryDto> Sprints { get; set; } = new List<SprintSummaryDto>();
    }

    public class KanbanColumnDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = "InProgress"; // Todo, InProgress, Done
        public string ColorHex { get; set; } = "#6c757d";
        public int OrderIndex { get; set; }
        public List<KanbanCardDto> Cards { get; set; } = new List<KanbanCardDto>();
    }

    public class KanbanCardDto
    {
        public int TaskId { get; set; }
        public string IssueKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Descriptions { get; set; }
        public string StatusName { get; set; } = "Pending";
        public string StatusDisplayName { get; set; } = "To Do";
        public int? StatusId { get; set; }
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
        public int BoardOrder { get; set; }
        public string? ComponentName { get; set; }
        public List<string> Labels { get; set; } = new List<string>();
        public string? JiraIssueKey { get; set; }
        public string? JiraIssueUrl { get; set; }

        // Sprints & Epics
        public int? SprintId { get; set; }
        public string? SprintName { get; set; }
        public int? EpicId { get; set; }
        public string? EpicKey { get; set; }
        public string? EpicName { get; set; }
        public string? EpicColor { get; set; }
    }

    public class ProjectMemberDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class MoveCardDto
    {
        public int TaskId { get; set; }
        public int TargetStatusId { get; set; }
        public int TargetPosition { get; set; }
    }

    public class CreateKanbanTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Descriptions { get; set; }
        public int? StatusId { get; set; }
        public int? PriorityId { get; set; }
        public int? IssueTypeId { get; set; }
        public int? ComponentId { get; set; }
        public int? StoryPoints { get; set; }
        public int? UserId { get; set; } // Assignee
        public DateTime? DueDate { get; set; }
        public List<string>? Labels { get; set; }
        public int? SprintId { get; set; }
        public int? EpicId { get; set; }
    }

    public class UpdateTaskDetailDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Descriptions { get; set; }
        public int? StatusId { get; set; }
        public int? PriorityId { get; set; }
        public int? IssueTypeId { get; set; }
        public int? ComponentId { get; set; }
        public int? StoryPoints { get; set; }
        public int? UserId { get; set; } // Assignee
        public DateTime? DueDate { get; set; }
        public List<string>? Labels { get; set; }
        public int? SprintId { get; set; }
        public int? EpicId { get; set; }
    }
}
