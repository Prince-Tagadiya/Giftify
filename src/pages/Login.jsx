import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'wouter'
import '../index.css'
import '../refined_theme.css'

import { useToast } from '../components/ToastContext'

const Login = () => {
    const [, setLocation] = useLocation();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [detectedRole, setDetectedRole] = useState(null);

    // Real-time role check
    React.useEffect(() => {
        const checkRole = async () => {
            if (!email.includes('@') || email.length < 5) {
                setDetectedRole(null);
                return;
            }

            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('../firebase');

                // Use a short timeout to prevent hanging if network is blocked
                const q = query(collection(db, "users"), where("email", "==", email));
                const fetchPromise = getDocs(q);
                // Increased timeout to 3.5s for better reliability on slow networks
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3500));

                const snapshot = await Promise.race([fetchPromise, timeoutPromise]);

                if (!snapshot.empty) {
                    setDetectedRole(snapshot.docs[0].data().role);
                } else {
                    setDetectedRole(null);
                }
            } catch (err) {
                // Silent fail for UX
            }
        };

        const timer = setTimeout(checkRole, 800);
        return () => clearTimeout(timer);
    }, [email]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const { login } = await import('../services/auth');

            const userData = await login(data.email, data.password);

            // Save complete user info locally for dashboards
            localStorage.setItem('user', JSON.stringify({
                ...userData
            }));

            addToast(`Welcome back, ${userData.firstName}!`, 'success');

            // Redirect based on role
            if (userData.role === 'creator') {
                setLocation('/dashboard/creator');
            } else {
                setLocation('/dashboard/fan');
            }

        } catch (err) {
            console.error("Login Error Details:", err);

            let message = `Login failed: ${err.message}`;

            if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("timed out") || err.message.includes("network"))) {
                message = "Network Error: Check your connection.";
            } else if (err.code === 'auth/invalid-credential') {
                message = "Invalid email or password.";
            } else if (err.code === 'auth/invalid-api-key') {
                message = 'Configuration Error: Invalid Firebase API Key.';
            }

            addToast(message, 'error');
            setLoading(false);
        }
    }

    return (
        <div className="modern-app" style={{ overflow: 'hidden', minHeight: '100vh', position: 'relative' }}>
            {/* Background Elements */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            {/* Navigation */}
            <nav className="glass-nav" style={{ background: 'rgba(255,255,255,0.85)', justifyContent: 'space-between', padding: '1rem 2rem', display: 'flex', alignItems: 'center' }}>
                <Link href="/">
                    <div className="logo interactive" style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.5rem' }}>Giftify.</div>
                </Link>
                <Link href="/">
                    <button className="nav-item interactive" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Back to Home</button>
                </Link>
            </nav>

            {/* Login Container */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
                <motion.div
                    className="glass-dashboard"
                    style={{
                        maxWidth: '400px',
                        padding: '2rem',
                        borderRadius: '24px',
                        transform: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        margin: '1rem'
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--c-text-muted)' }}>Enter your credentials to access your account</p>
                    </div>

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={handleLogin}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                className="newsletter-input"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {detectedRole && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginTop: '8px',
                                        fontSize: '0.85rem',
                                        color: detectedRole === 'creator' ? '#16A34A' : '#2563EB',
                                        fontWeight: 600,
                                        background: detectedRole === 'creator' ? '#DCFCE7' : '#EFF6FF',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        width: 'fit-content'
                                    }}
                                >
                                    <span>{detectedRole === 'creator' ? '🦁' : '🦄'}</span>
                                    {detectedRole === 'creator' ? 'Creator Account Detected' : 'Fan Account Detected'}
                                </motion.div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                            <input type="password" name="password" placeholder="••••••••" className="newsletter-input" required />
                        </div>

                        <button
                            disabled={loading}
                            className="btn-primary interactive"
                            style={{
                                background: loading ? '#94A3B8' : 'var(--grad-primary)',
                                border: 'none',
                                padding: '12px',
                                marginTop: '0.5rem',
                                width: '100%',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner"></div> Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
                        Don't have an account? <Link href="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Login
