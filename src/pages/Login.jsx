import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'wouter'
import '../index.css'
import '../refined_theme.css'

const Login = () => {
  return (
    <div className="modern-app" style={{ overflow: 'hidden', minHeight: '100vh', position: 'relative' }}>
        {/* Background Elements */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      
      {/* Navigation - simplified for login */}
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
                transform: 'none', // Override the rotate from dashboard-mockup
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                margin: '1rem' // Add margin for mobile responsiveness
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h2>
                <p style={{ color: 'var(--c-text-muted)' }}>Sign in to manage your gifts</p>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Email</label>
                    <input 
                        type="email" 
                        placeholder="you@example.com" 
                        className="newsletter-input" 
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                    <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="newsletter-input" 
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" /> Remember me
                    </label>
                    <a href="#" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Forgot password?</a>
                </div>

                <button 
                    className="btn-primary interactive" 
                    style={{ 
                        background: 'var(--grad-primary)', 
                        border: 'none', 
                        padding: '12px', 
                        marginTop: '1rem',
                        width: '100%' 
                    }}
                >
                    Sign In
                </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--c-text-muted)', marginTop: '1rem' }}>
                Don't have an account? <a href="#" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign up</a>
            </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
