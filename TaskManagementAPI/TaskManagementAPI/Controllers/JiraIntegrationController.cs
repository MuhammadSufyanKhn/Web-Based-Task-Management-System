using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagementAPI.Services;

namespace TaskManagementAPI.Controllers
{
    [Authorize]
    [Route("api/jira")]
    [ApiController]
    public class JiraIntegrationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IJiraCloudService _jiraService;

        public JiraIntegrationController(AppDbContext context, IJiraCloudService jiraService)
        {
            _context = context;
            _jiraService = jiraService;
        }

        private int GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            var settings = await _context.JiraSettings.OrderByDescending(s => s.Id).FirstOrDefaultAsync();
            if (settings == null)
            {
                return Ok(new JiraConfigDto
                {
                    JiraUrl = "",
                    ProjectKey = "",
                    Email = "",
                    AutoSync = false,
                    ConnectionStatus = "Disconnected",
                    HasApiToken = false
                });
            }

            return Ok(new JiraConfigDto
            {
                JiraUrl = settings.JiraBaseUrl,
                ProjectKey = settings.ProjectKey,
                Email = settings.UserEmail,
                AutoSync = settings.AutoSync,
                ConnectionStatus = settings.ConnectionStatus ?? (string.IsNullOrEmpty(settings.ApiToken) ? "Disconnected" : "Connected"),
                LastSyncedAt = settings.LastSyncedAt ?? settings.LastSyncDate,
                LastSyncError = settings.LastSyncError,
                HasApiToken = !string.IsNullOrEmpty(settings.ApiToken)
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("test")]
        public async Task<IActionResult> TestConnection([FromBody] JiraConfigDto? dto)
        {
            var result = await _jiraService.TestConnectionAsync(
                dto?.JiraUrl,
                dto?.Email,
                dto?.ApiToken,
                dto?.ProjectKey
            );

            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("sync")]
        public async Task<IActionResult> SyncNow([FromBody] JiraSyncRequestDto? dto)
        {
            var currentUserId = GetCurrentUserId();
            var direction = dto?.Direction?.ToLower() ?? "both";
            if (direction != "push" && direction != "pull" && direction != "both")
            {
                direction = "both";
            }

            var result = await _jiraService.SyncIssuesAsync(currentUserId, direction);
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("disconnect")]
        public async Task<IActionResult> Disconnect()
        {
            var settings = await _context.JiraSettings.OrderByDescending(s => s.Id).FirstOrDefaultAsync();
            if (settings != null)
            {
                settings.ApiToken = "";
                settings.ConnectionStatus = "Disconnected";
                settings.IsSyncEnabled = false;
                settings.AutoSync = false;
                settings.UpdatedDate = DateTime.Now;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Jira Cloud disconnected successfully." });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("logs")]
        public async Task<IActionResult> GetSyncLogs()
        {
            var logs = await _context.JiraSyncLogs
                .Include(l => l.TriggeredByUser)
                .OrderByDescending(l => l.CreatedDate)
                .Take(30)
                .Select(l => new JiraSyncLogDto
                {
                    Id = l.Id,
                    SyncType = l.SyncType,
                    Status = l.Status,
                    ItemsProcessed = l.ItemsProcessed,
                    ItemsCreated = l.ItemsCreated,
                    ItemsUpdated = l.ItemsUpdated,
                    ItemsFailed = l.ItemsFailed,
                    ErrorMessage = l.ErrorMessage,
                    TriggeredByName = l.TriggeredByUser != null ? l.TriggeredByUser.UserName : "System",
                    CreatedDate = l.CreatedDate
                })
                .ToListAsync();

            return Ok(logs);
        }

        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var payload = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(payload))
            {
                return BadRequest("Empty payload.");
            }

            var success = await _jiraService.ProcessWebhookAsync(payload);
            return Ok(new { received = true, processed = success });
        }
    }
}
