using Castle.Core.Logging;
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

        private AppDbContext GetInMemoryDbContext()
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
        public void Register_WhenEmailAlreadyExists_ReturnsBadRequest()
        {
            // Arrange
            var db = GetInMemoryDbContext();

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

            Assert.Equal("email already exists", badRequest.Value);
        }
    }
}
