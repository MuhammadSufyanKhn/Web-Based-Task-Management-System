import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

const CreateTask = () => {
    const [task, setTask] = useState({ title: '', descriptions: '', taskPriority: 'Medium', dueDate: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://localhost:7127/api/task/create-task', task, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Task created successfully!");
            navigate('/dashboard');
        } catch (err) { 
            alert("Error occured! please try again"); 
        }
    };

    return (
        <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", overflowX: "hidden" }}>
            
            {/* Top Header - Green Styling (Matching other pages) */}
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

            {/* Form Container */}
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
                        ✨ Create New Task
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Task Title
                            </label>
                            <input 
                                type="text" 
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#fdfdfd",
                                    boxSizing: "border-box"
                                }} 
                                placeholder="What needs to be done?" 
                                required 
                                onChange={e => setTask({...task, title: e.target.value})} 
                            />
                        </div>
                        
                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Description
                            </label>
                            <textarea 
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#fdfdfd",
                                    resize: "none",
                                    boxSizing: "border-box"
                                }} 
                                rows="3" 
                                placeholder="Add some details..." 
                                onChange={e => setTask({...task, descriptions: e.target.value})}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: "600", display: 'block', marginBottom: '8px', color: "#444" }}>
                                    Priority
                                </label>
                                <select 
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#fdfdfd",
                                        boxSizing: "border-box",
                                        cursor: "pointer"
                                    }}
                                    onChange={e => setTask({...task, taskPriority: e.target.value})}
                                    defaultValue="Medium"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: "600", display: 'block', marginBottom: '8px', color: "#444" }}>
                                    Due Date
                                </label>
                                <input 
                                    type="date" 
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#fdfdfd",
                                        boxSizing: "border-box",
                                        cursor: "pointer"
                                    }} 
                                    onChange={e => setTask({...task, dueDate: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button 
                                type="submit" 
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
                                }}
                            >
                                💾 Save Task
                            </button>
                            
                            <button 
                                type="button" 
                                onClick={() => navigate(-1)} 
                                style={{
                                    width: '100%', 
                                    background: 'none', 
                                    color: '#888', 
                                    border: 'none', 
                                    marginTop: '10px', 
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel & Go Back
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTask;