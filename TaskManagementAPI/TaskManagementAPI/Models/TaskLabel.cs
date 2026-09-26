using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("TaskLabels")]
    public class TaskLabel
    {
        public int TaskId { get; set; }
        [ForeignKey("TaskId")]
        public TaskItem Task { get; set; } = null!;

        public int LabelId { get; set; }
        [ForeignKey("LabelId")]
        public Label Label { get; set; } = null!;
    }
}
