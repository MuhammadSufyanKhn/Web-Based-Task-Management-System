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
using TaskManagerAPI.Models;

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
            var webhookUrl = $"{Request.Scheme}://{Request.Host}/api/jira/webhook";

            if (settings == null)
            {
                return Ok(new JiraConfigDto
                {
                    JiraUrl = "",
                    JiraBaseUrl = "",
                    ProjectKey = "",
                    Email = "",
                    UserEmail = "",
                    AutoSync = false,
                    ConnectionStatus = "Disconnected",
                    HasApiToken = false,
                    IsConfigured = false,
                    MaskedApiToken = "",
                    WebhookUrl = webhookUrl
                });
            }

            var hasToken = !string.IsNullOrEmpty(settings.ApiToken);
            return Ok(new JiraConfigDto
            {
                JiraUrl = settings.JiraBaseUrl,
                JiraBaseUrl = settings.JiraBaseUrl,
                ProjectKey = settings.ProjectKey,
                Email = settings.UserEmail,
                UserEmail = settings.UserEmail,
                AutoSync = settings.AutoSync,
                ConnectionStatus = settings.ConnectionStatus ?? (hasToken ? "Connected" : "Disconnected"),
                LastSyncedAt = settings.LastSyncDate,
                LastSyncError = settings.LastSyncError,
                HasApiToken = hasToken,
                IsConfigured = hasToken && !string.IsNullOrWhiteSpace(settings.JiraBaseUrl),
                MaskedApiToken = hasToken ? "••••••••" : "",
                WebhookUrl = webhookUrl
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("config")]
        [HttpPut("config")]
        public async Task<IActionResult> SaveConfig([FromBody] JiraConfigDto? dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Invalid configuration payload." });
            }

            var url = !string.IsNullOrWhiteSpace(dto.JiraBaseUrl) ? dto.JiraBaseUrl : dto.JiraUrl;
            var email = !string.IsNullOrWhiteSpace(dto.UserEmail) ? dto.UserEmail : dto.Email;

            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { message = "Jira Base URL is required." });
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "User Email is required." });
            }

            if (string.IsNullOrWhiteSpace(dto.ProjectKey))
            {
                return BadRequest(new { message = "Jira Project Key is required." });
            }

            var currentUserId = GetCurrentUserId();
            var settings = await _context.JiraSettings.OrderByDescending(s => s.Id).FirstOrDefaultAsync();

            if (settings == null)
            {
                settings = new JiraSetting
                {
                    JiraBaseUrl = url.Trim(),
                    UserEmail = email.Trim(),
                    ApiToken = dto.ApiToken?.Trim() ?? "",
                    ProjectKey = dto.ProjectKey.Trim().ToUpper(),
                    AutoSync = dto.AutoSync,
                    IsSyncEnabled = dto.AutoSync,
                    ConnectionStatus = string.IsNullOrWhiteSpace(dto.ApiToken) ? "Disconnected" : "Connected",
                    CreatedDate = DateTime.Now,
                    UpdatedBy = currentUserId
                };
                _context.JiraSettings.Add(settings);
            }
            else
            {
                settings.JiraBaseUrl = url.Trim();
                settings.UserEmail = email.Trim();
                if (!string.IsNullOrWhiteSpace(dto.ApiToken) && !dto.ApiToken.Contains("••••"))
                {
                    settings.ApiToken = dto.ApiToken.Trim();
                }
                settings.ProjectKey = dto.ProjectKey.Trim().ToUpper();
                settings.AutoSync = dto.AutoSync;
                settings.IsSyncEnabled = dto.AutoSync;
                if (!string.IsNullOrWhiteSpace(settings.ApiToken))
                {
                    settings.ConnectionStatus = "Connected";
                }
                settings.UpdatedDate = DateTime.Now;
                settings.UpdatedBy = currentUserId;
            }

            await _context.SaveChangesAsync();

            var webhookUrl = $"{Request.Scheme}://{Request.Host}/api/jira/webhook";
            var hasToken = !string.IsNullOrEmpty(settings.ApiToken);

            return Ok(new JiraConfigDto
            {
                JiraUrl = settings.JiraBaseUrl,
                JiraBaseUrl = settings.JiraBaseUrl,
                ProjectKey = settings.ProjectKey,
                Email = settings.UserEmail,
                UserEmail = settings.UserEmail,
                AutoSync = settings.AutoSync,
                ConnectionStatus = settings.ConnectionStatus ?? (hasToken ? "Connected" : "Disconnected"),
                LastSyncedAt = settings.LastSyncDate,
                LastSyncError = settings.LastSyncError,
                HasApiToken = hasToken,
                IsConfigured = hasToken,
                MaskedApiToken = hasToken ? "••••••••" : "",
                WebhookUrl = webhookUrl
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("test")]
        public async Task<IActionResult> TestConnection([FromBody] JiraConfigDto? dto)
        {
            var url = !string.IsNullOrWhiteSpace(dto?.JiraBaseUrl) ? dto.JiraBaseUrl : dto?.JiraUrl;
            var email = !string.IsNullOrWhiteSpace(dto?.UserEmail) ? dto.UserEmail : dto?.Email;

            var result = await _jiraService.TestConnectionAsync(
                url,
                email,
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
