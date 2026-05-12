namespace TaskManagementAPI.Models.DTOS
{
    public class CreateTaskDto
    {

        public int UserId { get; set; }
        public string Title { get; set; }
        public string? Descriptions { get; set; } 
        public string? TaskPriority { get; set; } 
        public DateTime? DueDate { get; set; }
    }
}
