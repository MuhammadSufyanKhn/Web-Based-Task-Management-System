import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/Tasklist';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/edit-task';
import Profile from './pages/profile';
import ViewTaskDetails from './pages/ViewDetails';
import ViewAllTasks from './pages/viewalltask';
import AdminDashboard from './pages/Admin-dashboard';
import AdminAllTasks from './pages/AdminAllTasks';
import AdminEditTask from './pages/Admin-Edit-Task';
import AllUsersList from './pages/AllUsersList';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute> <Dashboard /> </ProtectedRoute>
          } />
          <Route path="/my-tasks" element={
            <ProtectedRoute> <TaskList /> </ProtectedRoute>
          } />
          <Route path="/create-task" element={
            <ProtectedRoute> <CreateTask /> </ProtectedRoute>
          } />
          <Route path="/edit-task/:id" element={
            <ProtectedRoute> <EditTask /> </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute> <Profile /> </ProtectedRoute>
          } />
          <Route path="/ViewTaskDetails/:id" element={
            <ProtectedRoute> <ViewTaskDetails /> </ProtectedRoute>
          } />
          <Route path="/view-all-tasks" element={
            <ProtectedRoute> <ViewAllTasks /> </ProtectedRoute>
          } />
          <Route path="/Admin-dashboard" element={
            <ProtectedRoute> <AdminDashboard /> </ProtectedRoute>
          } />
          <Route path="/AdminAllTasks" element={
            <ProtectedRoute> <AdminAllTasks /> </ProtectedRoute>
          } />
          <Route path="/AllUsersList" element={
            <ProtectedRoute> <AllUsersList /> </ProtectedRoute>
          } />
          <Route path="/Admin-edit-task/:id" element={
            <ProtectedRoute> <AdminEditTask /> </ProtectedRoute>
          } />

        </Routes>
      </div>
    </Router>
  );
}

export default App;