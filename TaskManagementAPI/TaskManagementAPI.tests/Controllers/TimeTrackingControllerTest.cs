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
using TaskManagementAPI.Services;
using TaskManagerAPI.Models;
using Xunit;

namespace TaskManagementAPI.tests.Controllers
{
    public class TimeTrackingControllerTest
    {
        private static AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users { UserId = 1, UserName = "AdminUser", Email = "admin@example.com", UserRole = "Admin" });
            db.Users.Add(new Users { UserId = 2, UserName = "DevUser", Email = "dev@example.com", UserRole = "User" });

            db.TaskItems.Add(new TaskItem
            {
                TaskId = 10,
                Title = "Task with Time Tracking",
                UserId = 2,
                OriginalEstimateMinutes = 240,
                RemainingEstimateMinutes = 240,
                TimeSpentMinutes = 0
            });

            db.SaveChanges();
            return db;
        }

        private static TimeTrackingController CreateController(AppDbContext db, int userId = 2, string role = "User")
        {
            var activityLog = new ActivityLogService(db);
            var controller = new TimeTrackingController(db, activityLog);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
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
        public async Task LogWork_OwnerLogsWork_IncreasesTimeSpentAndDecreasesRemaining()
        {
            var db = GetDatabase();
            var controller = CreateController(db, userId: 2, role: "User");

            var dto = new LogWorkDto
            {
                TaskId = 10,
                TimeSpentMinutes = 60,
                Description = "Implemented unit tests"
            };

            var result = await controller.LogWork(dto);
            var okResult = Assert.IsType<OkObjectResult>(result);

            var task = await db.TaskItems.FindAsync(10);
            Assert.NotNull(task);
            Assert.Equal(60, task.TimeSpentMinutes);
            Assert.Equal(180, task.RemainingEstimateMinutes);
        }

        [Fact]
        public async Task LogWork_OtherUserRestricted_ReturnsForbidden()
        {
            var db = GetDatabase();
            // User 3 is not owner of task 10 (owner is 2)
            db.Users.Add(new Users { UserId = 3, UserName = "OtherDev", Email = "other@example.com", UserRole = "User" });
            await db.SaveChangesAsync();

            var controller = CreateController(db, userId: 3, role: "User");

            var dto = new LogWorkDto
            {
                TaskId = 10,
                TimeSpentMinutes = 30
            };

            var result = await controller.LogWork(dto);
            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, statusResult.StatusCode);
        }

        [Fact]
        public async Task UpdateEstimates_UpdatesOriginalAndRemainingEstimates()
        {
            var db = GetDatabase();
            var controller = CreateController(db, userId: 2, role: "User");

            var dto = new UpdateEstimatesDto
            {
                OriginalEstimateMinutes = 300,
                RemainingEstimateMinutes = 150
            };

            var result = await controller.UpdateEstimates(10, dto);
            Assert.IsType<OkObjectResult>(result);

            var task = await db.TaskItems.FindAsync(10);
            Assert.NotNull(task);
            Assert.Equal(300, task.OriginalEstimateMinutes);
            Assert.Equal(150, task.RemainingEstimateMinutes);
        }

        [Fact]
        public async Task GetTaskTimeTracking_ReturnsSummaryAndLogs()
        {
            var db = GetDatabase();
            var controller = CreateController(db, userId: 2, role: "User");

            await controller.LogWork(new LogWorkDto { TaskId = 10, TimeSpentMinutes = 45, Description = "Design docs" });

            var result = await controller.GetTaskTimeTracking(10);
            var okResult = Assert.IsType<OkObjectResult>(result);
            var summary = Assert.IsType<TaskTimeSummaryDto>(okResult.Value);

            Assert.Equal(10, summary.TaskId);
            Assert.Equal(45, summary.TimeSpentMinutes);
            Assert.Single(summary.Logs);
        }
    }
}
