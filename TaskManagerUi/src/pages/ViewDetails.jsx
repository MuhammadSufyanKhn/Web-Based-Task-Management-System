import React from "react";
import { useNavigate } from "react-router-dom";

const ViewTaskDetails = () => {
    const taskId = window.location.pathname.split("/").pop();
    const [task, setTask] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const fetchTaskDetails = async () => {
        try {
            const res = await fetch(`https://localhost:7127/api/task/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch task details");
            const data = await res.json();
            setTask(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTaskDetails();
    }, []);

    if (loading)
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>
        );
    if (error)
        return (
            <div style={{ textAlign: "center", color: "red", marginTop: "50px" }}>Error: {error}</div>
        );

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
                🛠️ Task Details
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
                        📄 Task Information
                    </h2>

                    <div>
                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Task Title
                            </label>
                            <input
                                value={task.title || ""}
                                type="text"
                                readOnly
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f9f9f9",
                                    boxSizing: "border-box",
                                    color: "#555"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Description
                            </label>
                            <textarea
                                value={task.descriptions || ""}
                                rows="4"
                                readOnly
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f9f9f9",
                                    resize: "none",
                                    boxSizing: "border-box",
                                    color: "#555"
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
                                <input
                                    value={task.taskPriority || ""}
                                    type="text"
                                    readOnly
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#f9f9f9",
                                        boxSizing: "border-box",
                                        color: "#555"
                                    }}
                                />
                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                    Status
                                </label>
                                <input
                                    value={task.taskStatus || ""}
                                    type="text"
                                    readOnly
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#f9f9f9",
                                        boxSizing: "border-box",
                                        color: "#555"
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: "25px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Due Date
                            </label>
                            <input
                                type="text"
                                value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                                readOnly
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f9f9f9",
                                    boxSizing: "border-box",
                                    color: "#555"
                                }}
                            />
                        </div>

                        <button 
                            onClick={() => navigate(`/edit-task/${taskId}`)}
                            style={{
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
                            💾 Edit Task
                        </button>

                        <button 
                            onClick={() => navigate(-1)}
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
                            }}>
                            Cancel & Go Back
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTaskDetails;