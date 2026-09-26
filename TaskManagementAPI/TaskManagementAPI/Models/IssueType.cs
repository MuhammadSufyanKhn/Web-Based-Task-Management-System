using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("IssueTypes")]
    public class IssueType
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string Icon { get; set; } = "task";

        [MaxLength(20)]
        public string ColorHex { get; set; } = "#4a90e2";

        public int OrderIndex { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }
}
