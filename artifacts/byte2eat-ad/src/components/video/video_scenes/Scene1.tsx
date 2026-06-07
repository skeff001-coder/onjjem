import { motion } from "framer-motion";
import { AnimatedText } from "./Shared";

export function Scene1() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      <AnimatedText 
        text="Once you know how to use AI in your kitchen?"
        cta="Get Byte 2 Eat"
        delayOffset={0.2}
        emphasisWords={["AI", "kitchen"]}
      />
    </motion.div>
  );
}