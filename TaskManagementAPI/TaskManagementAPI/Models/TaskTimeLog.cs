using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("TaskTimeLogs")]
    public class TaskTimeLog
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
        public int TimeSpentMinutes { get; set; }

        public int? RemainingEstimateMinutes { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime LoggedAt { get; set; } = DateTime.Now;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
