using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementAPI.Data;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(int userId, string title, string message, string type, int? taskId = null, int? sprintId = null);
        Task NotifyTaskAssignedAsync(int taskId, string taskTitle, int assignedUserId, string assignedByName);
        Task NotifyStatusChangedAsync(int taskId, string taskTitle, string oldStatus, string newStatus, int? assignedUserId, int actingUserId, string actingUserName);
        Task NotifySprintStartedAsync(int sprintId, string sprintName, IEnumerable<int> userIds);
        Task NotifySprintCompletedAsync(int sprintId, string sprintName, IEnumerable<int> userIds);
    }

    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateNotificationAsync(int userId, string title, string message, string type, int? taskId = null, int? sprintId = null)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type,
                    IsRead = false,
                    TaskId = taskId,
                    SprintId = sprintId,
                    CreatedDate = DateTime.Now
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }
            catch
            {
                // Non-blocking notification failure
            }
        }

        public async Task NotifyTaskAssignedAsync(int taskId, string taskTitle, int assignedUserId, string assignedByName)
        {
            await CreateNotificationAsync(
                assignedUserId,
                "Task Assigned",
                $"{assignedByName} assigned you task: \"{taskTitle}\"",
                "TaskAssigned",
                taskId: taskId
            );
        }

        public async Task NotifyStatusChangedAsync(int taskId, string taskTitle, string oldStatus, string newStatus, int? assignedUserId, int actingUserId, string actingUserName)
        {
            // Only notify assignee if someone else moved their task (e.g., Admin)
            if (assignedUserId.HasValue && assignedUserId.Value != actingUserId)
            {
                await CreateNotificationAsync(
                    assignedUserId.Value,
                    "Task Status Changed",
                    $"{actingUserName} moved \"{taskTitle}\" from {oldStatus} to {newStatus}",
                    "StatusChanged",
                    taskId: taskId
                );
            }
        }

        public async Task NotifySprintStartedAsync(int sprintId, string sprintName, IEnumerable<int> userIds)
        {
            var notifications = new List<Notification>();
            foreach (var userId in userIds)
            {
                notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = "Sprint Started",
                    Message = $"Sprint \"{sprintName}\" has been started.",
                    Type = "SprintStarted",
                    IsRead = false,
                    SprintId = sprintId,
                    CreatedDate = DateTime.Now
                });
            }

            if (notifications.Count > 0)
            {
                try
                {
                    _context.Notifications.AddRange(notifications);
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    // Non-blocking
                }
            }
        }

        public async Task NotifySprintCompletedAsync(int sprintId, string sprintName, IEnumerable<int> userIds)
        {
            var notifications = new List<Notification>();
            foreach (var userId in userIds)
            {
                notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = "Sprint Completed",
                    Message = $"Sprint \"{sprintName}\" has been completed.",
                    Type = "SprintCompleted",
                    IsRead = false,
                    SprintId = sprintId,
                    CreatedDate = DateTime.Now
                });
            }

            if (notifications.Count > 0)
            {
                try
                {
                    _context.Notifications.AddRange(notifications);
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    // Non-blocking
                }
            }
        }
    }
}
