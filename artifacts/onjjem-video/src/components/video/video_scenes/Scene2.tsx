import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
const framedCanvas = `${import.meta.env.BASE_URL}products/framed-canvas-white-wall.png`;

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center px-24"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 z-10 pr-12 flex flex-col justify-center">
        <motion.div
          className="text-primary font-bold tracking-widest uppercase mb-4 text-xl"
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6 }}
        >
          Captured.
        </motion.div>

        <motion.h2 
          className="text-7xl font-display font-black leading-tight uppercase"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2, delay: 0.1 }}
        >
          ONJJEM
        </motion.h2>
        
        <motion.p
          className="text-2xl text-text-secondary mt-4"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          Preserving memories through physical keepsakes.
        </motion.p>
      </div>

      <div className="w-1/2 h-full flex items-center justify-center relative">
        <motion.img 
          src={framedCanvas} 
          className="w-[90%] object-contain relative z-10 rounded-xl"
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.8, x: 100 }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
