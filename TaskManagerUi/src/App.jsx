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

// ProtectedRoute Component for checking token before rendering protected pages
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;