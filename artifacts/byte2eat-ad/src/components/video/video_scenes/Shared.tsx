import { motion } from "framer-motion";

export function AnimatedText({ text, cta, delayOffset = 0, emphasisWords = [] }: { text: string, cta: string, delayOffset?: number, emphasisWords?: string[] }) {
  const words = text.split(" ");
  
  return (
    <div className="w-full text-center z-10 px-8 flex flex-col items-center justify-center">
      <div className="text-[9vw] sm:text-[6vh] font-bold text-white leading-[1.15] drop-shadow-2xl">
        {words.map((word, i) => {
          const cleanWord = word.replace(/[.,:;!?]/g, '');
          const isEmphasis = emphasisWords.includes(cleanWord);
          
          return (
            <motion.span
              key={i}
              className={`inline-block mr-[0.25em] mb-[0.1em] ${isEmphasis ? 'text-[#4ADE80]' : 'text-white'}`}
              initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(12px)", y: -15 }}
              transition={{ 
                duration: 0.8, 
                delay: delayOffset + i * 0.18,
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              {word}
            </motion.span>
          );
        })}
      </div>
      
      <motion.div 
        className="mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: delayOffset + words.length * 0.18 + 0.2 }}
      >
        <motion.div
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#16A34A] to-[#4ADE80] text-white text-[7vw] sm:text-[4vh] font-black uppercase tracking-wide drop-shadow-xl shadow-[0_0_30px_rgba(74,222,128,0.5)]"
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)", y: 20 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", y: -20 }}
          transition={{ 
            duration: 0.8, 
            delay: delayOffset + words.length * 0.18 + 0.3, 
            type: "spring", 
            stiffness: 200,
            damping: 15
          }}
        >
          {cta}
        </motion.div>
      </motion.div>
    </div>
  );
}