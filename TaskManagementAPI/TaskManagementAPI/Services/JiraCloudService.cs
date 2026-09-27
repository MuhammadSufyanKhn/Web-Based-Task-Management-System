using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Services
{
    public interface IJiraCloudService
    {
        Task<JiraTestConnectionResultDto> TestConnectionAsync(string? jiraUrl = null, string? email = null, string? apiToken = null, string? projectKey = null);
        Task<JiraSyncResultDto> SyncIssuesAsync(int triggeredByUserId, string direction);
        Task<bool> ProcessWebhookAsync(string payloadJson, string? signatureHeader = null);
    }

    public class JiraCloudService : IJiraCloudService
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<JiraCloudService> _logger;
        private readonly IActivityLogService _activityLogService;

        public JiraCloudService(
            AppDbContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<JiraCloudService> logger,
            IActivityLogService activityLogService)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _activityLogService = activityLogService;
        }

        private HttpClient CreateJiraClient(string baseUrl, string email, string apiToken)
        {
            var client = _httpClientFactory.CreateClient("JiraClient");
            var cleanUrl = baseUrl.Trim().TrimEnd('/');
            client.BaseAddress = new Uri(cleanUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var authBytes = Encoding.UTF8.GetBytes($"{email.Trim()}:{apiToken.Trim()}");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
            return client;
        }

        public async Task<JiraTestConnectionResultDto> TestConnectionAsync(string? jiraUrl = null, string? email = null, string? apiToken = null, string? projectKey = null)
        {
            var settings = await _context.JiraSettings.OrderByDescending(s => s.Id).FirstOrDefaultAsync();

            var url = !string.IsNullOrWhiteSpace(jiraUrl) ? jiraUrl : settings?.JiraBaseUrl;
            var userEmail = !string.IsNullOrWhiteSpace(email) ? email : settings?.UserEmail;
            var token = !string.IsNullOrWhiteSpace(apiToken) ? apiToken : settings?.ApiToken;
            var projKey = !string.IsNullOrWhiteSpace(projectKey) ? projectKey : settings?.ProjectKey;

            if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(userEmail) || string.IsNullOrWhiteSpace(token))
            {
                return new JiraTestConnectionResultDto
                {
                    Success = false,
                    Message = "Jira URL, User Email, and API Token are required to test the connection."
                };
            }

            try
            {
                using var client = CreateJiraClient(url, userEmail, token);
                var response = await client.GetAsync("/rest/api/3/myself");

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    return new JiraTestConnectionResultDto
                    {
                        Success = false,
                        Message = $"Authentication failed (Status {(int)response.StatusCode}): {response.ReasonPhrase}. Please verify email and API token."
                    };
                }

                var content = await response.Content.ReadAsStringAsync();
                var userNode = JsonNode.Parse(content);
                var displayName = userNode?["displayName"]?.ToString() ?? "Jira User";

                string? projName = null;
                if (!string.IsNullOrWhiteSpace(projKey))
                {
                    var projResponse = await client.GetAsync($"/rest/api/3/project/{projKey.Trim()}");
                    if (projResponse.IsSuccessStatusCode)
                    {
                        var projContent = await projResponse.Content.ReadAsStringAsync();
                        var projNode = JsonNode.Parse(projContent);
                        projName = projNode?["name"]?.ToString();
                    }
                }

                if (settings != null)
                {
                    settings.ConnectionStatus = "Connected";
                    settings.LastSyncError = null;
                    await _context.SaveChangesAsync();
                }

                return new JiraTestConnectionResultDto
                {
                    Success = true,
                    Message = "Connection to Jira Cloud verified successfully.",
                    JiraUserDisplayName = displayName,
                    JiraProjectName = projName
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to Jira Cloud.");
                return new JiraTestConnectionResultDto
                {
                    Success = false,
                    Message = $"Connection failed: {ex.Message}"
                };
            }
        }

        public async Task<JiraSyncResultDto> SyncIssuesAsync(int triggeredByUserId, string direction)
        {
            var settings = await _context.JiraSettings.OrderByDescending(s => s.Id).FirstOrDefaultAsync();
            if (settings == null || string.IsNullOrWhiteSpace(settings.JiraBaseUrl) || string.IsNullOrWhiteSpace(settings.ApiToken))
            {
                return new JiraSyncResultDto
                {
                    Success = false,
                    Message = "Jira settings are not configured. Please enter Jira URL and API Token first."
                };
            }

            var log = new JiraSyncLog
            {
                SyncType = direction,
                TriggeredByUserId = triggeredByUserId,
                CreatedDate = DateTime.Now
            };

            var result = new JiraSyncResultDto();
            using var client = CreateJiraClient(settings.JiraBaseUrl, settings.UserEmail, settings.ApiToken);

            try
            {
                // PULL FROM JIRA TO LOCAL
                if (direction == "pull" || direction == "both")
                {
                    await PullFromJiraAsync(client, settings, result);
                }

                // PUSH FROM LOCAL TO JIRA
                if (direction == "push" || direction == "both")
                {
                    await PushToJiraAsync(client, settings, result);
                }

                result.Success = result.Errors.Count == 0;
                result.Message = result.Success
                    ? $"Sync completed successfully. Processed: {result.ItemsProcessed}, Created: {result.ItemsCreated}, Updated: {result.ItemsUpdated}."
                    : $"Sync completed with {result.Errors.Count} error(s). Processed: {result.ItemsProcessed}, Created: {result.ItemsCreated}, Updated: {result.ItemsUpdated}.";

                log.Status = result.Success ? "Success" : "Partial";
                log.ItemsProcessed = result.ItemsProcessed;
                log.ItemsCreated = result.ItemsCreated;
                log.ItemsUpdated = result.ItemsUpdated;
                log.ItemsFailed = result.ItemsFailed;
                log.ErrorMessage = result.Errors.Count > 0 ? string.Join("; ", result.Errors) : null;

                settings.LastSyncedAt = DateTime.Now;
                settings.LastSyncDate = DateTime.Now;
                settings.ConnectionStatus = "Connected";
                settings.LastSyncError = log.ErrorMessage;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during Jira sync.");
                result.Success = false;
                result.Message = $"Sync failed: {ex.Message}";
                result.Errors.Add(ex.Message);

                log.Status = "Failed";
                log.ErrorMessage = ex.Message;
                settings.LastSyncError = ex.Message;
                settings.ConnectionStatus = "Error";
            }

            _context.JiraSyncLogs.Add(log);
            await _context.SaveChangesAsync();

            return result;
        }

        private async Task PullFromJiraAsync(HttpClient client, JiraSetting settings, JiraSyncResultDto result)
        {
            var projectKey = settings.ProjectKey;
            var jql = string.IsNullOrWhiteSpace(projectKey) ? "order by created desc" : $"project = \"{projectKey}\" order by created desc";
            
            // Atlassian CHANGE-2046: /rest/api/3/search is deprecated/removed in favor of /rest/api/3/search/jql
            HttpResponseMessage response;
            try
            {
                var searchPayload = new
                {
                    jql = jql,
                    maxResults = 50,
                    fields = new[] { "summary", "description", "status", "issuetype", "priority", "created", "duedate" }
                };
                var searchJson = new StringContent(JsonSerializer.Serialize(searchPayload), Encoding.UTF8, "application/json");
                response = await client.PostAsync("/rest/api/3/search/jql", searchJson);

                if (!response.IsSuccessStatusCode)
                {
                    // Fallback to GET /rest/api/3/search/jql
                    var getUrl = $"/rest/api/3/search/jql?jql={Uri.EscapeDataString(jql)}&maxResults=50&fields=summary,description,status,issuetype,priority,created,duedate";
                    response = await client.GetAsync(getUrl);
                }
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Network error connecting to Jira Cloud: {ex.Message}");
                return;
            }

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                result.Errors.Add($"Pull failed ({response.StatusCode}): {err}");
                return;
            }

            var content = await response.Content.ReadAsStringAsync();
            var json = JsonNode.Parse(content);
            var issues = json?["issues"]?.AsArray();
            if (issues == null) return;

            var defaultStatus = await _context.ProjectStatuses.FirstOrDefaultAsync(s => s.Category == "Todo")
                                ?? await _context.ProjectStatuses.FirstOrDefaultAsync();
            var defaultUser = await _context.Users.FirstOrDefaultAsync(u => u.UserRole == "Admin")
                              ?? await _context.Users.FirstOrDefaultAsync();

            var defaultIssueType = await _context.IssueTypes.FirstOrDefaultAsync(it => it.Name == "Task")
                                   ?? await _context.IssueTypes.FirstOrDefaultAsync();
            var defaultPriority = await _context.TaskPriorities.FirstOrDefaultAsync(p => p.Name == "Medium")
                                  ?? await _context.TaskPriorities.FirstOrDefaultAsync();

            if (defaultUser == null) return;

            foreach (var issueNode in issues)
            {
                result.ItemsProcessed++;
                try
                {
                    var jiraKey = issueNode?["key"]?.ToString();
                    var jiraId = issueNode?["id"]?.ToString();
                    var fields = issueNode?["fields"];
                    if (string.IsNullOrWhiteSpace(jiraKey) || fields == null) continue;

                    var summary = fields["summary"]?.ToString() ?? "Untitled Jira Issue";
                    var statusName = fields["status"]?["name"]?.ToString();
                    var issueTypeName = fields["issuetype"]?["name"]?.ToString();
                    var priorityName = fields["priority"]?["name"]?.ToString();

                    // Resolve local status
                    var matchingStatus = defaultStatus;
                    if (!string.IsNullOrEmpty(statusName))
                    {
                        var foundStatus = await _context.ProjectStatuses
                            .FirstOrDefaultAsync(s => s.Name.ToLower() == statusName.ToLower() || s.DisplayName.ToLower() == statusName.ToLower());
                        if (foundStatus != null) matchingStatus = foundStatus;
                    }

                    // Resolve local issue type
                    var matchingType = defaultIssueType;
                    if (!string.IsNullOrEmpty(issueTypeName))
                    {
                        var foundType = await _context.IssueTypes
                            .FirstOrDefaultAsync(it => it.Name.ToLower() == issueTypeName.ToLower());
                        if (foundType != null) matchingType = foundType;
                    }

                    // Resolve local priority
                    var matchingPriority = defaultPriority;
                    if (!string.IsNullOrEmpty(priorityName))
                    {
                        var foundPriority = await _context.TaskPriorities
                            .FirstOrDefaultAsync(p => p.Name.ToLower() == priorityName.ToLower());
                        if (foundPriority != null) matchingPriority = foundPriority;
                    }

                    var cleanBaseUrl = settings.JiraBaseUrl.TrimEnd('/');
                    var issueUrl = $"{cleanBaseUrl}/browse/{jiraKey}";

                    var existingTask = await _context.TaskItems
                        .FirstOrDefaultAsync(t => t.JiraIssueKey == jiraKey || t.JiraIssueId == jiraId);

                    if (existingTask != null)
                    {
                        // Update existing task
                        existingTask.Title = summary;
                        if (matchingStatus != null)
                        {
                            existingTask.StatusId = matchingStatus.Id;
                            existingTask.TaskStatus = matchingStatus.DisplayName;
                        }
                        if (matchingType != null) existingTask.IssueTypeId = matchingType.Id;
                        if (matchingPriority != null)
                        {
                            existingTask.PriorityId = matchingPriority.Id;
                            existingTask.TaskPriority = matchingPriority.Name;
                        }
                        existingTask.JiraIssueUrl = issueUrl;
                        existingTask.LastSyncedAt = DateTime.Now;
                        result.ItemsUpdated++;
                    }
                    else
                    {
                        // Create local task
                        var newTask = new TaskItem
                        {
                            Title = summary,
                            Descriptions = $"Imported from Jira Cloud ({jiraKey})",
                            UserId = defaultUser.UserId,
                            StatusId = matchingStatus?.Id,
                            TaskStatus = matchingStatus?.DisplayName ?? "Pending",
                            IssueTypeId = matchingType?.Id,
                            PriorityId = matchingPriority?.Id,
                            TaskPriority = matchingPriority?.Name ?? "Medium",
                            JiraIssueKey = jiraKey,
                            JiraIssueId = jiraId,
                            JiraIssueUrl = issueUrl,
                            LastSyncedAt = DateTime.Now,
                            CreatedDate = DateTime.Now
                        };
                        _context.TaskItems.Add(newTask);
                        result.ItemsCreated++;
                    }
                }
                catch (Exception ex)
                {
                    result.ItemsFailed++;
                    result.Errors.Add($"Error importing Jira issue: {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task PushToJiraAsync(HttpClient client, JiraSetting settings, JiraSyncResultDto result)
        {
            var projectKey = settings.ProjectKey;
            if (string.IsNullOrWhiteSpace(projectKey))
            {
                result.Errors.Add("Push skipped: Project Key is not configured.");
                return;
            }

            // 1. Query available issue types for this Jira project so we never fail with "Specify a valid issue type"
            var projectIssueTypes = new List<(string Id, string Name, bool IsSubtask)>();
            try
            {
                // Try create metadata endpoint first
                var metaResponse = await client.GetAsync($"/rest/api/3/issue/createmeta/{projectKey.Trim()}/issuetypes");
                if (metaResponse.IsSuccessStatusCode)
                {
                    var metaStr = await metaResponse.Content.ReadAsStringAsync();
                    var metaNode = JsonNode.Parse(metaStr);
                    var typesArray = metaNode?["values"]?.AsArray() ?? metaNode?["issueTypes"]?.AsArray();
                    if (typesArray != null)
                    {
                        foreach (var t in typesArray)
                        {
                            var id = t?["id"]?.ToString();
                            var name = t?["name"]?.ToString();
                            var subtask = t?["subtask"]?.GetValue<bool>() ?? false;
                            if (!string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(name))
                            {
                                projectIssueTypes.Add((id, name, subtask));
                            }
                        }
                    }
                }

                // If createmeta was empty or unsupported, fallback to project details endpoint
                if (!projectIssueTypes.Any())
                {
                    var projResponse = await client.GetAsync($"/rest/api/3/project/{projectKey.Trim()}");
                    if (projResponse.IsSuccessStatusCode)
                    {
                        var projStr = await projResponse.Content.ReadAsStringAsync();
                        var projNode = JsonNode.Parse(projStr);
                        var typesArray = projNode?["issueTypes"]?.AsArray();
                        if (typesArray != null)
                        {
                            foreach (var t in typesArray)
                            {
                                var id = t?["id"]?.ToString();
                                var name = t?["name"]?.ToString();
                                var subtask = t?["subtask"]?.GetValue<bool>() ?? false;
                                if (!string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(name))
                                {
                                    projectIssueTypes.Add((id, name, subtask));
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not fetch issue types for project {ProjectKey}", projectKey);
            }

            // Find local tasks that do not yet have a JiraIssueKey or were recently updated
            var localTasks = await _context.TaskItems
                .Include(t => t.Status)
                .Include(t => t.IssueType)
                .Where(t => !t.IsDeleted && string.IsNullOrEmpty(t.JiraIssueKey))
                .Take(25)
                .ToListAsync();

            var nonSubtaskTypes = projectIssueTypes.Where(t => !t.IsSubtask).ToList();

            foreach (var task in localTasks)
            {
                result.ItemsProcessed++;
                try
                {
                    var localTypeName = task.IssueType?.Name?.Trim() ?? "Task";
                    string? targetTypeId = null;
                    string targetTypeName = localTypeName;

                    if (nonSubtaskTypes.Any())
                    {
                        // 1. Direct name match (e.g. Bug, Story, Task, Epic)
                        var directMatch = nonSubtaskTypes.FirstOrDefault(t => string.Equals(t.Name, localTypeName, StringComparison.OrdinalIgnoreCase));
                        
                        // 2. If task is a bug
                        if (directMatch.Id == null && (localTypeName.Contains("Bug", StringComparison.OrdinalIgnoreCase) || localTypeName.Contains("Defect", StringComparison.OrdinalIgnoreCase)))
                        {
                            directMatch = nonSubtaskTypes.FirstOrDefault(t => t.Name.Contains("Bug", StringComparison.OrdinalIgnoreCase));
                        }

                        // 3. Fallback: match "Task"
                        if (directMatch.Id == null)
                        {
                            directMatch = nonSubtaskTypes.FirstOrDefault(t => string.Equals(t.Name, "Task", StringComparison.OrdinalIgnoreCase));
                        }

                        // 4. Fallback: match "Story" (very common in Jira Scrum templates)
                        if (directMatch.Id == null)
                        {
                            directMatch = nonSubtaskTypes.FirstOrDefault(t => string.Equals(t.Name, "Story", StringComparison.OrdinalIgnoreCase));
                        }

                        // 5. Fallback: first available issue type
                        if (directMatch.Id == null)
                        {
                            directMatch = nonSubtaskTypes.First();
                        }

                        targetTypeId = directMatch.Id;
                        targetTypeName = directMatch.Name;
                    }
                    else
                    {
                        // If project issue types couldn't be loaded, map common types
                        if (localTypeName != "Bug" && localTypeName != "Story" && localTypeName != "Epic")
                        {
                            targetTypeName = "Task";
                        }
                    }

                    // Build issue type field - prefer ID if available, otherwise name
                    object issueTypeField = !string.IsNullOrEmpty(targetTypeId)
                        ? new { id = targetTypeId }
                        : new { name = targetTypeName };

                    var payload = new
                    {
                        fields = new Dictionary<string, object>
                        {
                            { "project", new { key = projectKey } },
                            { "summary", task.Title },
                            { "description", new
                                {
                                    type = "doc",
                                    version = 1,
                                    content = new[]
                                    {
                                        new
                                        {
                                            type = "paragraph",
                                            content = new[]
                                            {
                                                new { type = "text", text = task.Descriptions ?? "Created via TaskManagementSystem" }
                                            }
                                        }
                                    }
                                }
                            },
                            { "issuetype", issueTypeField }
                        }
                    };

                    var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                    var response = await client.PostAsync("/rest/api/3/issue", jsonContent);

                    // If failed specifically with issuetype error and we used ID or Name, retry with alternative name (e.g. Story or Task)
                    if (!response.IsSuccessStatusCode)
                    {
                        var firstErr = await response.Content.ReadAsStringAsync();
                        if (firstErr.Contains("issuetype", StringComparison.OrdinalIgnoreCase))
                        {
                            var altName = targetTypeName == "Task" ? "Story" : "Task";
                            var retryPayload = new
                            {
                                fields = new Dictionary<string, object>
                                {
                                    { "project", new { key = projectKey } },
                                    { "summary", task.Title },
                                    { "description", payload.fields["description"] },
                                    { "issuetype", new { name = altName } }
                                }
                            };
                            var retryContent = new StringContent(JsonSerializer.Serialize(retryPayload), Encoding.UTF8, "application/json");
                            var retryResponse = await client.PostAsync("/rest/api/3/issue", retryContent);
                            if (retryResponse.IsSuccessStatusCode)
                            {
                                response = retryResponse;
                            }
                        }
                    }

                    if (response.IsSuccessStatusCode)
                    {
                        var respStr = await response.Content.ReadAsStringAsync();
                        var respJson = JsonNode.Parse(respStr);
                        var newKey = respJson?["key"]?.ToString();
                        var newId = respJson?["id"]?.ToString();

                        if (!string.IsNullOrEmpty(newKey))
                        {
                            task.JiraIssueKey = newKey;
                            task.JiraIssueId = newId;
                            var cleanBaseUrl = settings.JiraBaseUrl.TrimEnd('/');
                            task.JiraIssueUrl = $"{cleanBaseUrl}/browse/{newKey}";
                            task.LastSyncedAt = DateTime.Now;
                            result.ItemsCreated++;
                        }
                    }
                    else
                    {
                        result.ItemsFailed++;
                        var errStr = await response.Content.ReadAsStringAsync();
                        result.Errors.Add($"Failed to push task #{task.TaskId} '{task.Title}': {errStr}");
                    }
                }
                catch (Exception ex)
                {
                    result.ItemsFailed++;
                    result.Errors.Add($"Exception pushing task #{task.TaskId}: {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task<bool> ProcessWebhookAsync(string payloadJson, string? signatureHeader = null)
        {
            try
            {
                var node = JsonNode.Parse(payloadJson);
                var webhookEvent = node?["webhookEvent"]?.ToString();
                var issueNode = node?["issue"];
                if (issueNode == null) return false;

                var jiraKey = issueNode["key"]?.ToString();
                var jiraId = issueNode["id"]?.ToString();
                if (string.IsNullOrEmpty(jiraKey)) return false;

                var existingTask = await _context.TaskItems
                    .FirstOrDefaultAsync(t => t.JiraIssueKey == jiraKey || t.JiraIssueId == jiraId);

                if (webhookEvent == "jira:issue_deleted" && existingTask != null)
                {
                    existingTask.IsDeleted = true;
                    await _context.SaveChangesAsync();
                    return true;
                }

                var summary = issueNode["fields"]?["summary"]?.ToString();
                var statusName = issueNode["fields"]?["status"]?["name"]?.ToString();

                if (existingTask != null)
                {
                    if (!string.IsNullOrWhiteSpace(summary)) existingTask.Title = summary;
                    if (!string.IsNullOrWhiteSpace(statusName))
                    {
                        var matchingStatus = await _context.ProjectStatuses
                            .FirstOrDefaultAsync(s => s.Name.ToLower() == statusName.ToLower() || s.DisplayName.ToLower() == statusName.ToLower());
                        if (matchingStatus != null)
                        {
                            existingTask.StatusId = matchingStatus.Id;
                            existingTask.TaskStatus = matchingStatus.DisplayName;
                        }
                    }
                    existingTask.LastSyncedAt = DateTime.Now;
                    await _context.SaveChangesAsync();
                    return true;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process Jira webhook payload.");
                return false;
            }
        }
    }
}
