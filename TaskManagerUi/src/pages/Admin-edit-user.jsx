import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminEditUser = () => {
    const userId = window.location.pathname.split("/").pop();
    // Removed unused userData state to clean things up
    const [user, setUser] = useState({ userName: '', email: '', password: '' });
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // FIX 1: Use the userId in the URL to fetch the specific user, not the logged-in profile
        axios.get(`https://localhost:7127/api/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            setUser({
                userName: res.data.userName || '',
                email: res.data.email || '',
                password: '' 
            });
        })
        .catch(err => console.error("Error fetching user details", err));
    }, [navigate, userId]); // Added userId to dependency array

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        try {
            // FIX 2: Send the update request to a specific user endpoint, not the admin's own profile
            await axios.put(`https://localhost:7127/api/user/${userId}`, user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsEditing(false);
            alert("User Profile Updated Successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update user profile");
        }
    };

    const styles = {
        pageWrapper: {
            backgroundColor: "#f4f7f6",
            height: "92vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: "20px"
        },
        card: {
            width: "90%",
            maxWidth: "600px",
            backgroundColor: "#fff",
            borderRadius: "15px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            padding: "20px",
            boxSizing: "border-box",
            maxHeight: "90vh"
        },
        header: {
            textAlign: "center",
            color: "#1a3a5a",
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "30px"
        },
        fieldGroup: {
            marginBottom: "20px"
        },
        label: {
            display: "block",
            fontSize: "15px",
            fontWeight: "600",
            color: "#555",
            marginBottom: "8px"
        },
        input: {
            width: "100%",
            padding: "12px 15px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            backgroundColor: "#f8f9fa",
            fontSize: "15px",
            color: "#333",
            boxSizing: "border-box",
            outline: "none",
            transition: "border 0.2s"
        },
        readonlyBox: {
            width: "100%",
            padding: "12px 15px",
            borderRadius: "8px",
            border: "1px solid #f0f0f0",
            backgroundColor: "#fdfdfd",
            fontSize: "15px",
            color: "#666",
            boxSizing: "border-box"
        },
        buttonContainer: {
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginTop: "30px"
        },
        btnEdit: {
            padding: "12px 30px",
            backgroundColor: "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background 0.3s"
        },
        btnSave: {
            padding: "12px 30px",
            backgroundColor: "#2ecc71",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
        },
        btnLogout: {
            padding: "12px 30px",
            backgroundColor: "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
        },
        cancelLink: {
            display: "block",
            textAlign: "center",
            marginTop: "20px",
            color: "#888",
            textDecoration: "none",
            fontSize: "14px",
            cursor: "pointer"
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <h1>Task Management System</h1>
            <div style={styles.card}>
                <h2 style={styles.header}>Edit User: {user.userName}</h2>
                
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>Full Name</label>
                    {isEditing ? (
                        <input 
                            style={styles.input}
                            name="userName"
                            value={user.userName} 
                            onChange={(e) => setUser({...user, userName: e.target.value})} 
                        />
                    ) : (
                        <div style={styles.readonlyBox}>{user.userName}</div>
                    )}
                </div>

                <div style={styles.fieldGroup}>
                    <label style={styles.label}>Email Address</label>
                    {isEditing ? (
                        <input 
                            style={styles.input}
                            name="email"
                            value={user.email} 
                            onChange={(e) => setUser({...user, email: e.target.value})} 
                        />
                    ) : (
                        <div style={styles.readonlyBox}>{user.email}</div>
                    )}
                </div>

                <div style={styles.fieldGroup}>
                    <label style={styles.label}>Password</label>
                    {isEditing ? (
                        <input 
                            type="password"
                            style={styles.input}
                            name="password"
                            placeholder="Enter new password (optional)"
                            value={user.password}
                            onChange={(e) => setUser({...user, password: e.target.value})} 
                        />
                    ) : (
                        <div style={styles.readonlyBox}>********</div>
                    )}
                </div>
                
                <div style={styles.buttonContainer}>
                    <button 
                        style={isEditing ? styles.btnSave : styles.btnEdit}
                        onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                    >
                        {isEditing ? "Save Changes" : "Edit User"}
                    </button>
                </div>

                <span style={styles.cancelLink} onClick={() => navigate('/AllUsersList')}>
                    Cancel & Go Back
                </span>
            </div>
        </div>
    );
};

export default AdminEditUser;