using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("Labels")]
    public class Label
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(20)]
        public string ColorHex { get; set; } = "#6554c0";

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation property
        public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
    }
}
