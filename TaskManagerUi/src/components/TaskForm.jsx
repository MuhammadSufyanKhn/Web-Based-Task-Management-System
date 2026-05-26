import React from "react";
import PropTypes from "prop-types";

const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    backgroundColor: "#fdfdfd",
    boxSizing: "border-box"
};

const labelStyle = {
    fontWeight: "600",
    display: "block",
    marginBottom: "8px",
    color: "#444"
};

const TaskForm = ({ task, handleChange, handleSave, onCancel, title }) => {
    return (
        <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", overflowX: "hidden" }}>
            <h2 style={{
                textAlign: "center",
                paddingBottom: "10px",
                fontSize: "24px",
                backgroundColor: "#28a745",
                color: "white",
                width: "100vh",
                margin: "0 auto",
                borderRadius: "0 0 15px 15px",
                paddingTop: "15px"
            }}>
                🛠️ Task Management System
            </h2>

            <div style={{
                width: "100vw",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingTop: "30px",
                paddingBottom: "30px"
            }}>
                <div style={{
                    width: "100vh",
                    maxWidth: "95%",
                    background: "white",
                    padding: "30px",
                    borderRadius: "15px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    borderTop: "5px solid #28a745",
                    boxSizing: "border-box",
                    position: "relative",
                    right: "0.5%"
                }}>
                    <h2 style={{
                        textAlign: "center",
                        marginBottom: "20px",
                        borderBottom: "2px solid #eee",
                        paddingBottom: "10px",
                        fontSize: "22px",
                        color: "#333"
                    }}>
                        {title}
                    </h2>

                    <form onSubmit={handleSave}>

                        <div style={{ marginBottom: "15px" }}>
                            <label htmlFor="taskTitle" style={labelStyle}>Task Title</label>
                            <input
                                id="taskTitle"
                                name="title"
                                value={task.title}
                                onChange={handleChange}
                                type="text"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label htmlFor="taskDescription" style={labelStyle}>Description</label>
                            <textarea
                                id="taskDescription"
                                name="descriptions"
                                value={task.descriptions}
                                onChange={handleChange}
                                rows="4"
                                style={{ ...inputStyle, resize: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="taskPriority" style={labelStyle}>Priority</label>
                                <select
                                    id="taskPriority"
                                    name="taskPriority"
                                    value={task.taskPriority}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, cursor: "pointer" }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div style={{ flex: 1 }}>
                                <label htmlFor="taskStatus" style={labelStyle}>Status</label>
                                <select
                                    id="taskStatus"
                                    name="taskStatus"
                                    value={task.taskStatus}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, cursor: "pointer" }}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="InProgress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: "25px" }}>
                            <label htmlFor="taskDueDate" style={labelStyle}>Due Date</label>
                            <input
                                id="taskDueDate"
                                type="date"
                                name="dueDate"
                                value={task.dueDate}
                                onChange={handleChange}
                                style={{ ...inputStyle, cursor: "pointer" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button type="submit" style={{
                                width: "100%",
                                padding: "14px",
                                backgroundColor: "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "16px",
                                boxSizing: "border-box",
                                transition: "background 0.3s"
                            }}>
                                💾 Save Changes
                                
                            </button>

                            <button type="button" onClick={onCancel} style={{
                                width: "100%",
                                background: "none",
                                color: "#888",
                                border: "none",
                                marginTop: "10px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                textDecoration: "underline"
                            }}>
                                Cancel & Go Back
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

TaskForm.propTypes = {
    task: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
};

export default TaskForm;