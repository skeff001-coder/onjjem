import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
const byte2eatImg = `${import.meta.env.BASE_URL}images/byte2eat.jpg`;

export function Scene3() {
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
      className="absolute inset-0 flex items-center px-24 bg-secondary text-bg-dark"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 h-full flex items-center justify-center relative pl-12">
        <motion.div
          className="w-full h-[60vh] rounded-3xl overflow-hidden shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.5, rotate: -10 }}
          transition={{ duration: 1.2, type: 'spring', bounce: 0.4 }}
        >
          <img src={byte2eatImg} className="w-full h-full object-cover" alt="Byte2Eat" />
        </motion.div>
      </div>

      <div className="w-1/2 z-10 pl-24 flex flex-col justify-center">
        <motion.div
          className="text-bg-dark/70 font-bold tracking-widest uppercase mb-4 text-xl"
          initial={{ opacity: 0, x: 30 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.6 }}
        >
          Fuelled.
        </motion.div>

        <motion.h2 
          className="text-7xl font-display font-black leading-tight uppercase"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2, delay: 0.1 }}
        >
          Byte2Eat
        </motion.h2>
        
        <motion.p
          className="text-2xl text-bg-dark/80 mt-4 font-medium"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          AI recipe scanner for your fridge. Snap ingredients, get instant recipes.
        </motion.p>
      </div>
    </motion.div>
  );
}
