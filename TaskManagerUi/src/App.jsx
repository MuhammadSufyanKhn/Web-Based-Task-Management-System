import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/Tasklist';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/edit-task';

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

            </div>
          } />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-tasks" element={<TaskList />} />
          <Route path="/create-task" element={<CreateTask />} />
          <Route path="/edit-task/:id" element={<EditTask />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;