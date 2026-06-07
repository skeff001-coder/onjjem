import { motion } from "framer-motion";
import { AnimatedText } from "./Shared";

export function Scene2() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center w-full h-full"
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <AnimatedText 
        text="Point. Snap. Cook. Scan your fridge, get instant personalized recipes."
        cta="Get Byte 2 Eat"
        delayOffset={0.2}
        emphasisWords={["Point", "Snap", "Cook"]}
      />
    </motion.div>
  );
}