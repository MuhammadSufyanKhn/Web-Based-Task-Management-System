using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using TaskManagementAPI.Controllers;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Models;
using Xunit;

namespace TaskManagementAPI.tests.Controllers
{
    public class SprintControllerTest
    {
        private readonly Mock<ILogger<SprintController>> _mockLogger;

        public SprintControllerTest()
        {
            _mockLogger = new Mock<ILogger<SprintController>>();
        }

        private static AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users { UserId = 1, UserName = "AdminUser", Email = "admin@example.com", UserRole = "Admin" });
            db.Users.Add(new Users { UserId = 2, UserName = "DevUser", Email = "dev@example.com", UserRole = "User" });

            db.ProjectStatuses.Add(new ProjectStatus { Id = 1, Name = "Pending", DisplayName = "To Do", Category = "Todo" });
            db.ProjectStatuses.Add(new ProjectStatus { Id = 2, Name = "Completed", DisplayName = "Done", Category = "Done" });

            db.SaveChanges();
            return db;
        }

        private static SprintController CreateController(AppDbContext db, int userId = 1, string role = "Admin")
        {
            var logger = new Mock<ILogger<SprintController>>().Object;
            var controller = new SprintController(db, logger);

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
        public async Task GetAllSprints_ReturnsSprintsWithCalculations()
        {
            using var db = GetDatabase();
            var sprint = new Sprint
            {
                Id = 1,
                Name = "Sprint 1",
                Goal = "Complete MVP",
                Status = "Active",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14)
            };
            db.Sprints.Add(sprint);

            db.TaskItems.Add(new TaskItem
            {
                TaskId = 10,
                Title = "Task A",
                SprintId = 1,
                StatusId = 1,
                StoryPoints = 3,
                UserId = 2
            });
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 11,
                Title = "Task B",
                SprintId = 1,
                StatusId = 2,
                StoryPoints = 5,
                UserId = 2
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.GetAllSprints();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<List<SprintSummaryDto>>(okResult.Value);
            Assert.Single(list);
            Assert.Equal("Sprint 1", list[0].Name);
            Assert.Equal(2, list[0].TotalIssues);
            Assert.Equal(1, list[0].CompletedIssues);
            Assert.Equal(8, list[0].TotalStoryPoints);
            Assert.Equal(5, list[0].CompletedStoryPoints);
        }

        [Fact]
        public async Task CreateSprint_SetsFutureStatusAndPersists()
        {
            using var db = GetDatabase();
            var controller = CreateController(db);

            var dto = new CreateSprintDto
            {
                Name = "Sprint 2",
                Goal = "Deliver Billing Module",
                StartDate = DateTime.UtcNow.AddDays(7),
                EndDate = DateTime.UtcNow.AddDays(21)
            };

            var result = await controller.CreateSprint(dto);
            var okResult = Assert.IsType<OkObjectResult>(result);

            var sprintInDb = await db.Sprints.FirstOrDefaultAsync(s => s.Name == "Sprint 2");
            Assert.NotNull(sprintInDb);
            Assert.Equal("Future", sprintInDb.Status);
            Assert.Equal("Deliver Billing Module", sprintInDb.Goal);
        }

        [Fact]
        public async Task StartSprint_ChangesStatusToActive()
        {
            using var db = GetDatabase();
            var sprint = new Sprint
            {
                Id = 1,
                Name = "Sprint 1",
                Status = "Future",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14)
            };
            db.Sprints.Add(sprint);
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.StartSprint(1, new StartSprintDto
            {
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14)
            });

            var okResult = Assert.IsType<OkObjectResult>(result);
            var updatedSprint = await db.Sprints.FindAsync(1);
            Assert.NotNull(updatedSprint);
            Assert.Equal("Active", updatedSprint.Status);
        }

        [Fact]
        public async Task CompleteSprint_RedistributesUnfinishedIssues()
        {
            using var db = GetDatabase();
            var sprint1 = new Sprint { Id = 1, Name = "Sprint 1", Status = "Active" };
            var sprint2 = new Sprint { Id = 2, Name = "Sprint 2", Status = "Future" };
            db.Sprints.AddRange(sprint1, sprint2);

            // Incomplete task
            var incompleteTask = new TaskItem
            {
                TaskId = 21,
                Title = "Incomplete Task",
                SprintId = 1,
                StatusId = 1,
                UserId = 2
            };
            // Complete task
            var completeTask = new TaskItem
            {
                TaskId = 22,
                Title = "Done Task",
                SprintId = 1,
                StatusId = 2,
                UserId = 2
            };
            db.TaskItems.AddRange(incompleteTask, completeTask);
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.CompleteSprint(1, new CompleteSprintDto
            {
                MoveUnfinishedToSprintId = 2
            });

            var okResult = Assert.IsType<OkObjectResult>(result);
            var finishedSprint = await db.Sprints.FindAsync(1);
            Assert.Equal("Completed", finishedSprint?.Status);

            var unfinishedInDb = await db.TaskItems.FindAsync(21);
            Assert.Equal(2, unfinishedInDb?.SprintId); // Moved to Sprint 2

            var doneInDb = await db.TaskItems.FindAsync(22);
            Assert.Equal(1, doneInDb?.SprintId); // Stays in completed Sprint 1
        }
    }
}
