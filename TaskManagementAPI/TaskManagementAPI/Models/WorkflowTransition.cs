using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("WorkflowTransitions")]
    public class WorkflowTransition
    {
        [Key]
        public int Id { get; set; }

        public int FromStatusId { get; set; }
        [ForeignKey("FromStatusId")]
        public ProjectStatus FromStatus { get; set; } = null!;

        public int ToStatusId { get; set; }
        [ForeignKey("ToStatusId")]
        public ProjectStatus ToStatus { get; set; } = null!;

        [MaxLength(50)]
        public string? RoleAllowed { get; set; } // Nullable, if null all roles can transition
    }
}
