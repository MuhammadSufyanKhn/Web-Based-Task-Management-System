using System;
using System.Threading.Tasks;
using TaskManagementAPI.Data;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Services
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(int taskId, int userId, string action, string? fieldName = null, string? oldValue = null, string? newValue = null, string? details = null);
    }

    public class ActivityLogService : IActivityLogService
    {
        private readonly AppDbContext _context;

        public ActivityLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogActivityAsync(int taskId, int userId, string action, string? fieldName = null, string? oldValue = null, string? newValue = null, string? details = null)
        {
            try
            {
                var log = new TaskActivityLog
                {
                    TaskId = taskId,
                    UserId = userId,
                    Action = action,
                    FieldName = fieldName,
                    OldValue = oldValue,
                    NewValue = newValue,
                    Details = details,
                    CreatedDate = DateTime.Now
                };

                _context.TaskActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch
            {
                // Non-blocking logging failure
            }
        }
    }
}
