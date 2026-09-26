using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Controllers;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Models;
using Xunit;

namespace TaskManagementAPI.tests.Controllers
{
    public class NotificationsControllerTest
    {
        private static AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users { UserId = 5, UserName = "Alice", Email = "alice@example.com", UserRole = "User" });

            db.Notifications.Add(new Notification
            {
                Id = 1,
                UserId = 5,
                Title = "Task Assigned",
                Message = "You were assigned to TASK-10",
                IsRead = false
            });
            db.Notifications.Add(new Notification
            {
                Id = 2,
                UserId = 5,
                Title = "Sprint Started",
                Message = "Sprint 1 has started",
                IsRead = false
            });

            db.SaveChanges();
            return db;
        }

        private static NotificationsController CreateController(AppDbContext db, int userId = 5)
        {
            var controller = new NotificationsController(db);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, "User")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            return controller;
        }

        [Fact]
        public async Task GetNotifications_ReturnsUnreadCountAndNotifications()
        {
            var db = GetDatabase();
            var controller = CreateController(db, 5);

            var result = await controller.GetNotifications();
            var okResult = Assert.IsType<OkObjectResult>(result);
            var summary = Assert.IsType<NotificationSummaryDto>(okResult.Value);

            Assert.Equal(2, summary.UnreadCount);
            Assert.Equal(2, summary.Notifications.Count);
        }

        [Fact]
        public async Task MarkAsRead_MarksNotificationAsRead()
        {
            var db = GetDatabase();
            var controller = CreateController(db, 5);

            var result = await controller.MarkAsRead(1);
            Assert.IsType<OkObjectResult>(result);

            var item = await db.Notifications.FindAsync(1);
            Assert.NotNull(item);
            Assert.True(item.IsRead);
        }

        [Fact]
        public async Task MarkAllAsRead_MarksAllAsRead()
        {
            var db = GetDatabase();
            var controller = CreateController(db, 5);

            var result = await controller.MarkAllAsRead();
            Assert.IsType<OkObjectResult>(result);

            var unreadCount = await db.Notifications.CountAsync(n => n.UserId == 5 && !n.IsRead);
            Assert.Equal(0, unreadCount);
        }
    }
}
