import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AuthHeroVisual from '../components/AuthHeroVisual';

const Register = () => {
    const [user, setUser] = useState({ username: '', email: '', password: '' });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (confirmPassword && user.password !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            alert("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            await axios.post('https://localhost:7127/api/auth/register', user);
            setSuccessMessage("Account created successfully! Redirecting to login...");
            alert("User Registered!");
            window.location.href = "/login"; 
        } catch (err) {
            const msg = err.response?.data || "Registration Failed!";
            setErrorMessage(typeof msg === 'string' ? msg : 'Registration Failed!');
            alert(typeof msg === 'string' ? msg : "Registration Failed!");
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
            {/* Split Screen - Left: Register Form */}
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
                    maxWidth: '460px',
                    backgroundColor: '#111827',
                    borderRadius: '16px',
                    padding: '36px 36px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxSizing: 'border-box'
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 14px auto',
                            fontSize: '22px',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                        }}>
                            🚀
                        </div>
                        <h2 style={{
                            fontSize: '26px',
                            fontWeight: '700',
                            color: '#ffffff',
                            margin: '0 0 6px 0',
                            letterSpacing: '-0.3px'
                        }}>
                            Create Account
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#94a3b8',
                            margin: 0
                        }}>
                            Join your team's agile workspace
                        </p>
                    </div>

                    {/* Messages */}
                    {errorMessage && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '18px',
                            color: '#f87171',
                            fontSize: '13px'
                        }}>
                            ⚠️ {errorMessage}
                        </div>
                    )}
                    {successMessage && (
                        <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '18px',
                            color: '#34d399',
                            fontSize: '13px'
                        }}>
                            ✓ {successMessage}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#e2e8f0',
                                marginBottom: '6px'
                            }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="Name"
                                value={user.username}
                                onChange={e => setUser({...user, username: e.target.value})}
                                required
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#10b981';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

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
                                value={user.email}
                                onChange={e => setUser({...user, email: e.target.value})}
                                required
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#10b981';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#e2e8f0',
                                marginBottom: '6px'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="Password"
                                value={user.password}
                                onChange={e => setUser({...user, password: e.target.value})}
                                required
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#10b981';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#e2e8f0',
                                marginBottom: '6px'
                            }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#10b981';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
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
                                    : 'linear-gradient(135deg, #10b981, #0d9488)',
                                color: '#ffffff',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                marginTop: '4px'
                            }}
                            onMouseOver={(e) => {
                                if (!loading) e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseOut={(e) => {
                                if (!loading) e.currentTarget.style.opacity = '1';
                            }}
                        >
                            {loading ? "Creating Account..." : "Register"}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{
                        marginTop: '24px',
                        paddingTop: '18px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#94a3b8'
                    }}>
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            style={{
                                color: '#38bdf8',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </div>

            {/* Split Screen - Right: Professional Visual */}
            <AuthHeroVisual
                title="Collaborate at the Speed of Light"
                subtitle="Join thousands of engineering teams utilizing modern agile sprints, real-time board sync, and deep analytical reports."
            />
        </div>
    );
};

export default Register;