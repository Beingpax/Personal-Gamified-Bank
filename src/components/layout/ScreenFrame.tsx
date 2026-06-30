import { motion } from 'motion/react'
import type React from 'react'

export function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
