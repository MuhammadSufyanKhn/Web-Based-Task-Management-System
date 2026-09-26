using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using TaskManagementAPI.Controllers;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Models;
using Xunit;

namespace TaskManagementAPI.tests.Controllers
{
    public class KanbanControllerTest
    {
        private readonly Mock<ILogger<KanbanController>> _mockLogger;

        public KanbanControllerTest()
        {
            _mockLogger = new Mock<ILogger<KanbanController>>();
        }

        private static AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users { UserId = 1, UserName = "AdminUser", Email = "admin@example.com", UserRole = "Admin", IsDeleted = false });
            db.Users.Add(new Users { UserId = 2, UserName = "UserAlice", Email = "alice@example.com", UserRole = "User", IsDeleted = false });
            db.Users.Add(new Users { UserId = 3, UserName = "UserBob", Email = "bob@example.com", UserRole = "User", IsDeleted = false });

            db.ProjectStatuses.Add(new ProjectStatus { Id = 1, Name = "Pending", DisplayName = "To Do", Category = "Todo", OrderIndex = 1, IsActive = true });
            db.ProjectStatuses.Add(new ProjectStatus { Id = 2, Name = "InProgress", DisplayName = "In Progress", Category = "InProgress", OrderIndex = 2, IsActive = true });
            db.ProjectStatuses.Add(new ProjectStatus { Id = 3, Name = "Completed", DisplayName = "Done", Category = "Done", OrderIndex = 3, IsActive = true });

            // Task 10 owned by Alice (UserId = 2)
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 10,
                Title = "Alice's Task",
                Descriptions = "Alice work",
                TaskStatus = "Pending",
                StatusId = 1,
                UserId = 2,
                CreatedBy = 2,
                IsDeleted = false,
                BoardOrder = 0
            });

            // Task 20 owned by Bob (UserId = 3)
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 20,
                Title = "Bob's Task",
                Descriptions = "Bob work",
                TaskStatus = "Pending",
                StatusId = 1,
                UserId = 3,
                CreatedBy = 3,
                IsDeleted = false,
                BoardOrder = 1
            });

            db.SaveChanges();
            return db;
        }

        private static void SetUserContext(KanbanController controller, int userId, string role)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task MoveCard_UserMovesOwnTask_ReturnsOk()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice

            var dto = new MoveCardDto
            {
                TaskId = 10, // Alice's task
                TargetStatusId = 2,
                TargetPosition = 0
            };

            var result = await controller.MoveCard(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            var updatedTask = await db.TaskItems.FindAsync(10);
            Assert.Equal(2, updatedTask?.StatusId);
        }

        [Fact]
        public async Task MoveCard_UserMovesAnotherUsersTask_Returns403Forbidden()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice

            var dto = new MoveCardDto
            {
                TaskId = 20, // Bob's task
                TargetStatusId = 2,
                TargetPosition = 0
            };

            var result = await controller.MoveCard(dto);

            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task MoveCard_AdminMovesAnyTask_ReturnsOk()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 1, "Admin");

            var dto = new MoveCardDto
            {
                TaskId = 20, // Bob's task
                TargetStatusId = 2,
                TargetPosition = 0
            };

            var result = await controller.MoveCard(dto);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task UpdateTaskDetail_UserEditsOwnTask_ReturnsOk()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice

            var dto = new UpdateTaskDetailDto
            {
                Title = "Updated Alice Task",
                Descriptions = "Updated description"
            };

            var result = await controller.UpdateTaskDetail(10, dto);

            Assert.IsType<OkObjectResult>(result);
            var task = await db.TaskItems.FindAsync(10);
            Assert.Equal("Updated Alice Task", task?.Title);
        }

        [Fact]
        public async Task UpdateTaskDetail_UserEditsAnotherUsersTask_Returns403Forbidden()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice tries to edit Bob's task

            var dto = new UpdateTaskDetailDto
            {
                Title = "Hacked Bob Task"
            };

            var result = await controller.UpdateTaskDetail(20, dto);

            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task UpdateTaskDetail_UserTriesToReassignTask_Returns403Forbidden()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice tries to reassign her task to Bob

            var dto = new UpdateTaskDetailDto
            {
                Title = "Reassign Attempt",
                UserId = 3 // Bob
            };

            var result = await controller.UpdateTaskDetail(10, dto);

            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task UpdateTaskDetail_AdminCanReassignTask_ReturnsOk()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 1, "Admin");

            var dto = new UpdateTaskDetailDto
            {
                Title = "Admin Reassignment",
                UserId = 3
            };

            var result = await controller.UpdateTaskDetail(10, dto);

            Assert.IsType<OkObjectResult>(result);
            var task = await db.TaskItems.FindAsync(10);
            Assert.Equal(3, task?.UserId);
        }

        [Fact]
        public async Task CreateTask_UserAssignsToAnotherUser_Returns403Forbidden()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice

            var dto = new CreateKanbanTaskDto
            {
                Title = "Unauthorized Assign Task",
                UserId = 3 // Bob
            };

            var result = await controller.CreateTask(dto);

            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task CreateTask_UserAssignsToSelf_ReturnsOk()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice

            var dto = new CreateKanbanTaskDto
            {
                Title = "Self Assigned Task",
                UserId = 2
            };

            var result = await controller.CreateTask(dto);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task DeleteTask_UserDeletesAnotherUsersTask_Returns403Forbidden()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice tries to delete Bob's task

            var result = await controller.DeleteTask(20);

            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        }

        [Fact]
        public async Task DeleteTask_UserDeletesOwnTask_ReturnsOk()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 2, "User"); // Alice deletes Alice's task

            var result = await controller.DeleteTask(10);

            Assert.IsType<OkObjectResult>(result);
            var task = await db.TaskItems.FindAsync(10);
            Assert.True(task?.IsDeleted);
        }

        [Fact]
        public async Task DeleteTask_AdminDeletesAnyTask_ReturnsOk()
        {
            var db = GetDatabase();
            var controller = new KanbanController(db, _mockLogger.Object);
            SetUserContext(controller, 1, "Admin");

            var result = await controller.DeleteTask(20);

            Assert.IsType<OkObjectResult>(result);
            var task = await db.TaskItems.FindAsync(20);
            Assert.True(task?.IsDeleted);
        }
    }
}
