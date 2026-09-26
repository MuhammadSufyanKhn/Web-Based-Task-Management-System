using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("Notifications")]
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public Users User { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = "System"; // TaskAssigned, StatusChanged, SprintStarted, SprintCompleted, DueSoon, Overdue, JiraSync, System

        public bool IsRead { get; set; } = false;

        public int? TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TaskItem? Task { get; set; }

        public int? SprintId { get; set; }

        [ForeignKey("SprintId")]
        public Sprint? Sprint { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
