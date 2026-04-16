namespace TaskManagementAPI.Models.DTOS
{
    public class CreateTaskDto
    {
        public string Title { get; set; }
        public string? Descriptions { get; set; } // SQL mein 's' hai
        public string? TaskPriority { get; set; } // High, Medium, Low
        public DateTime? DueDate { get; set; }
    }
}
