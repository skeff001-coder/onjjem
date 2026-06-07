import { ComponentType, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import bgImage from '@assets/AI_Kitchen_(2)_1780098934593.png';

export const SCENE_DURATIONS = {
  s1: 4500,
  s2: 5000,
  s3: 5000,
  s4: 5000,
  s5: 4500,
};

const SCENE_COMPONENTS: Record<string, ComponentType> = {
  s1: Scene1,
  s2: Scene2,
  s3: Scene3,
  s4: Scene4,
  s5: Scene5,
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <>
      <div className="relative w-full h-[100dvh] max-w-full sm:max-w-none sm:w-[56.25dvh] aspect-[9/16] mx-auto overflow-hidden bg-zinc-950 flex items-center justify-center font-display">
        {/* Persistent background layer */}
        <div className="absolute inset-0 z-0">
          <motion.img
            src={bgImage}
            className="w-full h-full object-cover object-center scale-110 origin-center"
            animate={{
              scale: [1.1, 1.25, 1.1],
              rotate: [0, 1, -1, 0],
              filter: ["brightness(0.9)", "brightness(1.1)", "brightness(0.9)"]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            alt="AI Kitchen Background"
          />
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-zinc-900/60 to-black/80" />

          <motion.div
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[100%] rounded-full bg-[#FF7A00] blur-[150px] opacity-20 mix-blend-screen pointer-events-none"
            animate={{
              opacity: [0.15, 0.3, 0.15],
              x: ["0%", "10%", "0%"]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-1/4 -right-1/4 w-[120%] h-[80%] rounded-full bg-[#FFA03A] blur-[120px] opacity-10 mix-blend-screen pointer-events-none"
            animate={{
              opacity: [0.1, 0.25, 0.1],
              y: ["0%", "-10%", "0%"]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 rounded-full bg-white/30 blur-[1px]"
              initial={{
                x: `${(i * 7.3) % 100}vw`,
                y: `${(i * 11.7) % 100}vh`,
                scale: 0.5 + (i % 3) * 0.25
              }}
              animate={{
                y: [`${(i * 11.7) % 100}vh`, `${-10 - (i % 2) * 20}vh`],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 10 + (i % 5) * 3,
                repeat: Infinity,
                ease: "linear",
                delay: (i % 10)
              }}
            />
          ))}
        </div>

        {/* Scene content */}
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </>
  );
}
