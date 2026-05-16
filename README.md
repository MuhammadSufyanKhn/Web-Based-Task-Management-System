# 📋 Web-Based Task Management System

A full-stack application for managing users and tasks with secure JWT authentication and role-based access control. The backend is powered by **ASP.NET Core Web API** with Entity Framework Core, and the frontend is built with **React.js**.

---

## 📁 Project Structure

```
Web-Based-Task-Management-System/
├── TaskManagementAPI/                  # ASP.NET Core Web API (Backend)
│   ├── Controllers/
│   │   ├── AuthController.cs           # Register & Login endpoints
│   │   ├── UserController.cs           # User profile & management endpoints
│   │   └── TaskController.cs           # Task CRUD endpoints
│   ├── Data/
│   │   └── AppDbContext.cs             # Entity Framework Core DB context
│   ├── Models/
│   │   ├── Users.cs                    # User entity model
│   │   ├── TaskItem.cs                 # Task entity model
│   │   └── DTOS/                       # Data Transfer Objects (request/response shapes)
│   ├── Helpers/
│   │   ├── JwtService.cs               # JWT token generation & validation
│   │   └── PasswordHasher.cs           # SHA-256 password hashing
│   ├── appsettings.json                # App configuration (DB connection, JWT settings)
│   └── TaskManagementAPI.tests/        # xUnit unit test project
│       └── Controllers/
│           └── UserControllerTest.cs   # All UserController unit tests
└── TaskManagerUi/                      # React.js Frontend
    ├── src/
    │   ├── components/                 # Reusable UI components (Navbar, TaskCard, etc.)
    │   ├── pages/                      # Login, Register, Dashboard, Tasks pages
    │   └── App.js                      # Root component and route definitions
    ├── .env                            # API base URL config
    └── package.json
```

---

## ✨ Features

- **JWT Authentication** — Secure register and login using JSON Web Tokens. Token is stored client-side and sent with every protected request.
- **Role-Based Access Control (RBAC)** — Two roles (`Admin` and `User`) with clearly separated permissions enforced at the API level.
- **User Profile Management** — Users can view and update their own profile. Admins can manage all users.
- **Task CRUD** — Full create, read, update, and delete operations on tasks with ownership rules per role.
- **Soft Delete with Cascade** — Deleting a user does not remove them from the database. Instead, `IsDeleted = true` is set on the user and all their associated tasks automatically.
- **Audit Tracking** — Every record in the database tracks `CreatedDate`, `UpdatedDate`, and `UpdatedBy` for full traceability.
- **SHA-256 Password Hashing** — Passwords are hashed before storage. Plain text passwords are never saved.
- **Unit Tested** — All controller logic is covered with xUnit tests using Moq and EF Core In-Memory Database.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | ASP.NET Core Web API, C# | REST API and business logic |
| ORM | Entity Framework Core | Database access and migrations |
| Database | SQL Server | Persistent data storage |
| Authentication | JWT (JSON Web Tokens) | Stateless auth, role claims embedded in token |
| Password Security | SHA-256 Hashing | Secure password storage |
| Frontend | React.js | Interactive user interface |
| Unit Testing | xUnit, Moq, EF Core InMemory | Isolated controller testing |

---

## 🔐 Role-Based Access Control (RBAC)

The system enforces two roles: **Admin** and **User**. The role is assigned during registration and is embedded as a claim inside the JWT token. Every protected API endpoint checks this claim before allowing access.

---

### 👑 Admin

Admins have elevated privileges and can manage all users and all tasks across the entire system. This role is intended for system administrators.

| Permission | Endpoint | What It Does |
|---|---|---|
| View any user's profile | `GET /api/user/{id}` | Fetch the profile of any registered user by their ID |
| Update any user | `PUT /api/user/update-user/{id}` | Change the name or email of any user in the system |
| Delete any user | `DELETE /api/user/delete-user/{id}` | Soft-deletes the user and automatically soft-deletes all their tasks |
| View all tasks | `GET /api/task` | Returns every task in the system, not filtered by user |
| Update any task | `PUT /api/task/{id}` | Edit the title, description, or status of any task |
| Delete any task | `DELETE /api/task/{id}` | Soft-deletes any task regardless of who owns it |
| Assign tasks to users | `POST /api/task` | Create a task and assign it to any user in the system |
| View own profile | `GET /api/user/profile` | Admins can also view their own profile |
| Update own profile | `PUT /api/user/update-profile` | Admins can update their own name and email |

