import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthHeroVisual from '../components/AuthHeroVisual';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            const res = await axios.post('https://localhost:7127/api/auth/login', {
                email,
                password
            });

            localStorage.setItem('token', res.data.token);

            const decoded = jwtDecode(res.data.token);
            const userRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            if (userRole === 'Admin') {
                window.location.href = "/Admin-dashboard";
            } else {
                window.location.href = "/dashboard";
            }
        } catch (err) {
            setErrorMessage("Invalid Email or Password!");
            alert("Invalid Email or Password!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#0b0f19',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            overflowY: 'auto'
        }} className="auth-split-container">
            {/* Split Screen - Left: Professional Visual */}
            <AuthHeroVisual
                title="Welcome to Task Management System"
                subtitle="Streamline sprints, automate task workflows, and track team velocity with enterprise-grade agility."
            />

            {/* Split Screen - Right: Login Form */}
            <div style={{
                flex: '1 1 50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 24px',
                backgroundColor: '#0b1120',
                position: 'relative'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: '#111827',
                    borderRadius: '16px',
                    padding: '40px 36px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxSizing: 'border-box'
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px auto',
                            fontSize: '22px',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
                        }}>
                            ⚡
                        </div>
                        <h2 style={{
                            fontSize: '26px',
                            fontWeight: '700',
                            color: '#ffffff',
                            margin: '0 0 6px 0',
                            letterSpacing: '-0.3px'
                        }}>
                            Welcome Back
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#94a3b8',
                            margin: 0
                        }}>
                            Enter your credentials to access your workspace
                        </p>
                    </div>

                    {/* Inline Error State */}
                    {errorMessage && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#f87171',
                            fontSize: '13px'
                        }}>
                            <span>⚠️</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#e2e8f0',
                                marginBottom: '6px'
                            }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '6px'
                            }}>
                                <label style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#e2e8f0'
                                }}>
                                    Password
                                </label>
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '13px',
                                borderRadius: '10px',
                                border: 'none',
                                background: loading 
                                    ? '#475569' 
                                    : 'linear-gradient(135deg, #3b82f6, #4f46e5)',
                                color: '#ffffff',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                marginTop: '6px'
                            }}
                            onMouseOver={(e) => {
                                if (!loading) e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseOut={(e) => {
                                if (!loading) e.currentTarget.style.opacity = '1';
                            }}
                        >
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </form>

                    {/* Footer / Register Link */}
                    <div style={{
                        marginTop: '28px',
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#94a3b8'
                    }}>
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            style={{
                                color: '#60a5fa',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;