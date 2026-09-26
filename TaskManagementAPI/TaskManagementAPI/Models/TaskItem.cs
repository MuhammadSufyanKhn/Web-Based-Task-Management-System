using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("Task")]
    public class TaskItem
    {
        [Key]
        public int TaskId { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Descriptions { get; set; }

        public string TaskStatus { get; set; } = "Pending";

        public string? TaskPriority { get; set; }

        public DateTime? DueDate { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public Users User { get; set; } = null!;

        public int? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public bool IsDeleted { get; set; } = false;

        // Kanban & Ordering
        public int BoardOrder { get; set; } = 0;
        public int BacklogOrder { get; set; } = 0;

        // Jira Integration (Local Configuration & Future Sync)
        public string? JiraIssueKey { get; set; }
        public string? JiraIssueId { get; set; }
        public string? JiraIssueUrl { get; set; }
        public DateTime? LastSyncedAt { get; set; }

        // Jira-style Extended Attributes
        public int? IssueTypeId { get; set; }
        [ForeignKey("IssueTypeId")]
        public IssueType? IssueType { get; set; }

        public int? StatusId { get; set; }
        [ForeignKey("StatusId")]
        public ProjectStatus? Status { get; set; }

        public int? PriorityId { get; set; }
        [ForeignKey("PriorityId")]
        public TaskPriority? Priority { get; set; }

        public int? ComponentId { get; set; }
        [ForeignKey("ComponentId")]
        public ProjectComponent? Component { get; set; }

        public int? StoryPoints { get; set; }

        public int? ParentTaskId { get; set; }
        [ForeignKey("ParentTaskId")]
        public TaskItem? ParentTask { get; set; }

        // Sprint & Epic Relationships
        public int? SprintId { get; set; }
        [ForeignKey("SprintId")]
        public Sprint? Sprint { get; set; }

        public int? EpicId { get; set; }
        [ForeignKey("EpicId")]
        public Epic? Epic { get; set; }

        // Time Tracking Attributes
        public int? OriginalEstimateMinutes { get; set; }
        public int? RemainingEstimateMinutes { get; set; }
        public int TimeSpentMinutes { get; set; } = 0;

        // Navigation Collections
        public ICollection<TaskItem> Subtasks { get; set; } = new List<TaskItem>();
        public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
        public ICollection<TaskTimeLog> TaskTimeLogs { get; set; } = new List<TaskTimeLog>();
        public ICollection<TaskActivityLog> TaskActivityLogs { get; set; } = new List<TaskActivityLog>();
        public ICollection<TaskDependency> DependenciesAsSource { get; set; } = new List<TaskDependency>();
        public ICollection<TaskDependency> DependenciesAsTarget { get; set; } = new List<TaskDependency>();
    }
}