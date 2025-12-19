import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'wouter'
import '../index.css'
import '../refined_theme.css'

import { useToast } from '../components/ToastContext'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
    const [, setLocation] = useLocation();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // New State

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
                // Increased timeout to 10s to avoid false positives
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
                
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

        // ---------------------------------------------------------
        // DEMO / FAKE LOGIN BYPASS (For seeded data)
        // ---------------------------------------------------------
        const DEMO_PASSWORDS = {
            'logistics@giftify.com': 'logistics123',
            'fan@giftify.com': 'fan123',
            'samay@giftify.com': 'samay123' // Specific request
        };

        // Allow simple password 'password123' for any seeded user
        const isGenericDemoPass = data.password === 'password123';
        const isSpecificDemoPass = DEMO_PASSWORDS[data.email] === data.password;
        
        // Special Master Admin Bypass
        if (data.email === 'admin@giftify.com' && data.password === 'admin123') {
             const adminUser = { uid: 'admin_master_1', email: 'admin@giftify.com', firstName: 'Admin', lastName: 'Master', role: 'admin', verified: true };
             localStorage.setItem('user', JSON.stringify(adminUser));
             addToast("Welcome Master Admin", "success");
             setLocation('/dashboard/admin');
             return;
        }

        if (isGenericDemoPass || isSpecificDemoPass || data.email.includes('@giftify.com')) {
             try {
                // Check if this user exists in Firestore directly
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('../firebase');
                
                const q = query(collection(db, "users"), where("email", "==", data.email));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const userData = snapshot.docs[0].data();
                    const uid = snapshot.docs[0].id;
                    
                    // Verify password logic (Simplistic for demo)
                    // If it's in our specific list, check match. 
                    // If it's generic 'password123', allow it.
                    // If it's a creators email (contains name) allow 'creator123' or 'password123'
                    
                    let isValid = false;
                    if (isGenericDemoPass) isValid = true;
                    if (isSpecificDemoPass) isValid = true;
                    if (data.password === 'creator123' && userData.role === 'creator') isValid = true;
                    if (data.password === 'fan123' && userData.role === 'fan') isValid = true;
                    if (data.password === 'logistics123' && userData.role === 'admin') isValid = true;

                    if (isValid) {
                        localStorage.setItem('user', JSON.stringify({ uid, ...userData }));
                        addToast(`Welcome Demo User: ${userData.firstName}`, "success");
                        if (userData.role === 'creator') setLocation('/dashboard/creator');
                        else if (userData.role === 'admin') setLocation('/dashboard/logistics');
                        else setLocation('/dashboard/fan');
                        return;
                    }
                }
             } catch(e) {
                 console.warn("Demo login check failed", e);
             }
        }
        // ---------------------------------------------------------

        try {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const { doc, getDoc } = await import('firebase/firestore');
            const { auth, db } = await import('../firebase');

            // 1. Sign In
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // 2. Fetch User Role from Firestore
            const docRef = doc(db, "users", user.uid);
            
            // Much more generous timeout (15s) to support slow mobile networks
            const fetchPromise = getDoc(docRef);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database unavailable")), 15000)
            );

            try {
                const docSnap = await Promise.race([fetchPromise, timeoutPromise]);
                
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    localStorage.setItem('user', JSON.stringify({ uid: user.uid, ...userData }));
                    addToast(`Welcome back, ${userData.firstName}!`, 'success');
                    
                    if (userData.role === 'creator') {
                        setLocation('/dashboard/creator');
                    } else if (userData.role === 'admin' || user.email === 'logistics@giftify.com') {
                        setLocation('/dashboard/logistics');
                    } else {
                        setLocation('/dashboard/fan');
                    }
                    return;
                }
            } catch (timeoutErr) {
                // If auth worked but DB timed out, fallback to limited mode
                console.warn("Firestore slow/unavailable, using fallback");
                
                // Fallback Logic: Check localStorage for temporary role from registration
                const tempRole = localStorage.getItem('temp_register_role');
                // Or use detected role from the email check earlier
                const fallbackRole = tempRole || detectedRole || 'fan';
                
                const limitedUser = {
                    uid: user.uid,
                    email: user.email,
                    firstName: 'User',
                    lastName: '',
                    role: fallbackRole,
                    isLimitedMode: true
                };
                
                localStorage.setItem('user', JSON.stringify(limitedUser));
                
                // Clear temp role
                localStorage.removeItem('temp_register_role');

                // Less alarming message
                addToast("Taking longer than usual. Loading offline mode...", 'info');
                
                if (fallbackRole === 'creator') setLocation('/dashboard/creator');
                else if (fallbackRole === 'admin' || user.email === 'logistics@giftify.com') setLocation('/dashboard/logistics');
                else setLocation('/dashboard/fan');
                
                return;
            }

            throw new Error("Profile not found in database.");

        } catch (err) {
            console.error("Login Error Details:", err);
            
            let message = `Login failed: ${err.message}`;
            
            if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("timed out"))) {
                message = "Network Error: Please disable McAfee WebAdvisor or other Antivirus extensions for this site.";
            } else if (err.message && (err.message.includes("BLOCKED") || err.message.includes("Failed to load resource"))) {
                message = "AdBlocker detected! Please disable extensions for localhost.";
            } else if (err.code === 'auth/invalid-credential') {
                message = "Invalid email or password.";
            } else if (err.code === 'unavailable') {
                message = "Service unavailable. Check your internet connection.";
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
                                        color: detectedRole === 'creator' ? '#16A34A' : (detectedRole === 'admin' ? '#7c3aed' : '#2563EB'),
                                        fontWeight: 600,
                                        background: detectedRole === 'creator' ? '#DCFCE7' : (detectedRole === 'admin' ? '#f3e8ff' : '#EFF6FF'),
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        width: 'fit-content'
                                    }}
                                >
                                    <span>{detectedRole === 'creator' ? '🦁' : (detectedRole === 'admin' ? '🚚' : '🦄')}</span>
                                    {detectedRole === 'creator' ? 'Creator Account Detected' : (detectedRole === 'admin' ? 'Logistics Team Detected' : 'Fan Account Detected')}
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
