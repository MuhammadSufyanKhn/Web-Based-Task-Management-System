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
    public class TaskDependenciesControllerTest
    {
        private static AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users { UserId = 1, UserName = "AdminUser", Email = "admin@example.com", UserRole = "Admin" });

            db.TaskItems.Add(new TaskItem { TaskId = 1, Title = "Task 1", UserId = 1 });
            db.TaskItems.Add(new TaskItem { TaskId = 2, Title = "Task 2", UserId = 1 });
            db.TaskItems.Add(new TaskItem { TaskId = 3, Title = "Task 3", UserId = 1 });

            db.SaveChanges();
            return db;
        }

        private static TaskDependenciesController CreateController(AppDbContext db, int userId = 1)
        {
            var activityLog = new ActivityLogService(db);
            var controller = new TaskDependenciesController(db, activityLog);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
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
        public async Task AddDependency_ValidRelationship_ReturnsSuccess()
        {
            var db = GetDatabase();
            var controller = CreateController(db);

            var dto = new CreateDependencyDto
            {
                SourceTaskId = 1,
                TargetTaskId = 2,
                DependencyType = "Blocks"
            };

            var result = await controller.AddDependency(dto);
            Assert.IsType<OkObjectResult>(result);

            var dep = await db.TaskDependencies.FirstOrDefaultAsync();
            Assert.NotNull(dep);
            Assert.Equal(1, dep.SourceTaskId);
            Assert.Equal(2, dep.TargetTaskId);
            Assert.Equal("Blocks", dep.DependencyType);
        }

        [Fact]
        public async Task AddDependency_SelfDependency_ReturnsBadRequest()
        {
            var db = GetDatabase();
            var controller = CreateController(db);

            var dto = new CreateDependencyDto
            {
                SourceTaskId = 1,
                TargetTaskId = 1,
                DependencyType = "Blocks"
            };

            var result = await controller.AddDependency(dto);
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task AddDependency_CircularDependency_ReturnsBadRequest()
        {
            var db = GetDatabase();
            var controller = CreateController(db);

            // 1 blocks 2
            await controller.AddDependency(new CreateDependencyDto
            {
                SourceTaskId = 1,
                TargetTaskId = 2,
                DependencyType = "Blocks"
            });

            // 2 blocks 3
            await controller.AddDependency(new CreateDependencyDto
            {
                SourceTaskId = 2,
                TargetTaskId = 3,
                DependencyType = "Blocks"
            });

            // Attempting 3 blocks 1 -> Circular!
            var circularDto = new CreateDependencyDto
            {
                SourceTaskId = 3,
                TargetTaskId = 1,
                DependencyType = "Blocks"
            };

            var result = await controller.AddDependency(circularDto);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("circular", badRequest.Value?.ToString() ?? "", StringComparison.OrdinalIgnoreCase);
        }
    }
}
