import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const buttonStyle = (bg, color = "white") => ({
    backgroundColor: bg,
    color,
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold"
});

const TaskTable = ({ tasks, onDelete, emptyMessage }) => {
    const navigate = useNavigate();

    return (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
                <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
                    <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>Title</th>
                    <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>Priority</th>
                    <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>Status</th>
                    <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>Due Date</th>
                    <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <tr key={task.taskId} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "12px" }}><strong>{task.title}</strong></td>
                            <td style={{ padding: "12px" }}>
                                <span style={{ fontWeight: "500" }}>{task.taskPriority}</span>
                            </td>
                            <td style={{ padding: "12px" }}>
                                <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", backgroundColor: "#e9ecef" }}>
                                    {task.taskStatus}
                                </span>
                            </td>
                            <td style={{ padding: "12px" }}>
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                            </td>
                            <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                                <button onClick={() => navigate(`/edit-task/${task.taskId}`)} style={buttonStyle("#ffc107", "black")}>Edit</button>
                                <button onClick={() => onDelete(task.taskId)} style={buttonStyle("#dc3545")}>Delete</button>
                                <button onClick={() => navigate(`/ViewTaskDetails/${task.taskId}`)} style={buttonStyle("#17a2b8")}>Details</button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                            {emptyMessage || "No tasks found."}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

TaskTable.propTypes = {
    tasks: PropTypes.array.isRequired,
    onDelete: PropTypes.func.isRequired,
    emptyMessage: PropTypes.string
};

export default TaskTable;