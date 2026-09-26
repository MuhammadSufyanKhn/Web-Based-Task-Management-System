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

        [Authorize(Roles = "Admin")]
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

        // --- ISSUE TYPES CRUD ---
        [Authorize(Roles = "Admin")]
        [HttpPost("issuetypes")]
        public async Task<IActionResult> CreateIssueType([FromBody] CreateOrUpdateIssueTypeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Issue type name is required.");
            var trimmed = dto.Name.Trim();

            if (await _context.IssueTypes.AnyAsync(i => i.Name.ToLower() == trimmed.ToLower()))
            {
                return BadRequest("Issue type with this name already exists.");
            }

            var issueType = new IssueType
            {
                Name = trimmed,
                Description = dto.Description,
                Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "task" : dto.Icon,
                ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#4a90e2" : dto.ColorHex,
                OrderIndex = dto.OrderIndex,
                IsActive = true
            };

            _context.IssueTypes.Add(issueType);
            await _context.SaveChangesAsync();
            return Ok(issueType);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("issuetypes/{id}")]
        public async Task<IActionResult> DeleteIssueType(int id)
        {
            var it = await _context.IssueTypes.FindAsync(id);
            if (it == null) return NotFound("Issue type not found.");

            var inUse = await _context.TaskItems.AnyAsync(t => t.IssueTypeId == id && !t.IsDeleted);
            if (inUse) return BadRequest("Cannot delete issue type currently assigned to tasks.");

            _context.IssueTypes.Remove(it);
            await _context.SaveChangesAsync();
            return Ok("Issue type deleted.");
        }

        // --- PRIORITIES CRUD ---
        [Authorize(Roles = "Admin")]
        [HttpPost("priorities")]
        public async Task<IActionResult> CreatePriority([FromBody] CreateOrUpdatePriorityDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Priority name is required.");
            var trimmed = dto.Name.Trim();

            if (await _context.TaskPriorities.AnyAsync(p => p.Name.ToLower() == trimmed.ToLower()))
            {
                return BadRequest("Priority with this name already exists.");
            }

            var priority = new TaskPriority
            {
                Name = trimmed,
                ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#ffab00" : dto.ColorHex,
                OrderIndex = dto.OrderIndex,
                IsDefault = dto.IsDefault,
                IsActive = true
            };

            _context.TaskPriorities.Add(priority);
            await _context.SaveChangesAsync();
            return Ok(priority);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("priorities/{id}")]
        public async Task<IActionResult> DeletePriority(int id)
        {
            var p = await _context.TaskPriorities.FindAsync(id);
            if (p == null) return NotFound("Priority not found.");

            var inUse = await _context.TaskItems.AnyAsync(t => t.PriorityId == id && !t.IsDeleted);
            if (inUse) return BadRequest("Cannot delete priority currently assigned to tasks.");

            _context.TaskPriorities.Remove(p);
            await _context.SaveChangesAsync();
            return Ok("Priority deleted.");
        }

        // --- JIRA SETTINGS (CONFIGURATION) ---
        [Authorize(Roles = "Admin")]
        [HttpGet("jira")]
        public async Task<IActionResult> GetJiraSettings()
        {
            var settings = await _context.JiraSettings.OrderByDescending(s => s.Id).FirstOrDefaultAsync();
            if (settings == null)
            {
                return Ok(new JiraSettingsDto
                {
                    JiraBaseUrl = "",
                    UserEmail = "",
                    ApiToken = "",
                    ProjectKey = "",
                    IsSyncEnabled = false,
                    LastSyncDate = null
                });
            }

            return Ok(new JiraSettingsDto
            {
                JiraBaseUrl = settings.JiraBaseUrl,
                UserEmail = settings.UserEmail,
                ApiToken = string.IsNullOrEmpty(settings.ApiToken) ? "" : "••••••••", // Masked for security on read
                ProjectKey = settings.ProjectKey,
                IsSyncEnabled = settings.IsSyncEnabled,
                LastSyncDate = settings.LastSyncDate
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("jira")]
        public async Task<IActionResult> UpdateJiraSettings([FromBody] JiraSettingsDto dto)
        {
            var settings = await _context.JiraSettings.OrderByDescending(s => s.Id).FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new JiraSetting
                {
                    JiraBaseUrl = dto.JiraBaseUrl?.Trim() ?? "",
                    UserEmail = dto.UserEmail?.Trim() ?? "",
                    ApiToken = dto.ApiToken ?? "",
                    ProjectKey = dto.ProjectKey?.Trim().ToUpper() ?? "",
                    IsSyncEnabled = dto.IsSyncEnabled,
                    CreatedDate = DateTime.Now
                };
                _context.JiraSettings.Add(settings);
            }
            else
            {
                settings.JiraBaseUrl = dto.JiraBaseUrl?.Trim() ?? "";
                settings.UserEmail = dto.UserEmail?.Trim() ?? "";
                // If token sent is not masked placeholder, update it
                if (!string.IsNullOrWhiteSpace(dto.ApiToken) && !dto.ApiToken.Contains("••••"))
                {
                    settings.ApiToken = dto.ApiToken.Trim();
                }
                settings.ProjectKey = dto.ProjectKey?.Trim().ToUpper() ?? "";
                settings.IsSyncEnabled = dto.IsSyncEnabled;
                settings.UpdatedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok(new JiraSettingsDto
            {
                JiraBaseUrl = settings.JiraBaseUrl,
                UserEmail = settings.UserEmail,
                ApiToken = "••••••••",
                ProjectKey = settings.ProjectKey,
                IsSyncEnabled = settings.IsSyncEnabled,
                LastSyncDate = settings.LastSyncDate
            });
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
