import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
const playingCards = `${import.meta.env.BASE_URL}products/playing-cards.webp`;

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-24 bg-primary text-bg-light"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-[45%] h-full flex items-center justify-center relative">
        <motion.img 
          src={playingCards} 
          className="w-full object-contain drop-shadow-2xl rounded-xl"
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, rotate: -5 } : { opacity: 0, scale: 0.5, rotate: -20 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.5 }}
        />
      </div>

      <div className="w-[50%] z-10 pl-12 flex flex-col justify-center">
        <motion.div
          className="bg-bg-light text-primary font-bold px-4 py-1 inline-block w-max rounded-full text-sm mb-6 uppercase tracking-widest"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          Special Bonus
        </motion.div>

        <motion.h2 
          className="text-6xl font-display leading-tight"
          style={{ color: 'var(--color-bg-light)' }}
          initial={{ opacity: 0, x: 30 }}
          animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        >
          Free playing cards on orders over £50.
        </motion.h2>
      </div>
    </motion.div>
  );
}
