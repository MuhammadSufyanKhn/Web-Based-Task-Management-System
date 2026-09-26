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
    public class ProjectConfigController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProjectConfigController> _logger;

        public ProjectConfigController(AppDbContext context, ILogger<ProjectConfigController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetConfigSummary()
        {
            var statuses = await _context.ProjectStatuses
                .OrderBy(s => s.OrderIndex)
                .Select(s => new ProjectStatusDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    DisplayName = s.DisplayName,
                    Category = s.Category,
                    ColorHex = s.ColorHex,
                    OrderIndex = s.OrderIndex,
                    IsDefault = s.IsDefault,
                    IsActive = s.IsActive
                })
                .ToListAsync();

            var issueTypes = await _context.IssueTypes
                .OrderBy(i => i.OrderIndex)
                .Select(i => new IssueTypeDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Description = i.Description,
                    Icon = i.Icon,
                    ColorHex = i.ColorHex,
                    OrderIndex = i.OrderIndex,
                    IsActive = i.IsActive
                })
                .ToListAsync();

            var priorities = await _context.TaskPriorities
                .OrderBy(p => p.OrderIndex)
                .Select(p => new TaskPriorityDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    ColorHex = p.ColorHex,
                    OrderIndex = p.OrderIndex,
                    IsDefault = p.IsDefault,
                    IsActive = p.IsActive
                })
                .ToListAsync();

            var labels = await _context.Labels
                .OrderBy(l => l.Name)
                .Select(l => new LabelDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    ColorHex = l.ColorHex
                })
                .ToListAsync();

            var components = await _context.ProjectComponents
                .Include(c => c.LeadUser)
                .Select(c => new ProjectComponentDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    LeadUserId = c.LeadUserId,
                    LeadUserName = c.LeadUser != null ? c.LeadUser.UserName : null,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(new ProjectConfigSummaryDto
            {
                Statuses = statuses,
                IssueTypes = issueTypes,
                Priorities = priorities,
                Labels = labels,
                Components = components
            });
        }

        // --- STATUSES (COLUMNS) CRUD ---
        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var statuses = await _context.ProjectStatuses.OrderBy(s => s.OrderIndex).ToListAsync();
            return Ok(statuses);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("statuses")]
        public async Task<IActionResult> CreateStatus([FromBody] CreateOrUpdateStatusDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.DisplayName))
            {
                return BadRequest("Display name is required.");
            }

            var safeName = string.IsNullOrWhiteSpace(dto.Name)
                ? dto.DisplayName.Replace(" ", "")
                : dto.Name.Replace(" ", "");

            if (await _context.ProjectStatuses.AnyAsync(s => s.Name.ToLower() == safeName.ToLower()))
            {
                return BadRequest("A status with this system name already exists.");
            }

            var newStatus = new ProjectStatus
            {
                Name = safeName,
                DisplayName = dto.DisplayName,
                Category = dto.Category ?? "InProgress",
                ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#6c757d" : dto.ColorHex,
                OrderIndex = dto.OrderIndex,
                IsDefault = dto.IsDefault,
                IsActive = true
            };

            _context.ProjectStatuses.Add(newStatus);
            await _context.SaveChangesAsync();
            return Ok(newStatus);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("statuses/{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] CreateOrUpdateStatusDto dto)
        {
            var status = await _context.ProjectStatuses.FindAsync(id);
            if (status == null) return NotFound("Status not found.");

            status.DisplayName = dto.DisplayName;
            status.Category = dto.Category;
            status.ColorHex = dto.ColorHex;
            status.OrderIndex = dto.OrderIndex;
            status.IsDefault = dto.IsDefault;

            await _context.SaveChangesAsync();
            return Ok(status);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("statuses/{id}")]
        public async Task<IActionResult> DeleteStatus(int id)
        {
            var status = await _context.ProjectStatuses.FindAsync(id);
            if (status == null) return NotFound("Status not found.");

            var hasTasks = await _context.TaskItems.AnyAsync(t => t.StatusId == id && !t.IsDeleted);
            if (hasTasks)
            {
                return BadRequest("Cannot delete status with active tasks. Move tasks to another column first.");
            }

            _context.ProjectStatuses.Remove(status);
            await _context.SaveChangesAsync();
            return Ok("Status deleted.");
        }

        // --- LABELS CRUD ---
        [HttpGet("labels")]
        public async Task<IActionResult> GetLabels()
        {
            var labels = await _context.Labels.OrderBy(l => l.Name).ToListAsync();
            return Ok(labels);
        }

        [HttpPost("labels")]
        public async Task<IActionResult> CreateLabel([FromBody] CreateLabelDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Label name is required.");
            var trimmed = dto.Name.Trim();

            if (await _context.Labels.AnyAsync(l => l.Name.ToLower() == trimmed.ToLower()))
            {
                return BadRequest("Label already exists.");
            }

            var label = new Label
            {
                Name = trimmed,
                ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#6554C0" : dto.ColorHex
            };

            _context.Labels.Add(label);
            await _context.SaveChangesAsync();
            return Ok(label);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("labels/{id}")]
        public async Task<IActionResult> DeleteLabel(int id)
        {
            var label = await _context.Labels.FindAsync(id);
            if (label == null) return NotFound("Label not found.");

            _context.Labels.Remove(label);
            await _context.SaveChangesAsync();
            return Ok("Label deleted.");
        }

        // --- COMPONENTS CRUD ---
        [HttpGet("components")]
        public async Task<IActionResult> GetComponents()
        {
            var components = await _context.ProjectComponents
                .Include(c => c.LeadUser)
                .Select(c => new ProjectComponentDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    LeadUserId = c.LeadUserId,
                    LeadUserName = c.LeadUser != null ? c.LeadUser.UserName : null,
                    IsActive = c.IsActive
                })
                .ToListAsync();
            return Ok(components);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("components")]
        public async Task<IActionResult> CreateComponent([FromBody] CreateComponentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Component name is required.");

            var component = new ProjectComponent
            {
                Name = dto.Name.Trim(),
                Description = dto.Description,
                LeadUserId = dto.LeadUserId,
                IsActive = true
            };

            _context.ProjectComponents.Add(component);
            await _context.SaveChangesAsync();
            return Ok(component);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("components/{id}")]
        public async Task<IActionResult> DeleteComponent(int id)
        {
            var component = await _context.ProjectComponents.FindAsync(id);
            if (component == null) return NotFound("Component not found.");

            _context.ProjectComponents.Remove(component);
            await _context.SaveChangesAsync();
            return Ok("Component deleted.");
        }

        // --- MEMBERS & ROLES ---
        [HttpGet("members")]
        public async Task<IActionResult> GetMembers()
        {
            var members = await _context.Users
                .Where(u => !u.IsDeleted)
                .Select(u => new ProjectMemberDto
                {
                    UserId = u.UserId,
                    UserName = u.UserName,
                    Email = u.Email,
                    Role = u.UserRole
                })
                .ToListAsync();
            return Ok(members);
        }
    }
}
