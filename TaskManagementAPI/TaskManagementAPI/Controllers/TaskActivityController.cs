using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;

namespace TaskManagementAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TaskActivityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TaskActivityController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetTaskActivity(int taskId)
        {
            var activities = await _context.TaskActivityLogs
                .Include(a => a.User)
                .Where(a => a.TaskId == taskId)
                .OrderByDescending(a => a.CreatedDate)
                .Take(50)
                .Select(a => new ActivityLogDto
                {
                    Id = a.Id,
                    TaskId = a.TaskId,
                    UserId = a.UserId,
                    UserName = a.User != null ? a.User.UserName : "System",
                    Action = a.Action,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    Details = a.Details,
                    CreatedDate = a.CreatedDate
                })
                .ToListAsync();

            return Ok(activities);
        }
    }
}
