using System.Collections.Generic;

namespace TaskManagementAPI.Models.DTOS
{
    public class ProjectConfigSummaryDto
    {
        public List<ProjectStatusDto> Statuses { get; set; } = new List<ProjectStatusDto>();
        public List<IssueTypeDto> IssueTypes { get; set; } = new List<IssueTypeDto>();
        public List<TaskPriorityDto> Priorities { get; set; } = new List<TaskPriorityDto>();
        public List<LabelDto> Labels { get; set; } = new List<LabelDto>();
        public List<ProjectComponentDto> Components { get; set; } = new List<ProjectComponentDto>();
    }

    public class ProjectStatusDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = "InProgress";
        public string ColorHex { get; set; } = "#6c757d";
        public int OrderIndex { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateOrUpdateStatusDto
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = "InProgress";
        public string ColorHex { get; set; } = "#6c757d";
        public int OrderIndex { get; set; }
        public bool IsDefault { get; set; }
    }

    public class IssueTypeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "task";
        public string ColorHex { get; set; } = "#4a90e2";
        public int OrderIndex { get; set; }
        public bool IsActive { get; set; }
    }

    public class TaskPriorityDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ColorHex { get; set; } = "#ffab00";
        public int OrderIndex { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
    }

    public class LabelDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ColorHex { get; set; } = "#6554c0";
    }

    public class CreateLabelDto
    {
        public string Name { get; set; } = string.Empty;
        public string ColorHex { get; set; } = "#6554c0";
    }

    public class ProjectComponentDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? LeadUserId { get; set; }
        public string? LeadUserName { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateComponentDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? LeadUserId { get; set; }
    }

    public class JiraSettingsDto
    {
        public string JiraBaseUrl { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string ApiToken { get; set; } = string.Empty;
        public string ProjectKey { get; set; } = string.Empty;
        public bool IsSyncEnabled { get; set; } = true;
        public DateTime? LastSyncDate { get; set; }
    }

    public class CreateOrUpdateIssueTypeDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "task";
        public string ColorHex { get; set; } = "#4a90e2";
        public int OrderIndex { get; set; }
    }

    public class CreateOrUpdatePriorityDto
    {
        public string Name { get; set; } = string.Empty;
        public string ColorHex { get; set; } = "#ffab00";
        public int OrderIndex { get; set; }
        public bool IsDefault { get; set; }
    }
}
