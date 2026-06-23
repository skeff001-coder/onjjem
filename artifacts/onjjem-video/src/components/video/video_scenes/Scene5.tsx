import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
const dogImg = `${import.meta.env.BASE_URL}images/whatsupdog.jpg`;

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 0.3 } : { opacity: 0 }}
        transition={{ duration: 1 }}
      >
        <img src={dogImg} className="w-full h-full object-cover" alt="What's Up Dog" />
        <div className="absolute inset-0 bg-bg-dark/80 mix-blend-multiply" />
      </motion.div>

      <div className="z-10 text-center flex flex-col items-center">
        <motion.div
          className="text-primary font-bold tracking-widest uppercase mb-4 text-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          Loved.
        </motion.div>

        <motion.h2 
          className="text-8xl font-display font-black leading-tight uppercase mb-2 text-white"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          What's Up Dog
        </motion.h2>
        
        <motion.p
          className="text-3xl text-white/80 font-medium mb-12"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          We let the dogs out.
        </motion.p>

        {/* Outro portfolio lockup */}
        <motion.div
          className="flex items-center gap-6 mt-8 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
        >
          <span className="text-xl font-bold font-display">ONJJEM</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xl font-bold font-display">Byte2Eat</span>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="text-xl font-bold font-display">Effortless Burn</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-xl font-bold font-display">What's Up Dog</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
