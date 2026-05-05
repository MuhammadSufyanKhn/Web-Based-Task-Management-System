import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('https://localhost:7127/api/auth/login', {
                email,
                password
            });

            localStorage.setItem('token', res.data.token);
            window.location.href = "/dashboard";
        } catch (err) {
            alert("Invalid Email or Password!");
        }
    };

    return (
        <div style={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            position: "fixed",
            top: 0,
            left: 0
        }}>
            <form
                onSubmit={handleLogin}
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "40px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    color: "white"
                }}
            >
                <h2 style={{
                    textAlign: "center",
                    marginBottom: "10px",
                    fontSize: "28px",
                    fontWeight: "700",
                    letterSpacing: "1px"
                }}>
                    Welcome Back
                </h2>

                <p style={{
                    textAlign: "center",
                    fontSize: "14px",
                    opacity: 0.7,
                    marginTop: "-10px"
                }}>
                    Login to continue
                </p>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        outline: "none"
                    }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        outline: "none"
                    }}
                />

                <button
                    type="submit"
                    style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "0.3s",
                        marginTop: "10px"
                    }}
                    onMouseOver={(e) => e.target.style.opacity = 0.85}
                    onMouseOut={(e) => e.target.style.opacity = 1}
                >
                    Login
                </button>

                <div style={{
                    textAlign: "center",
                    fontSize: "14px",
                    marginTop: "10px"
                }}>
                    Don't have an account? <Link to="/register" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: "600" }}>Register</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;