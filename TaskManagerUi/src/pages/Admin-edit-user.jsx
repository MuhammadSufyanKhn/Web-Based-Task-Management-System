import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminEditUser = () => {
    const userId = window.location.pathname.split("/").pop();
    const [user, setUser] = useState({ userName: '', email: '', password: '' });
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

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
    }, [navigate, userId]); 

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`https://localhost:7127/api/user/Update-user/${userId}`, user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsEditing(false);
            alert("User Profile Updated Successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update user profile");
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
                borderRadius: "0 0 15px 15px",
                paddingTop: "15px"
            }}>
                🛠️ Admin Edit User
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
                        ✏️ Edit User: {user.userName}
                    </h2>
                    
                    <div>
                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Full Name
                            </label>
                            {isEditing ? (
                                <input 
                                    name="userName"
                                    value={user.userName} 
                                    onChange={(e) => setUser({...user, userName: e.target.value})} 
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#fdfdfd",
                                        boxSizing: "border-box",
                                        color: "#333"
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f9f9f9",
                                    boxSizing: "border-box",
                                    color: "#555"
                                }}>
                                    {user.userName}
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Email Address
                            </label>
                            {isEditing ? (
                                <input 
                                    name="email"
                                    value={user.email} 
                                    onChange={(e) => setUser({...user, email: e.target.value})} 
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#fdfdfd",
                                        boxSizing: "border-box",
                                        color: "#333"
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f9f9f9",
                                    boxSizing: "border-box",
                                    color: "#555"
                                }}>
                                    {user.email}
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: "25px" }}>
                            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: "#444" }}>
                                Password
                            </label>
                            {isEditing ? (
                                <input 
                                    type="password"
                                    name="password"
                                    placeholder="Enter new password (optional)"
                                    value={user.password}
                                    onChange={(e) => setUser({...user, password: e.target.value})} 
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ddd",
                                        backgroundColor: "#fdfdfd",
                                        boxSizing: "border-box",
                                        color: "#333"
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f9f9f9",
                                    boxSizing: "border-box",
                                    color: "#555"
                                }}>
                                    ********
                                </div>
                            )}
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button 
                                onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    backgroundColor: isEditing ? "#28a745" : "#007bff",
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
                                {isEditing ? "💾 Save Changes" : "✏️ Edit User"}
                            </button>
                            
                            <button
                                onClick={() => navigate('/AllUsersList')}
                                style={{
                                    width: "100%",
                                    background: "none",
                                    color: "#888", 
                                    border: "none",
                                    marginTop: "10px",
                                    cursor: "pointer",
                                    fontSize: "15px",
                                    fontWeight: "500",
                                    textDecoration: "underline"
                                }}
                            >
                                Cancel & Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEditUser;