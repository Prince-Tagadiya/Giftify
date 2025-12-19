import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'wouter'
import '../index.css'
import '../refined_theme.css'

import { useToast } from '../components/ToastContext'
import { Eye, EyeOff } from 'lucide-react'

const Register = () => {
    const [, setLocation] = useLocation();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            // Import dynamically to ensure firebase is initialized
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
            const { doc, setDoc } = await import('firebase/firestore');
            const { auth, db } = await import('../firebase');

            // 1. Create User in Auth with Timeout
            const createPromise = createUserWithEmailAndPassword(auth, data.email, data.password);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Request timed out - Please check your network or adblocker")), 10000)
            );

            try {
                const userCredential = await Promise.race([createPromise, timeoutPromise]);
                const user = userCredential.user;

                // 2. Update Display Name (Auth Layer)
                await updateProfile(user, {
                    displayName: `${data.firstName} ${data.lastName}`
                });

                // ** CRITICAL FIX **: Save role immediately to localStorage as fallback
                // This ensures if Firestore fails/times out, we still know who they are.
                localStorage.setItem('temp_register_role', data.role);

                // 3. Store Role & Details in Firestore
                const userData = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    role: data.role,
                    createdAt: new Date().toISOString()
                };

                const firestorePromise = setDoc(doc(db, "users", user.uid), userData);
                
                // Reuse timeout logic for Firestore write
                const writeTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Firestore write timed out")), 10000)
                );

                await Promise.race([firestorePromise, writeTimeout]);

                addToast('Account created successfully! Please sign in.', 'success');
                setLocation('/login');
            } catch (err) {
                 if (err.message && (err.message.includes("timed out") || err.message.includes("Firestore write timed out"))) {
                    // Timeout hit - but User IS created in Auth.
                    // Use the data we have to let them in anyway.
                    console.warn("Firestore timed out during register - using fallback");
                    
                    addToast("Account created! Database is slow, but you can sign in now.", 'warning');
                    setLocation('/login');
                    return;
                }
                throw err;
            }

        } catch (err) {
            console.error("Registration Error:", err);
            
            let msg = 'Registration failed.';
            if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("timed out") || err.message.includes("BLOCKED") || err.message.includes("Failed to load resource"))) {
                msg = "Network Error: AdBlocker detected. Please disable extensions for localhost.";
            } else if (err.code === 'auth/email-already-in-use') {
                msg = 'Email already in use.';
            } else if (err.code === 'auth/weak-password') {
                msg = 'Password should be at least 6 characters.';
            } else if (err.code === 'unavailable') {
                msg = 'Service timeout. Check your network or AdBlocker.';
            }

            addToast(msg, 'error');
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

            {/* Register Container */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
                <motion.div
                    className="glass-dashboard"
                    style={{
                        maxWidth: '450px',
                        width: '100%',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        transform: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        margin: '1rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Join Giftify</h2>
                        <p style={{ color: '#64748B', fontSize: '1.05rem' }}>Create your account to get started</p>
                    </div>

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={handleRegister}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>First Name</label>
                                <input type="text" name="firstName" placeholder="Jane" className="newsletter-input" required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Last Name</label>
                                <input type="text" name="lastName" placeholder="Doe" className="newsletter-input" required />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Email</label>
                            <input type="email" name="email" placeholder="you@example.com" className="newsletter-input" required />
                        </div>


                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    placeholder="••••••••" 
                                    className="newsletter-input" 
                                    required 
                                    style={{ width: '100%', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#94A3B8'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>I am a...</label>
                            <select name="role" className="newsletter-input" style={{ width: '100%' }}>
                                <option value="fan">Fan (I want to send gifts)</option>
                                <option value="creator">Creator (I want to receive gifts)</option>
                            </select>
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
                                    <div className="spinner"></div> Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
                        Already have an account? <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Register
