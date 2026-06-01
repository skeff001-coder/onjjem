import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  open: 3500,
  build1: 4500,
  build2: 4000,
  build3: 4000,
  close: 4000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  build1: Scene2,
  build2: Scene3,
  build3: Scene4,
  close: Scene5,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  // Audio sync
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-light)', color: 'var(--color-text-primary)' }}
    >
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute w-[80vw] h-[80vw] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-bg-muted), transparent)' }}
          animate={{
            x: ['-20%', '10%', '-10%'],
            y: ['-10%', '20%', '0%'],
            scale: [1, 1.1, 0.9],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full opacity-30 blur-3xl right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, var(--color-secondary), transparent)' }}
          animate={{
            x: ['10%', '-20%', '5%'],
            y: ['10%', '-30%', '-10%'],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Persistent Midground Accent */}
      <motion.div
        className="absolute w-[1px] z-0"
        style={{ backgroundColor: 'var(--color-primary)' }}
        animate={{
          left: ['10%', '90%', '50%', '20%', '80%'][sceneIndex] || '50%',
          top: '0%',
          height: '100%',
          opacity: [0, 0.3, 0.1, 0.4, 0][sceneIndex] || 0,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Scene Content */}
      <div className="relative w-full h-full z-10">
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
