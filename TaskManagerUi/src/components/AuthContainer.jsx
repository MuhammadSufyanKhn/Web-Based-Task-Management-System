import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthHeroVisual from './AuthHeroVisual';

const AuthContainer = ({ initialMode = 'login' }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine mode from initialMode and location
    const [isRegister, setIsRegister] = useState(
        initialMode === 'register' || location.pathname === '/register'
    );

    // Keep state in sync if user uses browser Back / Forward buttons
    useEffect(() => {
        setIsRegister(location.pathname === '/register');
    }, [location.pathname]);

    // ── Login Form State ──────────────────────────────────────────
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // ── Register Form State ───────────────────────────────────────
    const [regUser, setRegUser] = useState({ username: '', email: '', password: '' });
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');

    const switchToRegister = () => {
        setIsRegister(true);
        navigate('/register', { replace: true });
    };

    const switchToLogin = () => {
        setIsRegister(false);
        navigate('/login', { replace: true });
    };

    // ── Handle Login Submit ───────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');

        try {
            const res = await axios.post('https://localhost:7127/api/auth/login', {
                email: loginEmail,
                password: loginPassword
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
            setLoginError("Invalid Email or Password!");
            alert("Invalid Email or Password!");
        } finally {
            setLoginLoading(false);
        }
    };

    // ── Handle Register Submit ────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        setRegError('');
        setRegSuccess('');

        if (regConfirmPassword && regUser.password !== regConfirmPassword) {
            setRegError("Passwords do not match!");
            alert("Passwords do not match!");
            return;
        }

        setRegLoading(true);
        try {
            await axios.post('https://localhost:7127/api/auth/register', regUser);
            setRegSuccess("Account created successfully! Switching to sign in...");
            alert("User Registered!");
            setTimeout(() => {
                switchToLogin();
            }, 1200);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || "Registration Failed!";
            setRegError(typeof msg === 'string' ? msg : "Registration Failed!");
            alert(typeof msg === 'string' ? msg : "Registration Failed!");
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <div className="auth-master-wrapper">
            {/* ── Panel 1: Sliding Visual Hero Panel ──────────────── */}
            {/* When Login: Left side (0% -> 50%). When Register: Slides right (50% -> 100%) */}
            <div className={`auth-slider-panel auth-hero-panel ${isRegister ? 'panel-register' : 'panel-login'}`}>
                <AuthHeroVisual isRegister={isRegister} />
            </div>

            {/* ── Panel 2: Sliding Form Panel ─────────────────────── */}
            {/* When Login: Right side (50% -> 100%). When Register: Slides left (0% -> 50%) */}
            <div className={`auth-slider-panel auth-form-panel ${isRegister ? 'panel-register' : 'panel-login'}`}>
                <div
                    className="auth-card-animate"
                    key={isRegister ? 'register-card' : 'login-card'}
                    style={{
                        width: '100%',
                        maxWidth: '450px',
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '36px 36px',
                        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.12), 0 0 1px rgba(15, 23, 42, 0.15)',
                        border: '1px solid #cbd5e1',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Sliding Toggle Tabs */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div className="auth-toggle-tab">
                            <button
                                type="button"
                                onClick={switchToLogin}
                                className={!isRegister ? 'active' : ''}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={switchToRegister}
                                className={isRegister ? 'active' : ''}
                            >
                                Create Account
                            </button>
                        </div>
                    </div>

                    {/* ── LOGIN FORM CARD ──────────────────────────── */}
                    {!isRegister ? (
                        <div>
                            {/* Card Header */}
                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 12px auto',
                                    fontSize: '22px',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.35)'
                                }}>
                                    ⚡
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                                    Welcome Back
                                </h2>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                    Enter your credentials to access your workspace
                                </p>
                            </div>

                            {/* Error Alert */}
                            {loginError && (
                                <div style={{
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    marginBottom: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>⚠️</span>
                                    <span>{loginError}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e3a8a', marginBottom: '6px' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '42px',
                                            padding: '0 14px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1e3a8a';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e3a8a', marginBottom: '6px' }}>
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '42px',
                                            padding: '0 14px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1e3a8a';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loginLoading}
                                    style={{
                                        width: '100%',
                                        height: '44px',
                                        backgroundColor: '#1e3a8a',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        cursor: loginLoading ? 'not-allowed' : 'pointer',
                                        marginTop: '6px',
                                        boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => { if (!loginLoading) e.currentTarget.style.backgroundColor = '#172554'; }}
                                    onMouseLeave={(e) => { if (!loginLoading) e.currentTarget.style.backgroundColor = '#1e3a8a'; }}
                                >
                                    {loginLoading ? 'Signing in...' : 'Login'}
                                </button>
                            </form>

                            {/* Footer link */}
                            <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#64748b' }}>
                                Don't have an account?{' '}
                                <a
                                    href="/register"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        switchToRegister();
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#1e3a8a',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Register
                                </a>
                            </div>
                        </div>
                    ) : (
                        /* ── REGISTER FORM CARD ───────────────────────── */
                        <div>
                            {/* Card Header */}
                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 12px auto',
                                    fontSize: '22px',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.35)'
                                }}>
                                    🚀
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                                    Create Account
                                </h2>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                    Join your team's agile workspace
                                </p>
                            </div>

                            {/* Error Alert */}
                            {regError && (
                                <div style={{
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>⚠️</span>
                                    <span>{regError}</span>
                                </div>
                            )}

                            {/* Success Alert */}
                            {regSuccess && (
                                <div style={{
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    color: '#15803d',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>✓</span>
                                    <span>{regSuccess}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e3a8a', marginBottom: '4px' }}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Name"
                                        value={regUser.username}
                                        onChange={(e) => setRegUser({ ...regUser, username: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 14px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1e3a8a';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e3a8a', marginBottom: '4px' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email"
                                        value={regUser.email}
                                        onChange={(e) => setRegUser({ ...regUser, email: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 14px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1e3a8a';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e3a8a', marginBottom: '4px' }}>
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Password"
                                        value={regUser.password}
                                        onChange={(e) => setRegUser({ ...regUser, password: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 14px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1e3a8a';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e3a8a', marginBottom: '4px' }}>
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Confirm Password"
                                        value={regConfirmPassword}
                                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 14px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1e3a8a';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={regLoading}
                                    style={{
                                        width: '100%',
                                        height: '44px',
                                        backgroundColor: '#1e3a8a',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        cursor: regLoading ? 'not-allowed' : 'pointer',
                                        marginTop: '6px',
                                        boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => { if (!regLoading) e.currentTarget.style.backgroundColor = '#172554'; }}
                                    onMouseLeave={(e) => { if (!regLoading) e.currentTarget.style.backgroundColor = '#1e3a8a'; }}
                                >
                                    {regLoading ? 'Creating Account...' : 'Register'}
                                </button>
                            </form>

                            {/* Footer link */}
                            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                                Already have an account?{' '}
                                <a
                                    href="/login"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        switchToLogin();
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#1e3a8a',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Login
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthContainer;
