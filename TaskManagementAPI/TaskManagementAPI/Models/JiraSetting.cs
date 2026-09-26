using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("JiraSettings")]
    public class JiraSetting
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string JiraBaseUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ApiToken { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string ProjectKey { get; set; } = string.Empty;

        public bool IsSyncEnabled { get; set; } = true;

        public DateTime? LastSyncDate { get; set; }
        public DateTime? LastSyncedAt { get => LastSyncDate; set => LastSyncDate = value; }

        [MaxLength(50)]
        public string? ConnectionStatus { get; set; } // Connected, Disconnected, Error

        public string? LastSyncError { get; set; }

        public bool AutoSync { get; set; } = false;

        [MaxLength(255)]
        public string? WebhookSecret { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        public int? UpdatedBy { get; set; }
    }
}
