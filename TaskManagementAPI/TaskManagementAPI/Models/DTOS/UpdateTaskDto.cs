namespace TaskManagementAPI.Models.DTOS
{
    public class UpdateTaskDto
    {
        public string Title { get; set; }
        public string Descriptions { get; set; }
        public string TaskStatus { get; set; }
        public string TaskPriority { get; set; }
        public DateTime? DueDate { get; set; }
    }
}
