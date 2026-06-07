import { motion } from "framer-motion";
import { AnimatedText } from "./Shared";

export function Scene5() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 bg-[#FF7A00]/20 mix-blend-overlay" />
      <AnimatedText 
        text="Download Byte 2 Eat free now on iOS and Android."
        cta="Get Byte 2 Eat"
        delayOffset={0.2}
        emphasisWords={["Download", "free", "now"]}
      />
    </motion.div>
  );
}