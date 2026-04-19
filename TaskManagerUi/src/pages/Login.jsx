import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('https://localhost:7127/api/auth/login', { email, password });

            // Token ko browser mein save karna taake har page par use ho sake
            localStorage.setItem('token', res.data.token);

            alert("Mubarak ho! Login ho gaya.");
            window.location.href = "/dashboard"; // Redirecting to dashboard
        } catch (err) {
            alert("Ghalat Email ya Password!");
        }
    };

    return (
        <div >
            <form onSubmit={handleLogin} style={{ width: '100%' }}>
                <input
                    type="email"
                    placeholder="Email"
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Chalo Bhai!</button>
            </form>
        </div>
    );
};

export default Login;