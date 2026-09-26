import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import PropTypes from 'prop-types';
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
import AdminEditUser from './pages/Admin-edit-user';
import KanbanBoard from './pages/KanbanBoard';
import ProjectSettings from './pages/ProjectSettings';
import Backlog from './pages/Backlog';
import ProjectReports from './pages/ProjectReports';
import ListView from './pages/ListView';
import CalendarView from './pages/CalendarView';
import TimelineView from './pages/TimelineView';
import GanttView from './pages/GanttView';
import AppNavbar from './components/AppNavbar';

// Auth guard
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};
ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };

// Pages that use the sidebar shell layout
const WithSidebar = ({ children }) => (
    <div className="app-shell">
        <AppNavbar />
        <main className="app-main">
            {children}
        </main>
    </div>
);
WithSidebar.propTypes = { children: PropTypes.node.isRequired };

const ProtectedWithSidebar = ({ children }) => (
    <ProtectedRoute>
        <WithSidebar>{children}</WithSidebar>
    </ProtectedRoute>
);
ProtectedWithSidebar.propTypes = { children: PropTypes.node.isRequired };

// Pages that are full-screen (auth pages) — no sidebar
const Standalone = ({ children }) => (
    <div style={{ width: '100%' }}>{children}</div>
);
Standalone.propTypes = { children: PropTypes.node.isRequired };

function App() {
    return (
        <Router>
            <Routes>
                {/* Auth routes — no sidebar */}
                <Route path="/"        element={<Navigate to="/login" />} />
                <Route path="/login"    element={<Standalone><Login /></Standalone>} />
                <Route path="/register" element={<Standalone><Register /></Standalone>} />

                {/* Project views — with sidebar */}
                <Route path="/kanban"   element={<ProtectedWithSidebar><KanbanBoard /></ProtectedWithSidebar>} />
                <Route path="/list"     element={<ProtectedWithSidebar><ListView /></ProtectedWithSidebar>} />
                <Route path="/calendar" element={<ProtectedWithSidebar><CalendarView /></ProtectedWithSidebar>} />
                <Route path="/timeline" element={<ProtectedWithSidebar><TimelineView /></ProtectedWithSidebar>} />
                <Route path="/gantt"    element={<ProtectedWithSidebar><GanttView /></ProtectedWithSidebar>} />
                <Route path="/backlog"  element={<ProtectedWithSidebar><Backlog /></ProtectedWithSidebar>} />
                <Route path="/reports"  element={<ProtectedWithSidebar><ProjectReports /></ProtectedWithSidebar>} />
                <Route path="/project-settings" element={<ProtectedWithSidebar><ProjectSettings /></ProtectedWithSidebar>} />

                {/* User routes — with sidebar */}
                <Route path="/dashboard"    element={<ProtectedWithSidebar><Dashboard /></ProtectedWithSidebar>} />
                <Route path="/my-tasks"     element={<ProtectedWithSidebar><TaskList /></ProtectedWithSidebar>} />
                <Route path="/create-task"  element={<ProtectedWithSidebar><CreateTask /></ProtectedWithSidebar>} />
                <Route path="/edit-task/:id" element={<ProtectedWithSidebar><EditTask /></ProtectedWithSidebar>} />
                <Route path="/profile"      element={<ProtectedWithSidebar><Profile /></ProtectedWithSidebar>} />
                <Route path="/ViewTaskDetails/:id" element={<ProtectedWithSidebar><ViewTaskDetails /></ProtectedWithSidebar>} />
                <Route path="/view-all-tasks"      element={<ProtectedWithSidebar><ViewAllTasks /></ProtectedWithSidebar>} />
                <Route path="/view-all-tasks/:userId" element={<ProtectedWithSidebar><ViewAllTasks /></ProtectedWithSidebar>} />

                {/* Admin routes — with sidebar */}
                <Route path="/Admin-dashboard" element={<ProtectedWithSidebar><AdminDashboard /></ProtectedWithSidebar>} />
                <Route path="/AdminAllTasks"   element={<ProtectedWithSidebar><AdminAllTasks /></ProtectedWithSidebar>} />
                <Route path="/AllUsersList"    element={<ProtectedWithSidebar><AllUsersList /></ProtectedWithSidebar>} />
                <Route path="/Admin-edit-task/:id" element={<ProtectedWithSidebar><AdminEditTask /></ProtectedWithSidebar>} />
                <Route path="/Admin-edit-user/:id" element={<ProtectedWithSidebar><AdminEditUser /></ProtectedWithSidebar>} />
            </Routes>
        </Router>
    );
}

export default App;