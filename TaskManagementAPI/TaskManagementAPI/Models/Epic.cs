using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagerAPI.Models
{
    [Table("Epics")]
    public class Epic
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Key { get; set; } = string.Empty; // e.g. "EPIC-1"

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Summary { get; set; }

        [MaxLength(20)]
        public string ColorHex { get; set; } = "#8777D9";

        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "To Do"; // "To Do", "In Progress", "Done"

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation collection
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
