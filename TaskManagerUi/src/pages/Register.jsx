import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
    const [user, setUser] = useState({ username: '', email: '', password: '' });

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('https://localhost:7127/api/auth/register', user);
            alert("User Registered! Ab login karo.");
        } catch (err) {
            alert(err.response?.data || "Registration Fail!");
        }
    };

    return (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
            <h2>Sign Up</h2>
            <input type="text" placeholder="Name" onChange={e => setUser({...user, username: e.target.value})} required />
            <input type="email" placeholder="Email" onChange={e => setUser({...user, email: e.target.value})} required />
            <input type="password" placeholder="Password" onChange={e => setUser({...user, password: e.target.value})} required />
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;