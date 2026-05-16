using Castle.Core.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using TaskManagementAPI.Data;
using TaskManagerAPI.Controllers;
using TaskManagerAPI.Helpers;
using TaskManagerAPI.Models;
using TaskManagerAPI.Models.DTOs;
using TaskManagerAPI.Models.DTOS;

namespace TaskManagementAPI.tests.Controllers
{
    public class AuthControllerTest
    {
        private readonly Mock<ILogger<AuthController>> _mockLogger;
        private readonly JwtService _jwtservice;
        public AuthControllerTest() 
        {
            _mockLogger = new Mock<ILogger<AuthController>>();

            var mockConfig = new Dictionary<string, string>
            {
                { "Jwt:Key","YeEkFakeSecretKeyHaiTestingKeLiye123456789!"},
                { "Jwt:Issuer", "TestIssuer"},
                { "Jwt:Audience", "TestAudience" }
            };

            var fakeConfig = new ConfigurationBuilder().AddInMemoryCollection(mockConfig).Build();

            _jwtservice = new JwtService(fakeConfig);
        }

        private AppDbContext GetDatabase()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()).Options;
            return new AppDbContext(options);
        }

        private string HashPassword(string password)
        {
            using var sha56 = SHA256.Create();
            return Convert.ToBase64String(sha56.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }

        [Fact]
        public void AuthController_Register_WhenEmailAlreadyExists_ReturnsBadRequest()
        {
            // Arrange
            var db = GetDatabase();

            db.Users.Add(new Users
            {
                Email = "test@gmail.com",
                UserName = "TestUser"
            });

            db.SaveChanges();

            var controller = new AuthController(
                db,
                _mockLogger.Object,
                _jwtservice
            );

            var request = new RegisterDto
            {
                Email = "test@gmail.com",
                Username = "NewUser",
                Password = "123456"
            };

            // Act
            var result = controller.Register(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);

            Assert.Equal("User already exists with this email.", badRequest.Value);
        }

        [Fact]
        public void AuthController_Register_WhereRequestIsValid_ReturnOK()
        {
            //Arrange
            var db = GetDatabase();

            var controller = new AuthController(db, _mockLogger.Object, _jwtservice);
            var request = new RegisterDto
            {
                Email = "NewTest@gmail.com",
                Username = "NewTestUser",
                Password = "NewTestUser"
            };

            //Act
            var result = controller.Register(request);

            //Assert
            var okrequest = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("User registered successfully!", okrequest.Value);

            var checkuser = db.Users.FirstOrDefault(c => c.Email == "NewTest@gmail.com");
            Assert.NotNull(checkuser);
            Assert.Equal("User", checkuser.UserRole);
        }

        [Fact]
        public void AuthController_Login_WhenreUserNotFound_Returnbadrequest()
        {
            //Arrange
            var db = GetDatabase();
            var controller = new AuthController(db, _mockLogger.Object, _jwtservice);

            var request = new loginDto { Email = "NewTest@gmail.com", Password = "NewTestUser" };
            //Act
            var result = controller.Login(request);

            //Assert
            var badrequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("User not found.", badrequest.Value);
        }
        [Fact]
        public void AuthController_Login_WhenPasswordisIncorrect_ReturnbadRequest()
        {
            //Arrange
            var db = GetDatabase();
            
            db.Users.Add(new Users
            {
                Email = "testlogin@gmail.com",
                PasswordHash= HashPassword("testlogin")
            });
            db.SaveChanges();

            var controller = new AuthController(db, _mockLogger.Object, _jwtservice);
            var request = new loginDto
            {
                Email = "testlogin@gmail.com",
                Password = "wrongpassword"
            };

            //Act
            var result = controller.Login(request);
            
            //Assert
            var badrequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Incorrect password.", badrequest.Value);
        }

        [Fact]
        public void AuthController_Login_WhenCrdentialsAreCorrect_ReturnOkWithToken()
        {
            //Arrange
            var db = GetDatabase();
            db.Users.Add(new Users
            {
                UserId = 10,
                Email = "loginemail@gmail.com",
                PasswordHash = HashPassword("LoginSuccess"),
                UserRole = "User"
            });
            db.SaveChanges();

            var controller = new AuthController(db, _mockLogger.Object, _jwtservice);

            var request = new loginDto
            {
                Email = "loginemail@gmail.com",
                Password = "LoginSuccess"
            };

            //Act
            var result = controller.Login(request);

            //Assert
            var okrequest = Assert.IsType<OkObjectResult>(result);

            var responseValue = okrequest.Value;
            Assert.NotNull(responseValue);

            var tokenProperty = responseValue.GetType().GetProperty("token");
            Assert.NotNull(tokenProperty);

            var tokenValue = tokenProperty.GetValue(responseValue, null)?.ToString();

            Assert.False(string.IsNullOrEmpty(tokenValue)); 
            Assert.Equal(3, tokenValue.Split('.').Length);

            var message = responseValue.GetType().GetProperty("message");
            var messagevalue = message?.GetValue(responseValue)?.ToString();

            Assert.Equal("login successful", messagevalue);
        }
    }
}
