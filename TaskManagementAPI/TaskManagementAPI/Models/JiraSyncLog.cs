using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("JiraSyncLogs")]
    public class JiraSyncLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string SyncType { get; set; } = "Manual"; // Manual, Scheduled, Webhook, Push, Pull

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Success"; // Success, Failed, Partial

        public int ItemsProcessed { get; set; } = 0;

        public int ItemsCreated { get; set; } = 0;

        public int ItemsUpdated { get; set; } = 0;

        public int ItemsFailed { get; set; } = 0;

        public string? ErrorMessage { get; set; }

        public int? TriggeredByUserId { get; set; }

        [ForeignKey("TriggeredByUserId")]
        public Users? TriggeredByUser { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
