import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
const effortlessImg = `${import.meta.env.BASE_URL}images/effortless.jpg`;

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center px-24 bg-accent text-bg-light"
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 z-10 pr-12 flex flex-col justify-center">
        <motion.div
          className="text-bg-light/80 font-bold tracking-widest uppercase mb-4 text-xl"
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6 }}
        >
          Moved.
        </motion.div>

        <motion.h2 
          className="text-7xl font-display font-black leading-tight uppercase"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2, delay: 0.1 }}
        >
          Effortless Burn
        </motion.h2>
        
        <motion.p
          className="text-2xl text-bg-light/90 mt-4 font-medium"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          Making exercise feel effortless.
        </motion.p>
      </div>

      <div className="w-1/2 h-full flex items-center justify-center relative">
        <motion.div
          className="w-full h-[60vh] rounded-3xl overflow-hidden shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.3 }}
        >
          <img src={effortlessImg} className="w-full h-full object-cover" alt="Effortless Burn" />
        </motion.div>
      </div>
    </motion.div>
  );
}
