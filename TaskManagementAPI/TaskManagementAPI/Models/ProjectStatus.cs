using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("ProjectStatuses")]
    public class ProjectStatus
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string DisplayName { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Category { get; set; } = "InProgress"; // Todo, InProgress, Done

        [MaxLength(20)]
        public string ColorHex { get; set; } = "#6c757d";

        public int OrderIndex { get; set; } = 0;

        public bool IsDefault { get; set; } = false;

        public bool IsActive { get; set; } = true;
    }
}
