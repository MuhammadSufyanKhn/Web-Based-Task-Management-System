# 📝 Web-Based Task Management System (Full-Stack)

A robust and secure Full-Stack application for managing users, tasks, and authentication. The backend is powered by **ASP.NET Core Web API** using JWT security and Entity Framework Core, while the frontend is an interactive and responsive user interface built with **React**. 

## ✨ Features

* **User Authentication & Authorization:** Secure login and registration using JSON Web Tokens (JWT).
* **Profile Management:** View, update, and manage user profiles using secure Claim-based authentication.
* **Task Management:** Create, read, update, and delete tasks seamlessly through the React frontend.
* **Soft Deletion & Cascading:** Implemented soft-delete functionality (`IsDeleted` flag) for users. Deleting a user automatically soft-deletes all their associated tasks to maintain data integrity.
* **Audit Logs:** Tracks `CreatedDate`, `UpdatedDate`, and `UpdatedBy` for record tracking.
* **Unit Tested API:** Business logic and controllers are thoroughly tested using xUnit, Moq, and In-Memory Databases.

## 🛠️ Tech Stack

### Backend
* **Framework:** .NET (ASP.NET Core Web API)
* **Language:** C#
* **ORM:** Entity Framework Core
* **Security:** JWT (JSON Web Tokens), SHA-256 Password Hashing
* **Testing:** xUnit, Moq

### Frontend
* **Library:** React.js
* **Routing:** React Router (if applicable)
* **State Management:** React Context / Redux (if applicable)
* **Styling:** CSS / Tailwind / Bootstrap

## 🚀 Getting Started

Follow these instructions to get both the backend API and frontend React app running on your local machine.

### Prerequisites
* [.NET SDK](https://dotnet.microsoft.com/download) (for the backend)
* [Node.js and npm](https://nodejs.org/) (for the frontend)
* SQL Server (or any configured database)

---

### 1. Backend Setup (ASP.NET Core API)

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/MuhammadSufyanKhn/Web-Based-Task-Management-System.git](https://github.com/MuhammadSufyanKhn/Web-Based-Task-Management-System.git)
   cd Web-Based-Task-Management-System

```

2. **Configure AppSettings:**
Navigate to your API project folder and open `appsettings.json`. Configure your Database Connection String and JWT settings:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER;Database=TaskManagerDb;Trusted_Connection=True;TrustServerCertificate=True;"
},
"Jwt": {
  "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
  "Issuer": "YourIssuer",
  "Audience": "YourAudience"
}

```


3. **Apply Database Migrations:**
Open the terminal in the API directory and run:
```bash
dotnet ef database update

```


4. **Run the API:**
```bash
dotnet run

```


*The API will start. Keep this terminal open. You can view the API endpoints at `https://localhost:<port>/swagger`.*

---

### 2. Frontend Setup (React.js)

1. **Navigate to the frontend directory:**
Open a **new** terminal window and navigate to the folder containing your React app (e.g., `client` or `frontend`).
```bash
cd path/to/your/react-folder

```


2. **Install Dependencies:**
Run the following command to download all required npm packages:
```bash
npm install

```


3. **Configure API URL (Optional but recommended):**
If you have a `.env` file for your React app, ensure it points to your local ASP.NET Core API URL:
```env
REACT_APP_API_URL=https://localhost:<port>/api

```


4. **Run the React App:**
```bash
npm start

```


*(Note: If you created the React app with Vite, use `npm run dev` instead).*
*The frontend will start running, usually on `http://localhost:3000` or `http://localhost:5173`. It will now communicate with your running .NET API.*

---

## 🧪 Backend Unit Testing

This project prioritizes code quality with extensive unit testing. Tests are isolated using **Moq** for dependency injection and **EF Core In-Memory Databases** to simulate database interactions.

### What is Tested?

* `JwtService`: Token generation, claim validation, and configuration mocking.
* `AuthController`: Registration logic, login validation, and password hashing paths.
* `UserController`: Profile retrieval, updates, JWT claim parsing (`HttpContext` mocking), and cascading soft-delete logic.

### How to Run the Tests

Navigate to the root directory of the backend solution and run:

```bash
dotnet test

```

## 👨‍💻 Author

**Muhammad Sufyan Khan**

* GitHub: [@MuhammadSufyanKhn](https://www.google.com/search?q=https://github.com/MuhammadSufyanKhn)

```

***

### README mein Frontend Folder path ka khayal rakhiye ga:
Jahan `cd path/to/your/react-folder` likha hai, agar aapka react folder repo ke andar hi hai (jaise `frontend` naam ka folder hai), toh usay GitHub par edit kar ke `cd frontend` kar dijiye ga taa ke parhne wale ke liye aur asaan ho jaye!

```
