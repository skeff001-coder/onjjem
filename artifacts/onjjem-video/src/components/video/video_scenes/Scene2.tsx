import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
const framedCanvas = `${import.meta.env.BASE_URL}products/framed-canvas-white-wall.png`;

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center px-24"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 z-10 pr-12">
        <motion.h2 
          className="text-6xl font-display text-primary leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        >
          Turn digital photos into physical keepsakes.
        </motion.h2>
      </div>

      <div className="w-1/2 h-full flex items-center justify-center relative">
        <motion.div 
          className="absolute inset-0 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <motion.img 
          src={framedCanvas} 
          className="w-[80%] object-contain relative z-10 drop-shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: 20 }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
