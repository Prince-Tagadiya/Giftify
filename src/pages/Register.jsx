import React from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'wouter'
import '../index.css'
import '../refined_theme.css'

const Register = () => {
    const [, setLocation] = useLocation();

    const handleRegister = (e) => {
        e.preventDefault();
        // Simulate registration
        setLocation('/login');
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
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Join Giftify</h2>
                        <p style={{ color: 'var(--c-text-muted)' }}>Start sending or receiving gifts securely</p>
                    </div>

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={handleRegister}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>First Name</label>
                                <input type="text" placeholder="Jane" className="newsletter-input" required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Last Name</label>
                                <input type="text" placeholder="Doe" className="newsletter-input" required />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Email</label>
                            <input type="email" placeholder="you@example.com" className="newsletter-input" required />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                            <input type="password" placeholder="••••••••" className="newsletter-input" required />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>I am a...</label>
                            <select className="newsletter-input" style={{ width: '100%' }}>
                                <option value="fan">Fan (I want to send gifts)</option>
                                <option value="creator">Creator (I want to receive gifts)</option>
                            </select>
                        </div>

                        <button
                            className="btn-primary interactive"
                            style={{
                                background: 'var(--grad-primary)',
                                border: 'none',
                                padding: '12px',
                                marginTop: '0.5rem',
                                width: '100%',
                                fontWeight: 600
                            }}
                        >
                            Create Account
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
                        Already have an account? <Link href="/login"><a href="#" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign In</a></Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Register
