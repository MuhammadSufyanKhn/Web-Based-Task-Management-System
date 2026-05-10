import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const AllUsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const fetchAllUsers = async () => {
        try {
            if (!token) {
                navigate('/login');
                return;
            }
            const res = await fetch(`https://localhost:7127/api/Task/AllUsers`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAllUsers();
    }, []);

    const handleEdit = (userId) => {
        navigate(`/Admin-edit-user/${userId}`);
    };

    const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
        try {
            await axios.delete(`https://localhost:7127/api/user/Delete-user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUsers(prevUsers => prevUsers.filter(user => user.userId !== userId));
            
            window.alert("User deleted successfully!");
            
        } catch (error) {
            console.error("Error deleting user:", error);
            window.alert("Failed to delete user. Backend mein koi error hai.");
        }
    }
};

    if (loading) return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;

    return (
        <div style={{
            maxWidth: '1100px',
            margin: '40px auto',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>👥 All Users (Admin)</h2>
                    <p style={{ marginLeft: '5px', color: '#666', fontSize: '14px' }}>
                        Manage all registered users and view their task counts.
                    </p>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>User ID</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>User Name</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Email</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>No. of Tasks</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map(user => (
                            <tr key={user.userId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>{user.userId}</td>
                                <td style={{ padding: '12px' }}><strong>{user.userName}</strong></td>
                                <td style={{ padding: '12px', color: '#555' }}>{user.email}</td>

                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        backgroundColor: '#e9ecef',
                                        fontWeight: 'bold'
                                    }}>
                                        {user.totalTasks || 0}
                                    </span>
                                </td>

                                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEdit(user.userId)}
                                        style={{
                                            backgroundColor: '#ffc107',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.userId)}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                No users found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <Link to="/Admin-dashboard" style={{
                    color: '#1a1a40',
                    textDecoration: 'none',
                    fontSize: '14px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '2px solid #1a1a40',
                    fontWeight: 'bold'
                }}>
                    ← Back to Admin Dashboard
                </Link>
            </div>
        </div>
    );
};

export default AllUsersList;