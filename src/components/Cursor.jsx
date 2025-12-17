import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const Cursor = () => {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      
      // Throttle hover check or do it simpler
      const target = e.target
      const isClickable = target.tagName === 'BUTTON' || 
                          target.tagName === 'A' || 
                          target.closest('.interactive')
      if (!!isClickable !== isHovering) {
          setIsHovering(!!isClickable)
      }
    }

    window.addEventListener('mousemove', moveCursor)
    return () => {
      window.removeEventListener('mousemove', moveCursor)
    }
  }, [cursorX, cursorY, isHovering])

  return (
    <>
      <motion.div
        className="cursor-follower"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: isHovering ? -32 : -16,
          translateY: isHovering ? -32 : -16,
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          borderRadius: '50%',
          backdropFilter: 'blur(2px)'
        }}
        animate={{
          height: isHovering ? 64 : 32,
          width: isHovering ? 64 : 32,
          backgroundColor: isHovering ? "rgba(14, 165, 233, 0.1)" : "rgba(14, 165, 233, 0.3)",
          border: isHovering ? "1px solid rgba(14, 165, 233, 0.5)" : "none",
          mixBlendMode: isHovering ? "difference" : "normal"
        }}
        transition={{
           type: "spring",
           stiffness: 500,
           damping: 28
        }}
      />
    </>
  )
}

export default Cursor
