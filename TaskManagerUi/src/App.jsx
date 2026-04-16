import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/Tasklist';
import CreateTask from './pages/CreateTask';

function App() {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={
            <div className="card">
              <h2 className="title">Login</h2>
              <Login />
              <div className="footer-link">
                Don't have an account? <Link to="/register">Register</Link>
              </div>
            </div>
          } />

          <Route path="/register" element={
            <div className="card">
              <h2 className="title">Register</h2>
              <Register />
              <div className="footer-link">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </div>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-tasks" element={<TaskList />} />
          <Route path="/create-task" element={<CreateTask />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;