using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("TaskActivityLogs")]
    public class TaskActivityLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TaskItem Task { get; set; } = null!;

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public Users User { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty; // Created, StatusChanged, AssigneeChanged, PriorityChanged, SprintChanged, TimeLogged, DependencyAdded, JiraSynced

        [MaxLength(100)]
        public string? FieldName { get; set; }

        public string? OldValue { get; set; }

        public string? NewValue { get; set; }

        [MaxLength(1000)]
        public string? Details { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
