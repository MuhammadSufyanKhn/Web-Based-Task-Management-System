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
    public class ReportsControllerTest
    {
        private readonly Mock<ILogger<ReportsController>> _mockLogger;

        public ReportsControllerTest()
        {
            _mockLogger = new Mock<ILogger<ReportsController>>();
        }

        private static AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users { UserId = 1, UserName = "Alice", Email = "alice@example.com", UserRole = "Admin" });
            db.Users.Add(new Users { UserId = 2, UserName = "Bob", Email = "bob@example.com", UserRole = "User" });

            db.ProjectStatuses.Add(new ProjectStatus { Id = 1, Name = "Pending", DisplayName = "To Do", Category = "Todo", OrderIndex = 1 });
            db.ProjectStatuses.Add(new ProjectStatus { Id = 2, Name = "InProgress", DisplayName = "In Progress", Category = "InProgress", OrderIndex = 2 });
            db.ProjectStatuses.Add(new ProjectStatus { Id = 3, Name = "Completed", DisplayName = "Done", Category = "Done", OrderIndex = 3 });

            db.TaskPriorities.Add(new TaskPriority { Id = 1, Name = "Highest", ColorHex = "#ff5630", OrderIndex = 1 });
            db.TaskPriorities.Add(new TaskPriority { Id = 2, Name = "Medium", ColorHex = "#ffab00", OrderIndex = 2 });

            db.IssueTypes.Add(new IssueType { Id = 1, Name = "Story", Icon = "story", OrderIndex = 1 });
            db.IssueTypes.Add(new IssueType { Id = 2, Name = "Bug", Icon = "bug", OrderIndex = 2 });

            db.SaveChanges();
            return db;
        }

        private static ReportsController CreateController(AppDbContext db)
        {
            var logger = new Mock<ILogger<ReportsController>>().Object;
            var controller = new ReportsController(db, logger);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Admin")
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
        public async Task GetDashboardSummary_CalculatesAccurateTotals()
        {
            using var db = GetDatabase();
            var sprint = new Sprint
            {
                Id = 1,
                Name = "Sprint 1",
                Status = "Active",
                Goal = "Deliver Reports",
                StartDate = DateTime.Now.AddDays(-3),
                EndDate = DateTime.Now.AddDays(7)
            };
            db.Sprints.Add(sprint);

            db.TaskItems.Add(new TaskItem
            {
                TaskId = 1,
                Title = "Task Done",
                StatusId = 3,
                SprintId = 1,
                StoryPoints = 5,
                UserId = 1
            });
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 2,
                Title = "Task In Progress",
                StatusId = 2,
                SprintId = 1,
                StoryPoints = 3,
                UserId = 2
            });
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 3,
                Title = "Backlog Task",
                StatusId = 1,
                SprintId = null,
                StoryPoints = 2,
                UserId = 1
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.GetDashboardSummary();

            var ok = Assert.IsType<OkObjectResult>(result);
            var summary = Assert.IsType<ProjectDashboardSummaryDto>(ok.Value);

            Assert.Equal(3, summary.TotalIssues);
            Assert.Equal(1, summary.CompletedIssues);
            Assert.Equal(1, summary.InProgressIssues);
            Assert.Equal(1, summary.BacklogIssues);
            Assert.Equal(10, summary.TotalStoryPoints);
            Assert.Equal(5, summary.CompletedStoryPoints);
            Assert.Equal(5, summary.RemainingStoryPoints);
            Assert.Equal(50.0, summary.CompletionPercentage);

            Assert.NotNull(summary.ActiveSprint);
            Assert.Equal("Sprint 1", summary.ActiveSprint?.Name);
            Assert.Equal(8, summary.ActiveSprint?.TotalStoryPoints);
            Assert.Equal(5, summary.ActiveSprint?.CompletedStoryPoints);
        }

        [Fact]
        public async Task GetReportBreakdowns_ReturnsCategorizedBreakdowns()
        {
            using var db = GetDatabase();
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 1,
                Title = "Overdue Bug",
                StatusId = 1,
                PriorityId = 1,
                IssueTypeId = 2,
                UserId = 2,
                DueDate = DateTime.Now.AddDays(-2),
                StoryPoints = 3
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.GetReportBreakdowns();

            var ok = Assert.IsType<OkObjectResult>(result);
            var breakdowns = Assert.IsType<ReportBreakdownsDto>(ok.Value);

            Assert.NotEmpty(breakdowns.ByStatus);
            Assert.NotEmpty(breakdowns.ByPriority);
            Assert.NotEmpty(breakdowns.ByAssignee);
            Assert.NotEmpty(breakdowns.ByIssueType);
            Assert.Single(breakdowns.OverdueIssues);
            Assert.Equal("Overdue Bug", breakdowns.OverdueIssues[0].Title);
        }

        [Fact]
        public async Task GetSprintBurndown_ReturnsIdealAndActualPoints()
        {
            using var db = GetDatabase();
            var sprint = new Sprint
            {
                Id = 1,
                Name = "Sprint 1",
                Status = "Active",
                StartDate = DateTime.Today.AddDays(-2),
                EndDate = DateTime.Today.AddDays(5)
            };
            db.Sprints.Add(sprint);

            db.TaskItems.Add(new TaskItem
            {
                TaskId = 1,
                Title = "Task 1",
                SprintId = 1,
                StatusId = 3,
                StoryPoints = 5,
                UpdatedDate = DateTime.Today.AddDays(-1)
            });
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 2,
                Title = "Task 2",
                SprintId = 1,
                StatusId = 2,
                StoryPoints = 5
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.GetSprintBurndown(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            var burndown = Assert.IsType<SprintBurndownDto>(ok.Value);

            Assert.Equal(10, burndown.TotalStoryPoints);
            Assert.Equal(5, burndown.CompletedStoryPoints);
            Assert.NotEmpty(burndown.DataPoints);
        }

        [Fact]
        public async Task GetSprintVelocity_CalculatesAverageVelocityAcrossCompletedSprints()
        {
            using var db = GetDatabase();
            var sprint1 = new Sprint
            {
                Id = 1,
                Name = "Sprint 1",
                Status = "Completed",
                StartDate = DateTime.Today.AddDays(-30),
                EndDate = DateTime.Today.AddDays(-16),
                CompletedDate = DateTime.Today.AddDays(-16)
            };
            var sprint2 = new Sprint
            {
                Id = 2,
                Name = "Sprint 2",
                Status = "Completed",
                StartDate = DateTime.Today.AddDays(-15),
                EndDate = DateTime.Today.AddDays(-1),
                CompletedDate = DateTime.Today.AddDays(-1)
            };
            db.Sprints.AddRange(sprint1, sprint2);

            db.TaskItems.Add(new TaskItem { TaskId = 1, SprintId = 1, StatusId = 3, StoryPoints = 10 });
            db.TaskItems.Add(new TaskItem { TaskId = 2, SprintId = 2, StatusId = 3, StoryPoints = 20 });
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.GetSprintVelocity();

            var ok = Assert.IsType<OkObjectResult>(result);
            var velocity = Assert.IsType<SprintVelocityReportDto>(ok.Value);

            Assert.Equal(2, velocity.Sprints.Count);
            Assert.Equal(15.0, velocity.AverageVelocity); // (10 + 20) / 2
        }

        [Fact]
        public async Task GetSprintDetailedReport_SeparatesCompletedAndIncompleteIssues()
        {
            using var db = GetDatabase();
            var sprint = new Sprint { Id = 1, Name = "Sprint Alpha", Status = "Active" };
            db.Sprints.Add(sprint);

            db.TaskItems.Add(new TaskItem { TaskId = 1, Title = "Finished Task", SprintId = 1, StatusId = 3, StoryPoints = 4 });
            db.TaskItems.Add(new TaskItem { TaskId = 2, Title = "Pending Task", SprintId = 1, StatusId = 1, StoryPoints = 6 });
            await db.SaveChangesAsync();

            var controller = CreateController(db);
            var result = await controller.GetSprintDetailedReport(1);

            var ok = Assert.IsType<OkObjectResult>(result);
            var report = Assert.IsType<SprintDetailedReportDto>(ok.Value);

            Assert.Equal("Sprint Alpha", report.Name);
            Assert.Equal(10, report.TotalStoryPoints);
            Assert.Equal(4, report.CompletedStoryPoints);
            Assert.Equal(6, report.RemainingStoryPoints);
            Assert.Single(report.CompletedIssues);
            Assert.Single(report.IncompleteIssues);
            Assert.Equal("Finished Task", report.CompletedIssues[0].Title);
            Assert.Equal("Pending Task", report.IncompleteIssues[0].Title);
        }
    }
}
