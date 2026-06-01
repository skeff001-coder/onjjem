import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
const photoMugs = `${import.meta.env.BASE_URL}products/photo-mugs.jpg`;
const jigsawPuzzles = `${import.meta.env.BASE_URL}products/jigsaw-puzzles.webp`;

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2 
        className="text-5xl font-display text-primary text-center mb-16 relative z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.8 }}
      >
        Daily reminders of what matters most.
      </motion.h2>

      <div className="flex gap-12 relative z-10 w-full px-24 justify-center items-center">
        <motion.div 
          className="w-[40%] rounded-2xl overflow-hidden shadow-2xl relative"
          initial={{ opacity: 0, x: -50, rotate: -5 }}
          animate={phase >= 2 ? { opacity: 1, x: 0, rotate: -2 } : { opacity: 0, x: -50, rotate: -5 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
        >
          <img src={photoMugs} className="w-full h-auto object-cover" />
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        </motion.div>

        <motion.div 
          className="w-[40%] rounded-2xl overflow-hidden shadow-2xl relative"
          initial={{ opacity: 0, x: 50, rotate: 5 }}
          animate={phase >= 3 ? { opacity: 1, x: 0, rotate: 2 } : { opacity: 0, x: 50, rotate: 5 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
        >
          <img src={jigsawPuzzles} className="w-full h-auto object-cover" />
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        </motion.div>
      </div>
    </motion.div>
  );
}
