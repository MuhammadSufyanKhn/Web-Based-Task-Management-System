# 🚀 Full-Stack Agile Task & Project Management System

[![.NET Version](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQL Server](https://img.shields.io/badge/Database-SQL_Server-CC292B?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Entity Framework Core](https://img.shields.io/badge/ORM-EF_Core-512BD4)](https://learn.microsoft.com/ef/core/)
[![Tests](https://img.shields.io/badge/Tests-74_Passed-success?logo=xunit)](https://xunit.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> An enterprise-grade, full-stack **Agile Task and Project Management Platform** inspired by Jira. Features interactive **Kanban boards**, **Sprint & Backlog planning**, **Gantt & Timeline charts**, **Time Tracking**, **Agile Burndown/Velocity Analytics**, **Jira Cloud Synchronization**, and secure **JWT Role-Based Access Control (Admin & User)**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🔐 Role-Based Access Control (Admin vs. User)](#-role-based-access-control-admin-vs-user)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup (.NET API)](#2-backend-setup-aspnet-core-api)
  - [3. Frontend Setup (React + Vite)](#3-frontend-setup-reactjs--vite)
- [🧪 Running Tests (74 Passing Tests)](#-running-tests)
- [📡 API Endpoints Summary](#-api-endpoints-summary)
- [💡 Common Troubleshooting & Tips](#-common-troubleshooting--tips)
- [👨‍💻 Author](#-author)

---

## 📖 Overview

This system was built to provide teams with a complete, modern toolset for managing software development workflows:
- **Agile Project Management**: Plan sprints, groom the product backlog, group tasks into epics, and visualize work in multiple views (Kanban, List, Calendar, Timeline, Gantt).
- **Time & Progress Tracking**: Log hours spent, calculate remaining estimates, and view automated Sprint Burndown and Velocity charts.
- **Enterprise Security**: JWT-based stateless authentication, SHA-256 password hashing, audit history on every entity, and role separation between Admins and Team Members.
- **Third-Party Integrations**: Seamless import, export, and live webhook sync with **Atlassian Jira Cloud**.

---

## ✨ Key Features

### 📋 1. Multiple Agile Work Views
- **Interactive Kanban Board**: Drag-and-drop task cards across configurable status columns with Work-in-Progress (WIP) limits.
- **Backlog & Sprint Grooming**: Plan active and future sprints, set sprint goals, assign story points, and drag tasks between the backlog and sprints.
- **Gantt Chart & Timeline Views**: Visualize scheduling, due dates, project milestones, and critical path timelines.
- **Calendar & List Views**: Month/week calendar view and a searchable, sortable data table for high-density task review.

### ⏱️ 2. Work Estimation & Time Tracking
- Log working hours directly against tasks with notes.
- Set original estimates and automatically calculate remaining estimates and progress bars.
- Detailed task activity stream tracking who changed what and when.

### 🔗 3. Task Relationships & Subtasks
- **Parent & Subtask Hierarchy**: Break complex user stories down into manageable subtasks.
- **Task Dependencies**: Link tasks with relationships (*Blocks*, *Is Blocked By*, *Relates To*) with circular dependency validation.

### 📊 4. Agile Reports & Analytics
- **Sprint Burndown Chart**: Track ideal vs. actual remaining story points day-by-day.
- **Team Velocity Chart**: Measure historical story points completed across sprints for sprint capacity planning.
- **Status & Priority Breakdowns**: Interactive donut and bar charts showing task distributions.

### 🔄 5. Atlassian Jira Cloud Integration
- Connect with your Jira Cloud domain using API tokens.
- Bidirectional synchronization for issues, epics, and statuses.
- Webhook endpoint support for instant background updates.

### ⚙️ 6. Customizable Workflows & Settings
- Configure project statuses, categories (*To Do*, *In Progress*, *Done*), and allowed workflow transitions.
- Custom issue types (*Task*, *Bug*, *Story*, *Epic*), priorities, and color tags.

### 🔔 7. In-App Notifications
- Instant alerts for new task assignments, status changes, and sprint updates.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│             React 19 Frontend (Vite)                   │
│   • Dark Slate Design System   • Kanban / Gantt Views  │
│   • Axios Interceptors         • Dynamic Analytics     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS REST Requests (Bearer JWT)
                           ▼
┌────────────────────────────────────────────────────────┐
│             ASP.NET Core Web API (.NET 10)             │
│   • JWT Auth & RBAC Middleware  • 14 Specialized APIs  │
│   • Serilog File & Console Logs • Jira Cloud Service   │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐   ┌─────────────────────┐
│    SQL Server Database       │   │  Atlassian Jira     │
│  • Entity Framework Core     │   │  Cloud REST API     │
│  • 17 Relational Tables      │   │  (Sync & Webhooks)  │
└──────────────────────────────┘   └─────────────────────┘
```

---

## 🔐 Role-Based Access Control (Admin vs. User)

The system enforces strict role-based authorization at the API middleware level via JWT claims:

| Feature / Action | 👑 Admin Role | 👤 User (Team Member) Role |
|---|:---:|:---:|
| **View Kanban / Backlog / Sprints** | ✅ Full Access | ✅ Full Access |
| **Create & Update Tasks** | ✅ Any task | ✅ Assigned / created tasks |
| **Assign Tasks** | ✅ To any team member | ✅ To themselves |
| **Delete Tasks (Soft Delete)** | ✅ Any task | ✅ Owned tasks only |
| **Manage Sprints & Epics** | ✅ Create, Start, Complete | 👁️ View / participate |
| **Project Settings & Workflows** | ✅ Configure statuses, WIP & Jira | ❌ Restricted |
| **User Management** | ✅ View, edit, delete all users | ❌ Restricted |
| **Personal Profile Management** | ✅ Update own profile | ✅ Update own profile |
| **Time Tracking & Comments** | ✅ All tasks | ✅ Assigned tasks |

> 🚫 **Unauthorized Access**: If a regular user calls an Admin endpoint, ASP.NET Core middleware returns `403 Forbidden` before executing any controller code.

---

## 🛠️ Tech Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | React 19, React Router 7, Vite 8, Axios | Modern SPA with ultra-fast Vite HMR and responsive dark UI |
| **Backend API** | ASP.NET Core Web API (C# / .NET 10) | RESTful architecture with clean separation of controllers and services |
| **Database & ORM** | Microsoft SQL Server, Entity Framework Core | Relational database with EF Core code-first mappings and foreign keys |
| **Authentication** | JWT (JSON Web Tokens), SHA-256 | Stateless security with role and user identity claims |
| **Logging** | Serilog (Console & Rolling File Sink) | Structured application logging in `/Logs` |
| **API Docs** | Swagger / OpenAPI | Interactive UI for exploring and testing endpoints |
| **Testing** | xUnit, Moq, EF Core In-Memory, Vitest | 74 automated unit tests covering API business logic |

---

## 📁 Project Structure

```
Web-Based-Task-Management-System/
├── TaskManagementAPI/                     # BACKEND SOLUTION
│   ├── TaskManagementAPI/                 # Web API Project
│   │   ├── Controllers/                   # 14 REST API Controllers
│   │   │   ├── AuthController.cs          # Register, Login & JWT generation
│   │   │   ├── UserController.cs          # User profiles & Admin user management
│   │   │   ├── TaskController.cs          # Core task CRUD & assignment
│   │   │   ├── KanbanController.cs        # Kanban board columns & card movements
│   │   │   ├── BacklogController.cs       # Backlog, Sprint & Epic grouping
│   │   │   ├── SprintController.cs        # Sprint lifecycle (start/complete)
│   │   │   ├── EpicController.cs          # Epic management
│   │   │   ├── ReportsController.cs       # Burndown, Velocity & Breakdown analytics
│   │   │   ├── TimeTrackingController.cs  # Work logs & time estimates
│   │   │   ├── TaskDependenciesController.cs # Predecessor/successor links
│   │   │   ├── TaskActivityController.cs  # Task audit trail & change log
│   │   │   ├── NotificationsController.cs # User notifications
│   │   │   ├── ProjectConfigController.cs # Custom statuses, priorities & workflows
│   │   │   └── JiraIntegrationController.cs# Jira Cloud sync & webhooks
│   │   ├── Data/
│   │   │   └── AppDbContext.cs            # EF Core DbContext (17 DbSets)
│   │   ├── Models/                        # Domain entities & DTOs
│   │   ├── Services/                      # Background services (Jira, Notifications, Activity)
│   │   ├── Helpers/                       # JwtService, PasswordHasher
│   │   ├── Program.cs                     # App bootstrap, DI, CORS & middleware
│   │   └── appsettings.json               # DB connection string & JWT config
│   │
│   └── TaskManagementAPI.tests/           # UNIT TEST SUITE (74 Tests)
│       └── Controllers/                   # Isolated controller tests using Moq
│
└── TaskManagerUi/                         # FRONTEND (React + Vite)
    ├── src/
    │   ├── Api/                           # Axios client with JWT interceptors
    │   ├── components/                    # UI Components (Kanban, Sprints, Modals)
    │   │   └── charts/                    # Burndown, Velocity, Donut & Bar charts
    │   ├── pages/                         # Kanban, Backlog, Gantt, Reports, Settings, etc.
    │   ├── App.jsx                        # Application routes & Protected Route guards
    │   └── App.css                        # Design system & dark theme styles
    ├── vite.config.js                     # Vite build configuration
    └── package.json                       # Dependencies and scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed on your machine:
- [.NET SDK (v8.0 or v10.0)](https://dotnet.microsoft.com/download)
- [Node.js (v18 or higher) and npm](https://nodejs.org/)
- [Microsoft SQL Server](https://www.microsoft.com/sql-server) (LocalDB, Express, or Developer edition)
- [Git](https://git-scm.com/)

---

### 1. Clone Repository

```bash
git clone https://github.com/MuhammadSufyanKhn/Web-Based-Task-Management-System.git
cd Web-Based-Task-Management-System
```

---

### 2. Backend Setup (ASP.NET Core API)

#### Step A: Configure Connection String
Open `TaskManagementAPI/TaskManagementAPI/appsettings.json` and adjust your SQL Server connection string if needed:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=TaskManagementSystem;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "your-secure-secret-key-at-least-32-characters-long!",
    "Issuer": "TaskManagerAPI",
    "Audience": "TaskManagerUser"
  }
}
```
*(If using LocalDB, set `Server=(localdb)\\mssqllocaldb`)*.

#### Step B: Run Database Migrations
Open a terminal in the API folder and update the database:

```bash
cd TaskManagementAPI/TaskManagementAPI
dotnet ef database update
```
*This automatically creates the `TaskManagementSystem` database with all required tables.*

#### Step C: Start the API Server
```bash
dotnet run
```
The API will start running on:
- **API URL**: `https://localhost:7127`
- **Swagger Documentation**: [https://localhost:7127/swagger](https://localhost:7127/swagger)

---

### 3. Frontend Setup (React.js + Vite)

Open a **new terminal window** and navigate to `TaskManagerUi`:

```bash
cd TaskManagerUi
```

#### Step A: Install Dependencies
```bash
npm install
```

#### Step B: Start Development Server
```bash
npm run dev
```

The frontend will launch at:
👉 **`http://localhost:5173`**

---

### 4. Create an Account & Start Testing

1. Open `http://localhost:5173` in your browser.
2. Click **Register**:
   - Register your first user with role **Admin** to get full access to Project Settings, User Management, and Sprint creation.
   - Register a second user with role **User** to test team member permissions.
3. Explore the **Kanban board**, create tasks, plan **Sprints** in the **Backlog**, log work hours, and view **Reports**!

---

## 🧪 Running Tests

The solution includes a comprehensive unit testing suite using **xUnit**, **Moq**, and **EF Core In-Memory Database**. All business logic across controllers is tested in total isolation.

### Run Backend Unit Tests

From the solution directory:

```bash
cd TaskManagementAPI
dotnet test
```

**Result:**
```text
Passed!  - Failed: 0, Passed: 74, Skipped: 0, Total: 74, Duration: 1.0 s
```

### Run Frontend Tests

From the frontend directory:

```bash
cd TaskManagerUi
npm test
```

---

## 📡 API Endpoints Summary

All protected endpoints require an `Authorization: Bearer <token>` header obtained from the Login endpoint.

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account (assigns Admin or User role) | Public |
| `POST` | `/api/auth/login` | Login with credentials and obtain JWT token | Public |

### 👥 User Management (`/api/user`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/user/profile` | View profile of logged-in user | All Roles |
| `PUT` | `/api/user/update-profile` | Update own name and email | All Roles |
| `GET` | `/api/user/{id}` | View any user by ID | Admin Only |
| `PUT` | `/api/user/update-user/{id}`| Update any user's information | Admin Only |
| `DELETE`| `/api/user/delete-user/{id}`| Soft-delete a user and cascade to tasks | Admin Only |

### 📋 Tasks (`/api/task`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/task` | Get tasks (filtered for User, all for Admin) | All Roles |
| `POST` | `/api/task` | Create a new task or subtask | All Roles |
| `PUT` | `/api/task/{id}` | Update task details, status, or assignee | All Roles |
| `DELETE`| `/api/task/{id}` | Soft-delete a task | All Roles |

### 📊 Kanban, Backlog & Sprints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/kanban` | Get Kanban board grouped by status columns | All Roles |
| `PUT` | `/api/kanban/move-task` | Drag-and-drop card to new column/position | All Roles |
| `GET` | `/api/backlog` | Full backlog view with active/future sprint buckets | All Roles |
| `POST` | `/api/sprint` | Create a new sprint | Admin / Manager |
| `POST` | `/api/sprint/{id}/start` | Start an active sprint | Admin / Manager |
| `POST` | `/api/sprint/{id}/complete`| Complete sprint and roll over incomplete tasks | Admin / Manager |

### 📈 Reports, Time & Integrations
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/reports/burndown/{sprintId}` | Daily ideal vs actual story points burndown | All Roles |
| `GET` | `/api/reports/velocity` | Team story points completed over past sprints | All Roles |
| `POST` | `/api/timetracking/log` | Log work time against a task | All Roles |
| `GET` | `/api/jira/config` | Retrieve current Jira Cloud settings | Admin Only |
| `POST` | `/api/jira/sync` | Trigger manual two-way sync with Jira Cloud | Admin Only |

> 💡 *Check the interactive Swagger UI at `https://localhost:7127/swagger` for full request/response schemas.*

---

## 💡 Common Troubleshooting & Tips

### 1. SQL Server Connection Error
- **Symptom**: `Cannot open database "TaskManagementSystem" requested by the login.`
- **Fix**: Check `Server=` in `appsettings.json`. If you use SQL Server Express, use `Server=.\\SQLEXPRESS`. If you have a default local SQL instance, use `Server=localhost`. Then run `dotnet ef database update`.

### 2. Untrusted Localhost SSL Certificate
- **Symptom**: Browser or Axios shows `NET::ERR_CERT_AUTHORITY_INVALID`.
- **Fix**: Trust the .NET development certificate by running:
  ```bash
  dotnet dev-certs https --trust
  ```

### 3. CORS Error in Frontend Console
- **Symptom**: `Access to XMLHttpRequest blocked by CORS policy`.
- **Fix**: Ensure the frontend is running on `http://localhost:5173` (Vite's default port), which is pre-configured in the API's CORS policy in `Program.cs`.

---

## 👨‍💻 Author

**Muhammad Sufyan Khan**
- **GitHub**: [@MuhammadSufyanKhn](https://github.com/MuhammadSufyanKhn)
- **Repository**: [Web-Based-Task-Management-System](https://github.com/MuhammadSufyanKhn/Web-Based-Task-Management-System)

---

## 📄 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute this software for personal and commercial projects.
