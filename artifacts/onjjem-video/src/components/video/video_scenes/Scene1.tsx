import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 2, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="text-8xl font-display font-bold tracking-tight leading-tight relative z-10 uppercase">
        <motion.span
          className="block mb-2"
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 40, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          Life's moments
        </motion.span>
      </h1>
      
      <div className="flex gap-4 mt-6 text-2xl font-light tracking-widest text-primary font-display uppercase">
        <motion.span initial={{ opacity: 0, x: -20 }} animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ duration: 0.5, delay: 0 }}>Captured.</motion.span>
        <motion.span initial={{ opacity: 0, x: -20 }} animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ duration: 0.5, delay: 0.1 }}>Fuelled.</motion.span>
        <motion.span initial={{ opacity: 0, x: -20 }} animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ duration: 0.5, delay: 0.2 }}>Moved.</motion.span>
        <motion.span initial={{ opacity: 0, x: -20 }} animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ duration: 0.5, delay: 0.3 }}>Loved.</motion.span>
      </div>
    </motion.div>
  );
}
