using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EpicController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<EpicController> _logger;

        public EpicController(AppDbContext context, ILogger<EpicController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetEpics()
        {
            var epics = await _context.Epics
                .Include(e => e.Tasks)
                    .ThenInclude(t => t.Status)
                .OrderBy(e => e.Id)
                .ToListAsync();

            var result = epics.Select(e =>
            {
                var activeTasks = e.Tasks.Where(t => !t.IsDeleted).ToList();
                var completedTasks = activeTasks.Where(t => t.Status != null && t.Status.Category == "Done").ToList();

                return new EpicSummaryDto
                {
                    Id = e.Id,
                    Key = e.Key,
                    Name = e.Name,
                    Summary = e.Summary,
                    ColorHex = e.ColorHex,
                    Status = e.Status,
                    StartDate = e.StartDate,
                    DueDate = e.DueDate,
                    TotalIssues = activeTasks.Count,
                    CompletedIssues = completedTasks.Count,
                    TotalStoryPoints = activeTasks.Sum(t => t.StoryPoints ?? 0)
                };
            }).ToList();

            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateEpic([FromBody] CreateEpicDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Epic name is required." });
            }

            var epic = new Epic
            {
                Key = "TEMP",
                Name = dto.Name.Trim(),
                Summary = dto.Summary,
                ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#8777D9" : dto.ColorHex,
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                Status = "To Do",
                CreatedDate = DateTime.Now
            };

            _context.Epics.Add(epic);
            await _context.SaveChangesAsync();

            // Set formatted key: EPIC-{id}
            epic.Key = $"EPIC-{epic.Id}";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Epic created successfully.", epicId = epic.Id, epicKey = epic.Key });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEpic(int id, [FromBody] UpdateEpicDto dto)
        {
            var epic = await _context.Epics.FindAsync(id);
            if (epic == null) return NotFound(new { message = "Epic not found." });

            epic.Name = dto.Name.Trim();
            epic.Summary = dto.Summary;
            epic.ColorHex = dto.ColorHex;
            epic.Status = dto.Status;
            epic.StartDate = dto.StartDate;
            epic.DueDate = dto.DueDate;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Epic updated successfully." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEpic(int id)
        {
            var epic = await _context.Epics.Include(e => e.Tasks).FirstOrDefaultAsync(e => e.Id == id);
            if (epic == null) return NotFound(new { message = "Epic not found." });

            foreach (var task in epic.Tasks)
            {
                task.EpicId = null;
            }

            _context.Epics.Remove(epic);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Epic deleted successfully." });
        }

        [HttpPut("assign")]
        public async Task<IActionResult> AssignEpic([FromBody] AssignEpicDto dto)
        {
            var task = await _context.TaskItems.FindAsync(dto.TaskId);
            if (task == null) return NotFound(new { message = "Task not found." });

            if (dto.EpicId.HasValue && dto.EpicId.Value > 0)
            {
                var epicExists = await _context.Epics.AnyAsync(e => e.Id == dto.EpicId.Value);
                if (!epicExists) return BadRequest(new { message = "Specified Epic does not exist." });
                task.EpicId = dto.EpicId.Value;
            }
            else
            {
                task.EpicId = null; // Unassign from epic
            }

            task.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Epic assignment updated." });
        }
    }
}
