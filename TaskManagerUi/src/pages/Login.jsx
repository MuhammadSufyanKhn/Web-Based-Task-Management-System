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
            backgroundColor: '#f8fafd',
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
                backgroundColor: '#f8fafd',
                position: 'relative'
            }}>
                <div className="auth-card-animate" style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '36px 36px',
                    boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.12), 0 0 1px rgba(15, 23, 42, 0.15)',
                    border: '1px solid #cbdcf7',
                    boxSizing: 'border-box'
                }}>
                    {/* Navigation Toggle Tabs */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <div className="auth-toggle-tab">
                            <Link to="/login" className="active">Sign In</Link>
                            <Link to="/register">Create Account</Link>
                        </div>
                    </div>

                    {/* Header */}
                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #305CDE, #2448b8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 14px auto',
                            fontSize: '22px',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(48, 92, 222, 0.35)'
                        }}>
                            ⚡
                        </div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#0f172a',
                            margin: '0 0 6px 0',
                            letterSpacing: '-0.3px'
                        }}>
                            Welcome Back
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            margin: 0
                        }}>
                            Enter your credentials to access your workspace
                        </p>
                    </div>

                    {/* Inline Error State */}
                    {errorMessage && (
                        <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#b91c1c',
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
                                color: '#334155',
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
                                    border: '1px solid #cbdcf7',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#305CDE';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(48, 92, 222, 0.18)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#cbdcf7';
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
                                    color: '#334155'
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
                                    border: '1px solid #cbdcf7',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#305CDE';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(48, 92, 222, 0.18)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#cbdcf7';
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
                                    ? '#94a3b8' 
                                    : 'linear-gradient(135deg, #305CDE, #2448b8)',
                                color: '#ffffff',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 14px rgba(48, 92, 222, 0.35)',
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
                        borderTop: '1px solid #e2e8f0',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#64748b'
                    }}>
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            style={{
                                color: '#305CDE',
                                textDecoration: 'none',
                                fontWeight: '700'
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
