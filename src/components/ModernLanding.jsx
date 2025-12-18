import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'wouter'
import Cursor from './Cursor'
import Flow3D from './Flow3D'
import FlowDiagram from './FlowDiagram'
import Magnetic from './Magnetic'

const AnimationSection = ({ children, className }) => {
    return (
        <motion.div
            className={`section-container ${className}`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}

const ModernLanding = () => {
    return (
        <div className="modern-app" style={{ overflow: 'hidden' }}>
            <Cursor />
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>

            {/* Navigation */}
            <nav className="glass-nav interactive" style={{ background: 'rgba(255,255,255,0.85)' }}>
                <Magnetic strength={0.8}>
                    <div className="logo interactive" style={{ cursor: 'pointer', padding: '10px' }}>Giftify.</div>
                </Magnetic>
                <div className="nav-links">
                    <Magnetic strength={0.4}><button className="nav-item interactive">For Creators</button></Magnetic>
                    <Magnetic strength={0.4}><button className="nav-item interactive">For Fans</button></Magnetic>
                    <Magnetic strength={0.4}>
                        <Link href="/login">
                            <button className="nav-item interactive">Login</button>
                        </Link>
                    </Magnetic>
                    <Magnetic strength={0.6}><button className="btn-small interactive">Get Started</button></Magnetic>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="pill-badge" style={{ background: '#EEF2FF', color: '#6366F1' }}>Beta Access Live</span>
                    </motion.div>

                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Fan Gifts, <br /> <span className="text-gradient">No Address Required.</span>
                    </motion.h1>

                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        The safest way for creators to receive gifts. We handle the privacy layer so you can focus on the unboxing reaction.
                    </motion.p>

                    <motion.div
                        className="hero-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <button className="btn-primary interactive" style={{ background: 'var(--grad-primary)', border: 'none' }}>Start Gifting</button>
                        <button className="btn-secondary interactive">Watch Demo</button>
                    </motion.div>
                </div>

                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    {/* Enhanced 3D Card */}
                    <div className="card-3d-mockup" style={{ border: 'none', background: 'white' }}>
                        <div className="mockup-content">
                            <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>🎁</div>
                            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Gift Received!</div>
                            <div style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>From: Anonymous Fan</div>
                            <div style={{
                                background: '#ECFDF5', color: '#10B981', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600
                            }}>
                                Verified Safe & Scan Complete
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Premium Problem Cards */}
            <section className="problem-section" style={{ padding: '6rem 2rem' }}>
                <AnimationSection className="text-center">
                    <h2 className="section-title">Privacy is the New Luxury</h2>
                    <p className="section-desc">Traditional PO boxes are outdated. Upgrade to a digital-first solution.</p>
                </AnimationSection>

                <div className="grid-3">
                    <AnimationSection>
                        <div className="premium-card interactive">
                            <div className="card-icon-wrapper bg-rose-soft">🛡️</div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Zero Address Leaks</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Your home address is encrypted and never revealed to senders or logistics partners directly.</p>
                        </div>
                    </AnimationSection>

                    <AnimationSection>
                        <div className="premium-card interactive">
                            <div className="card-icon-wrapper bg-blue-soft">⚡</div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Instant Notifications</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Get notified via the app the moment a fan purchases a gift, before it even ships.</p>
                        </div>
                    </AnimationSection>

                    <AnimationSection>
                        <div className="premium-card interactive">
                            <div className="card-icon-wrapper bg-violet-soft">✨</div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Curated Wishlists</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Build a wishlist from any store. Fans buy directly through Giftify ensuring safety.</p>
                        </div>
                    </AnimationSection>
                </div>
            </section>

            {/* Dashboard Section - The "Cheap" Fix */}
            <section className="dashboard-section" style={{ background: 'transparent', paddingBottom: '8rem' }}>
                <AnimationSection className="text-center" style={{ marginBottom: '4rem' }}>
                    <h2 className="section-title">One Beautiful Command Center</h2>
                    <p className="section-desc">Manage everything from gifts to thank-you notes.</p>
                </AnimationSection>

                <AnimationSection>
                    <div className="dashboard-mockup-container">
                        <div className="glass-dashboard">
                            {/* Fake Browser UI */}
                            <div className="dash-header">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }}></div>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }}></div>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }}></div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94A3B8', background: '#F1F5F9', padding: '4px 12px', borderRadius: '6px' }}>giftify.com/dashboard</div>
                                <div></div>
                            </div>

                            <div className="dash-sidebar">
                                <div className="sk-line sk-w-3-4" style={{ height: 20, marginBottom: 30, background: '#CBD5E1' }}></div>
                                <div className="sk-line sk-w-full" style={{ marginBottom: 20 }}></div>
                                <div className="sk-line sk-w-full" style={{ marginBottom: 20 }}></div>
                                <div className="sk-line sk-w-full" style={{ marginBottom: 20 }}></div>
                            </div>

                            <div className="dash-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Recent Gifts</h3>
                                    <button className="btn-small" style={{ background: '#3B82F6' }}>Export CSV</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="sk-card">
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Sony A7III Camera</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>From: @techfan99</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sk-card">
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: 40, height: 40, background: '#F5F3FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌨️</div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Keychron Q1</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>From: @clickyKey</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem' }}>
                                    <div className="sk-line sk-w-1-2" style={{ marginBottom: '1rem' }}></div>
                                    <div className="sk-card" style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', borderStyle: 'dashed' }}>
                                        Waiting for more gifts...
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements adding depth */}
                        <div className="float-card fc-1">
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981', marginBottom: 4 }}>Balance</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>$1,240.50</div>
                        </div>
                        <div className="float-card fc-2">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 10, height: 10, background: '#22C55E', borderRadius: '50%' }}></div>
                                <div style={{ fontWeight: 600 }}>Shipment Arrived</div>
                            </div>
                        </div>
                    </div>
                </AnimationSection>
            </section>

            {/* How It Works Flow */}
            <section className="flow-section" style={{ paddingBottom: '10rem' }}>
                <AnimationSection className="text-center">
                    <h2 className="section-title">The Secure Gift Flow</h2>
                    <p className="section-desc">See how we protect your information every step of the way.</p>
                </AnimationSection>

                {/* 3D Visualization */}
                <AnimationSection className="interactive" style={{ marginBottom: '4rem' }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto', boxShadow: 'var(--shadow-lg)', borderRadius: '24px' }}>
                        <Flow3D />
                    </div>
                </AnimationSection>

                {/* Block Diagram / Explanation */}
                <AnimationSection className="interactive">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Process Breakdown</h3>
                    </div>
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <FlowDiagram />
                    </div>
                </AnimationSection>
            </section>

            {/* Premium Footer */}
            <footer className="premium-footer">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <h3>Giftify.</h3>
                        <p style={{ color: '#64748B', lineHeight: 1.6 }}>
                            Reimagining the creator economy logistics. <br />
                            Safe. Simple. Secure.
                        </p>
                    </div>

                    <div className="footer-links">
                        <h4>Platform</h4>
                        <ul>
                            <li><a href="#">For Creators</a></li>
                            <li><a href="#">For Fans</a></li>
                            <li><a href="#">Enterprise</a></li>
                            <li><a href="#">Pricing</a></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms</a></li>
                        </ul>
                    </div>

                    <div className="newsletter-box">
                        <h4 style={{ marginBottom: '1rem' }}>Stay Updated</h4>
                        <input type="email" placeholder="Enter your email" className="newsletter-input" />
                        <button className="btn-small" style={{ width: '100%', background: '#0F172A' }}>Subscribe</button>
                    </div>
                </div>

                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem', paddingTop: '2rem', borderTop: '1px solid #E2E8F0' }}>
                    © 2025 Giftify Inc. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

export default ModernLanding
