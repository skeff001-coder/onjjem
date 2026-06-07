import { motion } from "framer-motion";
import { AnimatedText } from "./Shared";

export function Scene4() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      <AnimatedText 
        text="Save money, eat healthier, reduce food waste every single day."
        cta="Get Byte 2 Eat"
        delayOffset={0.2}
        emphasisWords={["Save", "money", "healthier", "waste"]}
      />
    </motion.div>
  );
}