import { motion } from "framer-motion";
import { AnimatedText } from "./Shared";

export function Scene3() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.8 }}
    >
      <AnimatedText 
        text="Choose your goal: Balanced, High Protein, Calorie Deficit, or Vegetarian."
        cta="Get Byte 2 Eat"
        delayOffset={0.2}
        emphasisWords={["Balanced", "Protein", "Deficit", "Vegetarian"]}
      />
    </motion.div>
  );
}