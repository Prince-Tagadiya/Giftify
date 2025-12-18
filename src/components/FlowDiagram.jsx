import React from 'react'
import { motion } from 'framer-motion'

const FlowDiagram = () => {
    return (
        <div className="flow-diagram-container" style={{ position: 'relative', padding: '4rem 2rem', background: '#F8FAFC', borderRadius: '24px', overflow: 'hidden' }}>

            {/* Connecting Line */}
            <svg style={{ position: 'absolute', top: '50%', left: '10%', width: '80%', height: '2px', overflow: 'visible', zIndex: 0 }}>
                <line x1="0" y1="0" x2="100%" y2="0" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="10 10" />

                {/* Moving Packet Animation */}
                <motion.circle
                    cx="0" cy="0" r="6" fill="#3B82F6"
                    animate={{ cx: ["0%", "50%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                    {/* Glow effect */}
                    <circle r="12" fill="rgba(59, 130, 246, 0.3)" />
                </motion.circle>
            </svg>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', position: 'relative', zIndex: 1 }}>

                {/* Node 1: Fan */}
                <motion.div
                    className="flow-block"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="block-icon">📱</div>
                    <h3>Fan</h3>
                    <p>Selects gift from wishlist</p>
                </motion.div>

                {/* Node 2: Hub (Secure) */}
                <motion.div
                    className="flow-block hub"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Floating Tag */}
                    <motion.div
                        className="secure-tag"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <span>🔒 Address Hidden</span>
                        <small>#GH-99</small>
                    </motion.div>

                    <div className="block-icon main-icon">🛡️</div>
                    <h3>Giftify Hub</h3>
                    <p>Address replaced with secure ID</p>
                </motion.div>

                {/* Node 3: Creator */}
                <motion.div
                    className="flow-block"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="block-icon">🏠</div>
                    <h3>Creator</h3>
                    <p>Receives physical breakdown</p>
                </motion.div>

            </div>
        </div>
    )
}

export default FlowDiagram
