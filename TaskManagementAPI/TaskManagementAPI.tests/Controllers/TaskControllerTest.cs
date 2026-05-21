using Castle.Core.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using TaskManagementAPI.Controllers;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models.DTOS;
using TaskManagerAPI.Helpers;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.tests.Controllers
{
    public class TaskControllerTest
    {
        private readonly Mock<ILogger<TaskController>>  _Mocklogger;
        private readonly JwtService _jwtService;

        public TaskControllerTest()
        {
            _Mocklogger = new Mock<ILogger<TaskController>>();
            var mockConfig = new Dictionary<string, string?>
            {
                { "Jwt:Key","YeEkFakeSecretKeyHaiTestingKeLiye123456789!"},
                { "Jwt:Issuer", "TestIssuer"},
                { "Jwt:Audience", "TestAudience" }
            };

            var fakeConfig = new ConfigurationBuilder().AddInMemoryCollection(mockConfig).Build();

            _jwtService = new JwtService(fakeConfig);
        }

        private AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users { UserId = 1, UserName = "AdminUser",Email = "Admin@gmail.com", UserRole = "Admin", IsDeleted = false });
            db.Users.Add(new Users { UserId = 2, UserName = "TestUser",Email = "Testuser1@gmail.com", UserRole = "User", IsDeleted = false });
            db.Users.Add(new Users { UserId = 3, UserName = "ActiveUser2", Email = "Usertest2@gmail.com.com", UserRole = "User", IsDeleted = false });
            db.Users.Add(new Users { UserId = 4, UserName = "DeletedUser", Email = "Deleteuser@gmail.com", UserRole = "User", IsDeleted = true });

            db.TaskItems.Add(new TaskItem
            {
                TaskId = 1,
                Title = "Unit Test",
                Descriptions = "Testing description",
                TaskStatus = "Pending",
                TaskPriority = "Medium",
                DueDate = DateTime.Now.AddDays(3),
                UserId = 2,
                CreatedBy = 2,
                IsDeleted = false,
                CreatedDate = DateTime.Now
            });
            db.TaskItems.Add(new TaskItem
            {
                TaskId = 2,
                Title = "Unit Test 2",
                Descriptions = "Testing description",
                TaskStatus = "InProgress",
                TaskPriority = "Medium",
                DueDate = DateTime.Now.AddDays(2),
                UserId = 2,
                CreatedBy = 2, 
                IsDeleted = false,
                CreatedDate= DateTime.Now,
                          
            });
            db.TaskItems.Add(new TaskItem 
            { 
                TaskId = 3,
                Title = "Unit Test 3",
                Descriptions = "Testing description 3",
                TaskStatus = "Completed",
                TaskPriority = "High",
                DueDate = DateTime.Now.AddDays(2),
                UserId = 2, 
                IsDeleted = true ,
                CreatedDate = DateTime.Now,
                CreatedBy= 2
            }); 

            db.TaskItems.Add(new TaskItem 
            { 
                TaskId = 4,
                Title = "Unit Test 4",
                Descriptions = "Testing description 4",
                TaskStatus = "Completed",
                TaskPriority = "High",
                DueDate = DateTime.Now.AddDays(2),
                UserId = 3, 
                IsDeleted = false ,
                CreatedBy= 3,
                CreatedDate = DateTime.Now
            });

            db.SaveChanges();

            return db;
        }

        private void SetUserContext(TaskController taskController, int loggedInUserId = 2, string role = "User")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, loggedInUserId.ToString()),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimPrincipal = new ClaimsPrincipal(identity);

            taskController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimPrincipal }
            };
        }
        [Fact]
        public void TaskController_AdminStats_AdminLoggedIn_ReturnCorrectStats()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, loggedInUserId: 1, role: "Admin");

            // Act
            var result = controller.AdminStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            // AdminStats returns a plain object, NOT an array
            Assert.Equal(2, element.GetProperty("TotalUsers").GetInt32());      // user 2 & 3
            Assert.Equal(3, element.GetProperty("TotalTasks").GetInt32());      // tasks 1, 2, 4
            Assert.Equal(1, element.GetProperty("PendingTasks").GetInt32());    // task 1
            Assert.Equal(1, element.GetProperty("InProgressTasks").GetInt32()); // task 2
            Assert.Equal(1, element.GetProperty("CompletedTasks").GetInt32());  // task 4
        }

        [Fact]
        public void TaskController_GetAllUsers_ActiveUsersExist_ReturnOk()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, loggedInUserId: 1, role: "Admin");

            // Act
            var result = controller.GetAllUsers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            // user 2  + user 3 = 2 active non-admin users
            Assert.Equal(2, element.GetArrayLength());

            var firstUser = element[0];
            Assert.Equal(2, firstUser.GetProperty("UserId").GetInt32());
            Assert.Equal("TestUser", firstUser.GetProperty("UserName").GetString());
            // User 2 has 2 active tasks 
            Assert.Equal(2, firstUser.GetProperty("TotalTasks").GetInt32());

            var secondUser = element[1];
            Assert.Equal(3, secondUser.GetProperty("UserId").GetInt32());
            Assert.Equal("ActiveUser2", secondUser.GetProperty("UserName").GetString());
            // User 3 has 1 active task
            Assert.Equal(1, secondUser.GetProperty("TotalTasks").GetInt32());
        }

        [Fact]
        public void TaskController_GetAllUsers_NoUserExist_RReturnEmpty()
        {
            // Arrange 
            var db = GetDatabase();
            var activeUsers = db.Users.Where(u => u.UserRole == "User" && u.IsDeleted == false).ToList();
            foreach (var user in activeUsers)
            {
                user.IsDeleted = true;
            }
            db.SaveChanges();

            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, loggedInUserId: 1, role: "Admin");

            // Act
            var result = controller.GetAllUsers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            Assert.Equal(0, element.GetArrayLength());
        }

        [Fact]
        public void TaskController_GetAllTask_ActiveTasksExist_ReturnOk()
        {
            //Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1, "Admin");

            //Act
            var result = controller.GetAllTasks();

            //Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            Assert.Equal(3, element.GetArrayLength());
        }
        [Fact]
        public void TaskController_GetAllTasks_NoTaskExist_ReturnEmpty()
        {
            // Arrange
            var db = GetDatabase();

            var activeTasks = db.TaskItems.Where(t => t.IsDeleted == false).ToList();
            foreach (var task in activeTasks)
            {
                task.IsDeleted = true;
            }
            db.SaveChanges();

            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, loggedInUserId: 1, role: "Admin");

            // Act
            var result = controller.GetAllTasks();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            
            Assert.Equal(0, element.GetArrayLength());
        }

        [Fact]
        public void TaskController_DashboardStats_UserSeesTheirStats_ReturnStats()
        {
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2, "User");

            var result = controller.DashboardStats();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            Assert.Equal(1, element.GetProperty("PendingCount").GetInt32());
            Assert.Equal(1, element.GetProperty("InProgressCount").GetInt32());
            Assert.Equal(0, element.GetProperty("CompletedCount").GetInt32());
        }

        [Fact]
        public void TaskController_DashboardStats_AdminSeesTheirStats_ReturnStats()
        {
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1, "Admin");

            var result = controller.DashboardStats();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            Assert.Equal(1, element.GetProperty("PendingCount").GetInt32());
            Assert.Equal(1, element.GetProperty("InProgressCount").GetInt32());
            Assert.Equal(1, element.GetProperty("CompletedCount").GetInt32());
        }

        [Fact]
        public void TaskController_MyTask_UserHasTasks_ReturnOk()
        {
            // Arrange
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2, "User");

            // Act
            var result = controller.MyTask();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var tasks = Assert.IsAssignableFrom<IEnumerable<TaskItem>>(okResult.Value);

            Assert.Equal(2, tasks.Count());
            Assert.All(tasks, t => Assert.Equal(2, t.UserId));
        }
        [Fact]
        public void TaskController_MyTask_AdminSeesAllTasks_ReturnOk()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1, "Admin");

            // Act
            var result = controller.MyTask();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public void TaskController_GetTasksByUserId_UserExists_ReturnOkWithTasks()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);

            SetUserContext(controller, loggedInUserId: 1, role: "Admin");

            int targetUserId = 2;

            // Act
            var result = controller.GetTasksByUserId(targetUserId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var tasks = Assert.IsAssignableFrom<IEnumerable<TaskItem>>(okResult.Value);

            Assert.Equal(2, tasks.Count());
            Assert.All(tasks, t => Assert.Equal(targetUserId, t.UserId));
            Assert.All(tasks, t => Assert.False(t.IsDeleted));
        }

        [Fact]
        public void TaskController_GetTasksByUserId_UserNotFoundOrDeleted_ReturnNotFound()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, loggedInUserId: 1, role: "Admin");

            int nonExistentUserId = 99;

            int deletedUserId = 4;

            // Act
            var resultNonExistent = controller.GetTasksByUserId(nonExistentUserId);
            var resultDeleted = controller.GetTasksByUserId(deletedUserId);

            // Assert
            var notFoundResult1 = Assert.IsType<NotFoundObjectResult>(resultNonExistent);
            Assert.Equal("User not found", notFoundResult1.Value);

            var notFoundResult2 = Assert.IsType<NotFoundObjectResult>(resultDeleted);
            Assert.Equal("User not found", notFoundResult2.Value);
        }

        [Fact]
        public void TaskController_CreateTask_NoUserIdProvided_AssignsToLoggedInUser()
        {
            //Assert
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 3, "User");

            var dto = new CreateTaskDto
            {
                Title = "New Task",
                Descriptions = "Do something",
                DueDate = DateTime.Now.AddDays(5),
                TaskPriority = "High"
            };

            // Act
            var result = controller.CreateTask(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var newTask = db.TaskItems.FirstOrDefault(t => t.Title == "New Task");
            Assert.NotNull(newTask);
            Assert.Equal(3, newTask.UserId);
            Assert.Equal("Pending", newTask.TaskStatus);
            Assert.Equal(3, newTask.CreatedBy);
        }

        [Fact]
        public void TaskController_CreateTask_AdminAssignsTaskToUser_AssignsCorrectly()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1, "Admin");

            var dto = new CreateTaskDto
            {
                Title = "Admin Task",
                Descriptions = "Assigned by admin",
                DueDate = DateTime.Now.AddDays(2),
                TaskPriority = "Low",
                UserId = 1    
            };

            // Act
            var result = controller.CreateTask(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var newTask = db.TaskItems.FirstOrDefault(t => t.Title == "Admin Task");
            Assert.NotNull(newTask);
            Assert.Equal(1, newTask.UserId);
            Assert.Equal(1, newTask.CreatedBy);
        }

        [Fact]
        public void TaskController_DeleteTask_UserDeletesTheirTask_ReturnOkAndSoftDeleted()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2, "User");

            // Act
            var result = controller.DeleteTask(2);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Task deleted successfully.", okResult.Value);

            var deletedTask = db.TaskItems.Find(2);
            Assert.NotNull(deletedTask);
            Assert.True(deletedTask.IsDeleted);
        }


        [Fact]
        public void TaskController_DeleteTask_AdminDeletesAnyTask_ReturnOk()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1, "Admin");

            // Act
            var result = controller.DeleteTask(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Task deleted successfully.", okResult.Value);
           var deletedTask = db.TaskItems.Find(1);
Assert.NotNull(deletedTask);
Assert.True(deletedTask.IsDeleted);
        }

        [Fact]
        public void TaskController_DeleteTask_TaskNotFound_ReturnNotFound()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2, "User");

            // Act
            var result = controller.DeleteTask(98);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void TaskController_GetTaskById_UserRequests_ReturnOk()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2,  "User");

            // Act
            var result = controller.GetTaskById(2);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var json = JsonSerializer.Serialize(okResult.Value);
            var element = JsonSerializer.Deserialize<JsonElement>(json);

            Assert.Equal("Unit Test 2", element.GetProperty("Title").GetString());
            Assert.Equal(2, element.GetProperty("TaskId").GetInt32());
        }

        [Fact]
        public void TaskController_GetTaskById_OtherUserRequests_ReturnForbid()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2,  "User");

            // Act
            var result = controller.GetTaskById(4);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void TaskController_GetTaskById_TaskNotFound_ReturnNotFound()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2,  "User");

            // Act
            var result = controller.GetTaskById(45);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void TaskController_GetTaskById_AdminRequestsAnyTask_ReturnOk()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1, "Admin");

            // Act
            var result = controller.GetTaskById(2);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void TaskController_UpdateTask_UserUpdatesTask_ReturnOkAndUpdated()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 2, "User");

            var dto = new UpdateTaskDto
            {
                Title = "Updated Title",
                Descriptions = "Updated Desc",
                TaskStatus = "InProgress",
                TaskPriority = "High",
                DueDate = DateTime.Now.AddDays(10)
            };

            // Act
            var result = controller.UpdateTask(1, dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var updatedTask = db.TaskItems.Find(1);
            Assert.NotNull(updatedTask);
            Assert.Equal("Updated Title", updatedTask.Title);
            Assert.Equal("InProgress", updatedTask.TaskStatus);
            Assert.Equal("High", updatedTask.TaskPriority);
        }

        [Fact]
        public void TaskController_UpdateTask_OtherUserTriesToUpdate_ReturnForbid()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 4,  "User");

            var dto = new UpdateTaskDto
            {
                Title = "Hacked",
                Descriptions = "No",
                TaskStatus = "Completed",
                TaskPriority = "Low",
                DueDate = DateTime.Now
            };

            // Act
            var result = controller.UpdateTask(1, dto);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void TaskController_UpdateTask_TaskNotFound_ReturnNotFound()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1, "User");

            var dto = new UpdateTaskDto
            {
                Title = "HEHE",
                Descriptions = "See u later",
                TaskStatus = "Pending",
                TaskPriority = "Low",
                DueDate = DateTime.Now
            };

            // Act
            var result = controller.UpdateTask(13, dto);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void TaskController_UpdateTask_AdminUpdatesAnyTask_ReturnOkAndUpdated()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new TaskController(db, _Mocklogger.Object, _jwtService);
            SetUserContext(controller, 1,  "Admin");

            var dto = new UpdateTaskDto
            {
                Title = "Admin Updated",
                Descriptions = "By Admin",
                TaskStatus = "Completed",
                TaskPriority = "Low",
                DueDate = DateTime.Now.AddDays(1)
            };

            // Act
            var result = controller.UpdateTask(2, dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var updatedTask = db.TaskItems.Find(2);
            Assert.NotNull(updatedTask);
            Assert.Equal("Admin Updated", updatedTask.Title);
            Assert.Equal("Completed", updatedTask.TaskStatus);
        }
    }
}