---

### 👤 User

Regular users have restricted access. They can only manage their own profile and interact with tasks that belong to them. They cannot access other users' data.

| Permission | Endpoint | What It Does |
|---|---|---|
| View own profile | `GET /api/user/profile` | Fetch their own profile information using JWT claim |
| Update own profile | `PUT /api/user/update-profile` | Update their own name and email only |
| Create own tasks | `POST /api/task` | Create a new task assigned to themselves |
| View own tasks | `GET /api/task` | Returns only the tasks that belong to the logged-in user |
| Update own tasks | `PUT /api/task/{id}` | Edit a task only if it belongs to them |
| Delete own tasks | `DELETE /api/task/{id}` | Soft-delete a task only if it belongs to them |

---

### 🚫 What Happens When a User Accesses an Admin Endpoint?

If a regular `User` attempts to call an Admin-only endpoint, the API immediately rejects the request:

```
HTTP 403 Forbidden
```

The request never reaches the controller logic. The `[Authorize(Roles = "Admin")]` attribute on the endpoint handles this at the ASP.NET Core middleware level before any code runs.

---

### 🔑 How Roles Work Technically

1. During **registration**, a `UserRole` field (`"Admin"` or `"User"`) is saved to the `Users` table in the database.
2. During **login**, the role is read from the database and added as a `ClaimTypes.Role` claim inside the JWT token.
3. On every **protected request**, ASP.NET Core middleware reads the Bearer token from the `Authorization` header, validates it, extracts the role claim, and enforces the `[Authorize(Roles = "...")]` attribute on the endpoint.
4. The user ID is also stored as a `ClaimTypes.NameIdentifier` claim so controllers can identify who is making the request without an extra database call.

```
Login Request
     │
     ▼
AuthController reads UserRole from DB
     │
     ▼
Role is added as a claim inside JWT token
     │
     ▼
Client sends token on every request
     │
     ▼
ASP.NET Core middleware validates token + checks role claim
     │
     ├── Role matches [Authorize(Roles = "Admin")] → ✅ Access Granted
     └── Role does not match                        → ❌ 403 Forbidden
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed before running the project:

| Tool | Version | Download |
|---|---|---|
| .NET SDK | v6 or later | https://dotnet.microsoft.com/download |
| Node.js & npm | v16 or later | https://nodejs.org/ |
| SQL Server | Any edition | https://www.microsoft.com/en-us/sql-server |
| EF Core CLI Tools | Latest | Run: `dotnet tool install --global dotnet-ef` |

---

### 1. Clone the Repository

```bash
git clone https://github.com/MuhammadSufyanKhn/Web-Based-Task-Management-System.git
cd Web-Based-Task-Management-System
```

---

### 2. Backend Setup (ASP.NET Core API)

#### Step 1 — Configure `appsettings.json`

Navigate to `TaskManagementAPI/` and open `appsettings.json`. Fill in your SQL Server connection string and JWT settings:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER_NAME;Database=TaskManagerDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "TaskManagerAPI",
    "Audience": "TaskManagerClient"
  }
}
```

> ⚠️ Replace `YOUR_SERVER_NAME` with your actual SQL Server instance name, for example `localhost` or `.\SQLEXPRESS`.

> ⚠️ The JWT `Key` must be at least 32 characters long or token generation will fail at runtime.

#### Step 2 — Install EF Core CLI (if not already installed)

```bash
dotnet tool install --global dotnet-ef
```

#### Step 3 — Apply Database Migrations

```bash
cd TaskManagementAPI
dotnet ef database update
```

This creates the `TaskManagerDb` database and all tables (`Users`, `TaskItems`) automatically based on the EF Core models. No manual SQL scripts needed.

#### Step 4 — Run the API

```bash
dotnet run
```

The API will start. You will see output like:

```
Now listening on: https://localhost:7123
```

Open Swagger UI in your browser to explore and test all endpoints interactively:

```
https://localhost:<port>/swagger
```

> Keep this terminal open while using the frontend. The React app needs the API running to function.

---

### 3. Frontend Setup (React.js)

Open a **new terminal window** and navigate to the frontend folder:

```bash
cd TaskManagerUi
```

#### Step 1 — Install Dependencies

```bash
npm install
```

This downloads all required packages listed in `package.json`.

#### Step 2 — Configure API URL

