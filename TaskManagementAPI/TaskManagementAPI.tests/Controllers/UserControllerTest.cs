using Castle.Core.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
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
using TaskManagerAPI.Controllers;
using TaskManagerAPI.Helpers;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.tests.Controllers
{
    public class UserControllerTest
    {
        private readonly Mock<ILogger<UserController>> _mockLogger;
        public UserControllerTest()
        {
            _mockLogger = new Mock<ILogger<UserController>>();
        }

        private static AppDbContext GetDatabase(bool isUserDeleted = false)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()).Options;
            var db = new AppDbContext(options);

            db.Users.Add(new Users
            {
                UserId = 13,
                UserName = "ProfileTest",
                Email = "ProfileTest@gmail.com",
                IsDeleted = isUserDeleted
            });
            db.SaveChanges();

            return db;
        }

        private static void SetUserContext(UserController userController, int loggedInUserId = 13)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, loggedInUserId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimprincipal = new ClaimsPrincipal(identity);

            userController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimprincipal }
            };
        }

        [Fact]
        public void UserController_GetProfile_UserClaimMissing_returnUnauthorized()
        {
            //Arrange
            var db = GetDatabase();
            var controller = new UserController(_mockLogger.Object, db);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            //Act
            var result = controller.GetProfile();
            
            //Assert
            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("User ID claim not found.", unauthorized.Value);
        }

        [Fact]
        public void UserCOntroller_GetProfile_UserClaimIsValid_ReturnOk()
        {
            //Arrange
            var db = GetDatabase();
 
            var controller = new UserController(_mockLogger.Object, db);
            SetUserContext(controller);

            //ACT
            var result = controller.GetProfile();

            //Assert
            var okresult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okresult.Value);

            // JSON me serialize kar ke JsonElement use krega
            var jsonString = JsonSerializer.Serialize(okresult.Value);
            var jsonElement = JsonSerializer.Deserialize<JsonElement>(jsonString);

            // Assert
            Assert.Equal("ProfileTest", jsonElement.GetProperty("UserName").GetString());
            Assert.Equal("ProfileTest@gmail.com", jsonElement.GetProperty("Email").GetString());
        }

        [Fact]
        public void UserCOntroller_GetProfile_UserIsDeleted_ReturnNotFound()
        {
            //Arrange
            var db = GetDatabase(isUserDeleted: true);
           
            var controller = new UserController( _mockLogger.Object, db);

            SetUserContext(controller);
            //Act
            var result = controller.GetProfile();

            //Assert
            var NotFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("User not found.", NotFound.Value);
        }

        [Fact]
        public void UserController_UpdateProfile_UserIsFound_ReturnOkandUpdate()
        {
            //Arrange
            var db = GetDatabase();
           
            var controller = new UserController (_mockLogger.Object, db);
            SetUserContext(controller);

            var UpdateRequest = new UpdateProfileDto
            {
                UserName = "ProfileUpdated",
                Email = "ProfileUpdated@gmail.com"
            };

            //Act
            var result = controller.UpdateProfile(UpdateRequest);

            //Assert 
            var ProfileSuccess = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Profile updated successfully.", ProfileSuccess.Value);

            var UpdatedUser = db.Users.Find(13);
            Assert.NotNull(UpdatedUser);

            Assert.Equal("ProfileUpdated", UpdatedUser.UserName);
            Assert.Equal("ProfileUpdated@gmail.com", UpdatedUser.Email);

        }
        [Fact]
        public void UserController_UpdateProfile_UserNotFound_ReturnNotFound()
        {
            var db = GetDatabase();
            var controller = new UserController(_mockLogger.Object, db);
            SetUserContext(controller,11);

            var result = controller.UpdateProfile(new UpdateProfileDto());
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void UserController_GetUserById_UserExist_ReturnOk()
        {
            //Arrange
            var db = GetDatabase();
            var controller = new UserController(_mockLogger.Object, db);

            //Act
            var result = controller.GetUserById(13);

            //Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            var jsonString = JsonSerializer.Serialize(okResult.Value);
            var jsonElement = JsonSerializer.Deserialize<JsonElement>(jsonString);

            Assert.Equal("ProfileTest", jsonElement.GetProperty("UserName").GetString());
            Assert.Equal(13, jsonElement.GetProperty("UserId").GetInt32());

        }

        [Fact]
        public void UserController_GetUserById_UserNotExist_ReturnNotFound()
        {
            //Arrange
            var db = GetDatabase();
            var controller = new UserController(_mockLogger.Object, db);

            //Act
            var result = controller.GetUserById(15);

            //Assert
            var okResult = Assert.IsType<NotFoundObjectResult>(result);
        }
        [Fact]
        public void UserController_GetUserById_UserDeleted_ReturnNotFound()
        {
            //Arrange
            var db = GetDatabase(isUserDeleted: true);

            var controller = new UserController(_mockLogger.Object, db);

            //Act
            var result = controller.GetUserById(13);

            //Assert
            var okResult = Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void UserController_UpdateUser_UserExist_ReturnOkandUpdate()
        {
            //Arrange
            var db = GetDatabase();
            var controller = new UserController(_mockLogger.Object, db);

            SetUserContext(controller,13);

            var UserUpdateRequest = new UpdateProfileDto
            {
                UserName = "testUpdate",
                Email = "testupdate@gmail.com"
            };

            //Act
            var result = controller.UpdateUser(13, UserUpdateRequest);
            
            //Assert
            Assert.NotNull(result);
            Assert.IsType<OkObjectResult>(result);

            var updatedUser = db.Users.Find(13);
            Assert.NotNull(updatedUser);
            Assert.Equal("testUpdate", updatedUser.UserName);
            Assert.Equal("testupdate@gmail.com", updatedUser.Email);
        }

        [Fact]
        public void UserController_UpdateUser_UserNotExist_ReturnNotFound()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new UserController(_mockLogger.Object, db);
            SetUserContext(controller);

            var updateRequest = new UpdateProfileDto { UserName = "sufyan" };

            // Act
            var result = controller.UpdateUser(99, updateRequest); 

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("User not found.", notFoundResult.Value);
        }

        [Fact]
        public void UserController_DeleteUser_UserExist_ReturnUserDeletedandUserTaskDeleted()
        {
            // Arrange
            var db = GetDatabase();

            // Delete logic check karne k liye mainay ek  manually task create kra hai
            db.TaskItems.Add(new TaskItem { TaskId = 1, UserId = 13, IsDeleted = false, Title= "test task"});
            db.SaveChanges();

            var controller = new UserController(_mockLogger.Object, db);
            SetUserContext(controller, 13);

            // Act
            var result = controller.DeleteUser(13);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("User deleted successfully.", okResult.Value);

            var deletedUser = db.Users.Find(13);
            Assert.NotNull(deletedUser);
            Assert.True(deletedUser.IsDeleted);
            Assert.Equal(13, deletedUser.UpdatedBy);

            var deletedTask = db.TaskItems.Find(1);
            Assert.NotNull(deletedTask);
            Assert.True(deletedTask.IsDeleted);
            Assert.Equal(13, deletedTask.UpdatedBy);
        }

        [Fact]
        public void UserController_DeleteUser_UserNotExist_ReturnUserNotFound()
        {
            // Arrange
            var db = GetDatabase();
            var controller = new UserController(_mockLogger.Object, db);
            SetUserContext(controller);

            // Act
            var result = controller.DeleteUser(99); 

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("User not found.", notFoundResult.Value);
        }
    }
}
