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

    const containerStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        width: "100vw",
        paddingTop: "5px", 
        boxSizing: "border-box"
    };

    const cardStyle = {
        backgroundColor: "#fff",
        padding: "25px", 
        borderRadius: "15px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        width: "449.988px",
        maxWidth: "450px" // Exact same width
    };

    const headerStyle = {
        textAlign: "center",
        fontSize: "24px",
        fontWeight: "bold",
        marginTop: "20px",
        marginBottom: "20px",
        borderBottom: "2px solid #28a745",
        paddingBottom: "10px"
    };

    const labelStyle = {
        display: "block",
        fontWeight: "600",
        marginBottom: "6px", 
        marginTop: "12px",
        fontSize: "15px",
        color: "#000"
    };

    const dataBoxStyle = {
        width: "100%",
        padding: "8px 10px",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        color: "#333",
        boxSizing: "border-box",
        minHeight: "36px",
        display: "flex"
    };

    const rowStyle = {
        display: "flex",
        justifyContent: "space-between",
        gap: "20px"
    };

    const buttonStyle = {
        width: "100%",
        padding: "13px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        marginTop: "25px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px"
    };

    const linkButtonStyle = {
        background: "none",
        border: "none",
        color: "#666",
        textDecoration: "underline",
        cursor: "pointer",
        marginTop: "15px",
        display: "block",
        width: "100%",
        textAlign: "center"
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerStyle}>📝 Task Details</div>

                <label style={labelStyle}>Task Title</label>
                <div style={dataBoxStyle}>{task.title}</div>

                <label style={labelStyle}>Description</label>
                <div style={{ ...dataBoxStyle, minHeight: "80px" }}>{task.descriptions}</div>

                <div style={rowStyle}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Priority</label>
                        <div style={dataBoxStyle}>{task.taskPriority}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Status</label>
                        <div style={dataBoxStyle}>{task.taskStatus}</div>
                    </div>
                </div>

                <label style={labelStyle}>Due Date</label>
                <div style={dataBoxStyle}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                </div>

                <button
                    style={buttonStyle}
                    onClick={() => navigate(`/edit-task/${taskId}`)}
                >
                    💾 Edit Task
                </button>

                <button
                    style={linkButtonStyle}
                    onClick={() => navigate(-1)}
                >
                    Cancel & Go Back
                </button>
            </div>
        </div>
    );
};

export default ViewTaskDetails;