Create a `.env` file inside `TaskManagerUi/` and set it to point to your running backend API:

```env
REACT_APP_API_URL=https://localhost:<port>/api
```

> Replace `<port>` with the port number shown when you ran `dotnet run`.

#### Step 3 — Start the React App

```bash
npm start
```

The frontend will open automatically in your browser at:

```
http://localhost:3000
```

> If you scaffolded the React app with **Vite**, use `npm run dev` instead. It will run on `http://localhost:5173`.

---

## 🧪 Running Unit Tests

The test project lives inside `TaskManagementAPI/TaskManagementAPI.tests/`. Tests are completely isolated — no real database, no SQL Server, and no network connection is needed to run them.

### Navigate to the solution root

```bash
cd Web-Based-Task-Management-System
```

### Run all tests

```bash
dotnet test
```

Expected output:

```
Starting test execution, please wait...
A total of 1 test files matched the specified pattern.

Passed! - Failed: 0, Passed: 12, Skipped: 0, Total: 12, Duration: 1.2s
```

### Run tests with detailed output (see each test name)

```bash
dotnet test --logger "console;verbosity=detailed"
```

---

## ✅ What Is Tested

### Test Coverage Table

| Test Method | Scenario | Expected Result |
|---|---|---|
| `GetProfile_UserClaimMissing_returnUnauthorized` | JWT token has no user ID claim | `401 Unauthorized` |
| `GetProfile_UserClaimIsValid_ReturnOk` | Valid token, active user | `200 OK` with correct username and email |
| `GetProfile_UserIsDeleted_ReturnNotFound` | User exists but `IsDeleted = true` | `404 Not Found` with message |
| `UpdateProfile_UserIsFound_ReturnOkandUpdate` | Valid user updates their profile | `200 OK`, DB values verified |
| `UpdateProfile_UserNotFound_ReturnNotFound` | Token user ID does not exist in DB | `404 Not Found` |
| `GetUserById_UserExist_ReturnOk` | Valid user ID passed | `200 OK` with correct user data |
| `GetUserById_UserNotExist_ReturnNotFound` | Non-existent user ID passed | `404 Not Found` |
| `GetUserById_UserDeleted_ReturnNotFound` | User is soft-deleted | `404 Not Found` |
| `UpdateUser_UserExist_ReturnOkandUpdate` | Admin updates a user by ID | `200 OK`, DB values verified |
| `UpdateUser_UserNotExist_ReturnNotFound` | Non-existent user ID passed | `404 Not Found` with message |
| `DeleteUser_UserExist_ReturnUserDeletedandUserTaskDeleted` | Delete user with tasks | User and all tasks soft-deleted, `UpdatedBy` set |
| `DeleteUser_UserNotExist_ReturnUserNotFound` | Non-existent user ID passed | `404 Not Found` with message |


## 📡 API Endpoints

> All endpoints except `register` and `login` require a Bearer token in the `Authorization` header:
> ```
> Authorization: Bearer <your_jwt_token>
> ```

### 🔓 Auth — Public (No Token Required)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new account. Role (`Admin` or `User`) is assigned here |
| `POST` | `/api/auth/login` | Login with email and password. Returns a signed JWT token |

---

### 👥 User Endpoints

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/user/profile` | Get the logged-in user's own profile | `Admin`, `User` |
| `PUT` | `/api/user/update-profile` | Update the logged-in user's own name/email | `Admin`, `User` |
| `GET` | `/api/user/{id}` | Get any user's profile by their ID | `Admin` only |
| `PUT` | `/api/user/update-user/{id}` | Update any user's name/email by their ID | `Admin` only |
| `DELETE` | `/api/user/delete-user/{id}` | Soft-delete a user and cascade-delete all their tasks | `Admin` only |

---

### ✅ Task Endpoints

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/task` | Get tasks | `User` → own tasks only. `Admin` → all tasks |
| `POST` | `/api/task` | Create a new task | `Admin` (assign to anyone), `User` (assign to self) |
| `PUT` | `/api/task/{id}` | Update a task | `User` → own tasks only. `Admin` → any task |
| `DELETE` | `/api/task/{id}` | Soft-delete a task | `User` → own tasks only. `Admin` → any task |

---

## 👨‍💻 Author

**Muhammad Sufyan Khan**

- GitHub: [@MuhammadSufyanKhn](https://github.com/MuhammadSufyanKhn)
