import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditTask = () => {
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

                if (res.data.dueDate) {
                    res.data.dueDate = res.data.dueDate.split("T")[0];
                }

                setTask(res.data);
            } catch (err) {
                alert("Failed to fetch task details");
                navigate("/dashboard");
            }
        };

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
            navigate("/dashboard");
        } catch (err) {
            console.error("Error updating task", err);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f0f2f5"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "520px",
                background: "white",
                padding: "30px",
                borderRadius: "15px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
            }}>

                <h2 style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    borderBottom: "2px solid #28a745",
                    paddingBottom: "10px",
                    fontSize: "24px"
                }}>
                    ✏️ Edit Task
                </h2>

                <form onSubmit={handleSave}>

                    <div style={{ marginBottom: "15px" }}>
                        <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
                            Task Title
                        </label>
                        <input
                            name="title"
                            value={task.title}
                            onChange={handleChange}
                            type="text"
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "6px",
                                border: "1px solid #ddd"
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
                            Description
                        </label>
                        <textarea
                            name="descriptions"
                            value={task.descriptions}
                            onChange={handleChange}
                            rows="3"
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "6px",
                                border: "1px solid #ddd",
                                resize: "none"
                            }}
                        />
                    </div>

                    <div style={{
                        display: "flex",
                        gap: "15px",
                        marginBottom: "15px"
                    }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
                                Priority
                            </label>
                            <select
                                name="taskPriority"
                                value={task.taskPriority}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd"
                                }}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
                                Status
                            </label>
                            <select
                                name="taskStatus"
                                value={task.taskStatus}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd"
                                }}
                            >
                                <option value="Pending">Pending</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
                            Due Date
                        </label>
                        <input
                            type="date"
                            name="dueDate"
                            value={task.dueDate}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "6px",
                                border: "1px solid #ddd"
                            }}
                        />
                    </div>

                    <button type="submit" style={{
                        width: "100%",
                        padding: "14px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}>
                        💾 Save Changes
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        style={{
                            width: "100%",
                            background: "none",
                            color: "#666",
                            border: "none",
                            marginTop: "10px",
                            cursor: "pointer"
                        }}
                    >
                        Cancel & Go Back
                    </button>

                </form>
            </div>
        </div>
    );
};

export default EditTask;