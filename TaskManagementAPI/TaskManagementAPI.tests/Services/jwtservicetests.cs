using Microsoft.Extensions.Configuration;
using Moq;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TaskManagerAPI.Helpers;

namespace TaskManagementAPI.tests.Services
{
    public class Jwtservicetests
    {
        private readonly Mock<IConfiguration> _config;
        private readonly JwtService _jwtService;

        public Jwtservicetests()
        {
            _config = new Mock<IConfiguration>();

            _config.Setup(c => c["Jwt:Key"]).Returns("ThisIsMySuperSecretTestKeyForXunitTesting123456789!");
            _config.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
            _config.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

            _jwtService = new JwtService(_config.Object);
                
        }

        [Fact]
        public void GenerateToken_ShouldReturnValidToken()
        {
            // Arrange
            var user = new TaskManagerAPI.Models.Users
            {
                UserId = 10,
                Email = "test@example.com",
                UserRole = "User"
            };

            // Act
            var token = _jwtService.GenerateToken(user);

            // Assert
            Assert.False(string.IsNullOrEmpty(token));
            var tokenparts = token.Split('.');
            Assert.Equal(3, tokenparts.Length);
        }

        [Fact]
        public void GenerateToken_ShouldContainUserClaims()
        {
            // Arrange
            var user = new TaskManagerAPI.Models.Users
            {
                UserId = 42,
                Email = "sk@gmail.com",
                UserRole = "cashier"
            };
            // Act
            var tokenString = _jwtService.GenerateToken(user);

            // Assert
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(tokenString);

            /*user claim ko verify krnay k liay*/
            var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            Assert.NotNull(userIdClaim);
            Assert.Equal("42", userIdClaim.Value);

            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email);
            Assert.NotNull(emailClaim);
            Assert.Equal("sk@gmail.com", emailClaim.Value);

            var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
            Assert.NotNull(roleClaim);
            Assert.Equal("cashier", roleClaim.Value);

            /*Verify Issuer and Audience match our mocked setup*/
            Assert.Equal("TestIssuer", jwtToken.Issuer);
            Assert.Contains("TestAudience", jwtToken.Audiences);
        }
    }
}
