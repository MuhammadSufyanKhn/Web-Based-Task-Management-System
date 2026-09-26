using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("TaskDependencies")]
    public class TaskDependency
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SourceTaskId { get; set; }

        [ForeignKey("SourceTaskId")]
        public TaskItem SourceTask { get; set; } = null!;

        [Required]
        public int TargetTaskId { get; set; }

        [ForeignKey("TargetTaskId")]
        public TaskItem TargetTask { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string DependencyType { get; set; } = "Blocks"; // Blocks, IsBlockedBy, RelatesTo

        [Required]
        public int CreatedBy { get; set; }

        [ForeignKey("CreatedBy")]
        public Users Creator { get; set; } = null!;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
