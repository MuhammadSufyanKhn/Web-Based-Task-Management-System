import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const AdminEditTask = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState({
        title: "",
        descriptions: "",
        taskPriority: "Medium",
        dueDate: "",
        taskStatus: "Pending"
    });

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await axios.get(
                    `https://localhost:7127/api/Task/${id}`,
                    { headers }
                );
                setTask({
                    title: res.data.title || "",
                    descriptions: res.data.descriptions || "",
                    taskPriority: res.data.taskPriority || "Medium",
                    dueDate: res.data.dueDate || "",
                    taskStatus: res.data.taskStatus || "Pending"
                });

                if (res.data.dueDate) {
                    res.data.dueDate = res.data.dueDate.split("T")[0];
                }

                setTask(res.data);
            } catch (err) {
                alert("Failed to fetch task details");
                navigate("/AdminAllTasks");
            }
        };
        if(id)
            fetchTask();
    }, [id]);

    const handleChange = (e) => {
        setTask({ ...task, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.put(
                `https://localhost:7127/api/Task/update-task/${id}`,
                task,
                { headers }
            );

            alert("Task Updated!");
            navigate("/AdminAllTasks");
        } catch (err) {
            console.error("Error updating task", err);
        }
    };

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
                borderRadius: "0 0 15px 15px"
            }}>
                🛠️ Admin Task Editor
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
                    padding: "20px",
                    borderRadius: "15px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    borderTop: "5px solid #28a745", 
                    boxSizing: "border-box",
                    position: "relative",
                    right: "0.5%",
                }}>
                    <h2 style={{
                        textAlign: "center",
                        marginBottom: "20px",
                        borderBottom: "2px solid #eee",
                        paddingBottom: "10px",
                        fontSize: "22px",
                        color: "#333"
                    }}>
                        ✏️ Edit Task
                    </h2>

                    <form onSubmit={handleSave}>

                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Task Title
                            </label>
                            <input
                                name="title"
                                value={task.title}
                                onChange={handleChange}
                                type="text"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#fdfdfd",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Description
                            </label>
                            <textarea
                                name="descriptions"
                                value={task.descriptions}
                                onChange={handleChange}
                                rows="4"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#fdfdfd",
                                    resize: "none",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <div style={{
                            display: "flex",
                            gap: "15px",
                            marginBottom: "15px"
                        }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                    Priority
                                </label>
                                <select
                                    name="taskPriority"
                                    value={task.taskPriority}
                                    onChange={handleChange}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#fdfdfd",
                                        boxSizing: "border-box",
                                        cursor: "pointer"
                                    }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                    Status
                                </label>
                                <select
                                    name="taskStatus"
                                    value={task.taskStatus}
                                    onChange={handleChange}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#fdfdfd",
                                        boxSizing: "border-box",
                                        cursor: "pointer"
                                    }}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="InProgress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: "25px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Due Date
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                value={task.dueDate}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#fdfdfd",
                                    boxSizing: "border-box",
                                    cursor: "pointer"
                                }}
                            />
                        </div>

                        <button type="submit" style={{
                            width: "100%",
                            padding: "14px",
                            backgroundColor: "#007bff",
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

                        <button
                            type="button"
                            onClick={() => navigate("/AdminAllTasks")}
                            style={{
                                width: "100%",
                                background: "none",
                                color: "#888", 
                                border: "none",
                                marginTop: "15px",
                                cursor: "pointer",
                                fontSize: "15px",
                                fontWeight: "500",
                                textDecoration: "underline"
                            }}
                        >
                            Cancel & Go Back
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminEditTask;