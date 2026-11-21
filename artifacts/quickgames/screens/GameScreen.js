import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  PanResponder,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// ── Layout ──
const TOP_BAR = 100;          // score / lives bar
const GAME_TOP = TOP_BAR;
const GAME_H = H - TOP_BAR - 40;  // playable height
const PLAYER_W = 44;
const PLAYER_H = 44;
const PLAYER_X = 60;         // fixed horizontal position

// ── Difficulty curve ──
const BASE_SPEED = 3;                  // px per frame at start
const SPEED_INCREASE_INTERVAL = 5000;  // ms between speed bumps
const SPEED_INCREASE_FACTOR = 1.06;    // ~6% faster each bump
const MAX_SPEED_MULTIPLIER = 3;        // cap near 3×

// ── Obstacles ──
const MIN_OBS_W = 40;
const MAX_OBS_W = 90;
const MIN_OBS_H = 50;
const MAX_OBS_H = 160;
const MIN_GAP_MS = 700;    // tightest spawn interval at difficulty cap
const INITIAL_GAP_MS = 1800; // spawn interval at the start

// ── Game rules ──
const TOTAL_LIVES = 3;
const INVINCIBILITY_MS = 2000; // 2s after each hit
const MOVING_OBS_EVERY = 3;   // every 3rd obstacle moves

// ── Placeholder colours ──
const COLORS = {
  bg: '#0F1419',
  player: '#00D9FF',
  playerHit: '#FF4444',
  obstacle: '#FF6B35',
  obstacleDark: '#CC5522',
  movingObstacle: '#FFD700',
  movingWarning: '#FF0000',
  lives: '#FF6B35',
  livesLost: '#333333',
  score: '#FFFFFF',
  text: '#FFFFFF',
  dimText: '#888888',
};

export default function GameScreen({ route, navigation }) {
  const { character, theme, gameName } = route?.params || {
    character: 'rocket',
    theme: 'space',
    gameName: 'Test Game',
  };

  // ── Render state (only these trigger re-renders) ──
  const [playerY, setPlayerY] = useState(GAME_TOP + GAME_H / 2 - PLAYER_H / 2);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [invincible, setInvincible] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // ── Refs for the game loop (no re-render overhead) ──
  const playerYRef = useRef(GAME_TOP + GAME_H / 2 - PLAYER_H / 2);
  const targetYRef = useRef(GAME_TOP + GAME_H / 2 - PLAYER_H / 2);
  const obstaclesRef = useRef([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(TOTAL_LIVES);
  const speedRef = useRef(1);
  const gameActiveRef = useRef(false);
  const invincibleRef = useRef(false);
  const invincibleUntilRef = useRef(0);
  const frameIdRef = useRef(null);
  const lastObstacleTimeRef = useRef(0);
  const obstacleCountRef = useRef(0);
  const gameStartTimeRef = useRef(0);
  const lastSpeedBumpRef = useRef(0);
  const lastTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  // ── Touch: player follows finger vertically ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!gameActiveRef.current && !gameOver) {
          startGame();
          return;
        }
        const touchY = evt.nativeEvent.pageY;
        targetYRef.current = Math.max(
          GAME_TOP,
          Math.min(touchY - PLAYER_H / 2, GAME_TOP + GAME_H - PLAYER_H)
        );
      },
      onPanResponderMove: (evt) => {
        const touchY = evt.nativeEvent.pageY;
        targetYRef.current = Math.max(
          GAME_TOP,
          Math.min(touchY - PLAYER_H / 2, GAME_TOP + GAME_H - PLAYER_H)
        );
      },
    })
  ).current;

  // ── Start / restart ──
  const startGame = useCallback(() => {
    const now = performance.now();
    playerYRef.current = GAME_TOP + GAME_H / 2 - PLAYER_H / 2;
    targetYRef.current = GAME_TOP + GAME_H / 2 - PLAYER_H / 2;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = TOTAL_LIVES;
    speedRef.current = 1;
    invincibleRef.current = false;
    invincibleUntilRef.current = 0;
    lastObstacleTimeRef.current = now;
    obstacleCountRef.current = 0;
    gameStartTimeRef.current = now;
    lastSpeedBumpRef.current = now;
    lastTimeRef.current = now;
    elapsedRef.current = 0;
    gameActiveRef.current = true;

    setPlayerY(playerYRef.current);
    setObstacles([]);
    setScore(0);
    setLives(TOTAL_LIVES);
    setGameOver(false);
    setGameStarted(true);
    setInvincible(false);
    setSpeedMultiplier(1);

    frameIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ── Main game loop ──
  const gameLoop = useCallback((timestamp) => {
    if (!gameActiveRef.current) return;

    const dt = Math.min(timestamp - lastTimeRef.current, 33); // cap at ~30fps worth of delta
    lastTimeRef.current = timestamp;
    elapsedRef.current += dt;
    const elapsed = elapsedRef.current;

    // ── Speed ramp: +6% every 5 seconds, capped at 3× ──
    if (timestamp - lastSpeedBumpRef.current >= SPEED_INCREASE_INTERVAL) {
      speedRef.current = Math.min(
        speedRef.current * SPEED_INCREASE_FACTOR,
        MAX_SPEED_MULTIPLIER
      );
      lastSpeedBumpRef.current = timestamp;
    }

    const speed = BASE_SPEED * speedRef.current;

    // ── Move player toward finger (smooth follow) ──
    const diff = targetYRef.current - playerYRef.current;
    playerYRef.current += diff * 0.18; // smooth lerp

    // ── Invincibility timeout ──
    if (invincibleRef.current && timestamp >= invincibleUntilRef.current) {
      invincibleRef.current = false;
    }

    // ── Spawn obstacles ──
    const elapsedS = elapsed / 1000;
    // Spawn gap shrinks over time: starts at INITIAL_GAP_MS, floors at MIN_GAP_MS
    const progress = Math.min(elapsedS / 60, 1); // 0→1 over 60 seconds
    const spawnGap = INITIAL_GAP_MS - (INITIAL_GAP_MS - MIN_GAP_MS) * progress;

    if (timestamp - lastObstacleTimeRef.current >= spawnGap) {
      lastObstacleTimeRef.current = timestamp;
      obstacleCountRef.current += 1;
      const count = obstacleCountRef.current;

      // Size ramp: obstacles get bigger over time
      const sizeProgress = Math.min(elapsedS / 45, 1); // full size by 45s
      const obsW = MIN_OBS_W + (MAX_OBS_W - MIN_OBS_W) * sizeProgress;
      const obsH = MIN_OBS_H + (MAX_OBS_H - MIN_OBS_H) * sizeProgress * 0.7;

      // Position: random Y within playable area
      const obsY =
        GAME_TOP + Math.random() * (GAME_H - obsH);

      // Every 3rd-4th obstacle moves
      const isMoving = count % MOVING_OBS_EVERY === 0 && elapsedS > 15;
      const moveAmplitude = isMoving ? 40 + sizeProgress * 40 : 0;
      const moveSpeed = isMoving ? 0.002 + sizeProgress * 0.001 : 0;

      obstaclesRef.current.push({
        id: count,
        x: W + 20,
        y: obsY,
        w: obsW,
        h: obsH,
        scored: false,
        isMoving,
        moveAmplitude,
        moveSpeed,
        baseY: obsY,
        spawnTime: timestamp,
        // Warning flash: starts flashing 400ms before it enters screen
        warningFlash: isMoving,
      });
    }

    // ── Update obstacles ──
    const obs = obstaclesRef.current;
    let newScore = scoreRef.current;

    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i];

      // Move left
      o.x -= speed;

      // Moving obstacles oscillate vertically
      if (o.isMoving) {
        const t = timestamp - o.spawnTime;
        o.y = o.baseY + Math.sin(t * o.moveSpeed) * o.moveAmplitude;
        // Clamp to game area
        o.y = Math.max(GAME_TOP, Math.min(o.y, GAME_TOP + GAME_H - o.h));
      }

      // Remove if off screen
      if (o.x + o.w < -20) {
        obs.splice(i, 1);
        continue;
      }

      // Score: passed the player
      if (!o.scored && o.x + o.w < PLAYER_X) {
        o.scored = true;
        newScore += 1;
      }

      // Collision
      if (!invincibleRef.current) {
        const px = PLAYER_X;
        const py = playerYRef.current;
        if (
          px + PLAYER_W > o.x &&
          px < o.x + o.w &&
          py + PLAYER_H > o.y &&
          py < o.y + o.h
        ) {
          // Hit!
          livesRef.current -= 1;
          if (livesRef.current <= 0) {
            // Game over
            gameActiveRef.current = false;
            scoreRef.current = newScore;
            setScore(newScore);
            setLives(0);
            setPlayerY(playerYRef.current);
            setObstacles([...obs]);
            setGameOver(true);
            setSpeedMultiplier(speedRef.current);
            return; // stop the loop
          }
          // Still alive: grant invincibility
          invincibleRef.current = true;
          invincibleUntilRef.current = timestamp + INVINCIBILITY_MS;
        }
      }
    }

    scoreRef.current = newScore;

    // ── Push to React state for rendering ──
    setPlayerY(playerYRef.current);
    setObstacles([...obs]);
    setScore(newScore);
    setLives(livesRef.current);
    setInvincible(invincibleRef.current);
    setSpeedMultiplier(speedRef.current);

    frameIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      gameActiveRef.current = false;
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  // ── Render ──
  const renderLives = () => {
    const hearts = [];
    for (let i = 0; i < TOTAL_LIVES; i++) {
      hearts.push(
        <Text
          key={i}
          style={[
            styles.heart,
            { color: i < lives ? COLORS.lives : COLORS.livesLost },
          ]}
        >
          ♥
        </Text>
      );
    }
    return hearts;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.livesRow}>{renderLives()}</View>
        <Text style={styles.scoreText}>{score}</Text>
        <TouchableOpacity
          onPress={() => {
            gameActiveRef.current = false;
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            navigation.goBack();
          }}
        >
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Speed indicator ── */}
      <View style={styles.speedBar}>
        <Text style={styles.speedText}>
          {speedMultiplier.toFixed(1)}×
        </Text>
      </View>

      {/* ── Game area ── */}
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* Player */}
        <View
          style={[
            styles.player,
            {
              top: playerY,
              left: PLAYER_X,
              backgroundColor: invincible
                ? (Math.floor(Date.now() / 100) % 2 === 0
                  ? COLORS.player
                  : 'transparent')
                : COLORS.player,
              borderColor: invincible ? COLORS.playerHit : COLORS.player,
            },
          ]}
        >
          <Text style={styles.playerEmoji}>🚀</Text>
        </View>

        {/* Obstacles */}
        {obstacles.map((o) => (
          <View
            key={o.id}
            style={[
              styles.obstacle,
              {
                left: o.x,
                top: o.y,
                width: o.w,
                height: o.h,
                backgroundColor: o.isMoving
                  ? (o.x > W - 60
                    ? (Math.floor(Date.now() / 150) % 2 === 0
                      ? COLORS.movingWarning
                      : COLORS.movingObstacle)
                    : COLORS.movingObstacle)
                  : COLORS.obstacle,
                borderRadius: o.isMoving ? 8 : 4,
              },
            ]}
          />
        ))}

        {/* Tap to start */}
        {!gameStarted && !gameOver && (
          <View style={styles.startOverlay}>
            <Text style={styles.startTitle}>{gameName || 'Quick Gamer'}</Text>
            <Text style={styles.startSub}>Touch and drag to move</Text>
            <Text style={styles.startSub}>Dodge the obstacles!</Text>
            <Text style={styles.tapText}>TAP TO START</Text>
          </View>
        )}
      </View>

      {/* ── Game Over overlay ── */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverTitle}>GAME OVER</Text>
          <Text style={styles.gameOverName}>{gameName}</Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.finalScore}>{score}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{speedMultiplier.toFixed(1)}×</Text>
              <Text style={styles.statLabel}>Top Speed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Dodged</Text>
            </View>
          </View>

          <View style={styles.gameOverButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={startGame}>
              <Text style={styles.primaryBtnText}>PLAY AGAIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() =>
                navigation.navigate('Share', { score, gameName })
              }
            >
              <Text style={styles.secondaryBtnText}>Share Score</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    height: TOP_BAR,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  heart: {
    fontSize: 28,
  },
  scoreText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.score,
    fontFamily: 'Courier',
  },
  closeBtn: {
    fontSize: 28,
    color: COLORS.dimText,
  },
  speedBar: {
    position: 'absolute',
    top: TOP_BAR + 4,
    right: 20,
    zIndex: 10,
  },
  speedText: {
    fontSize: 14,
    color: COLORS.dimText,
    fontFamily: 'Courier',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  player: {
    position: 'absolute',
    width: PLAYER_W,
    height: PLAYER_H,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  playerEmoji: {
    fontSize: 24,
  },
  obstacle: {
    position: 'absolute',
    zIndex: 10,
  },
  // ── Start overlay ──
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 25, 0.7)',
  },
  startTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  startSub: {
    fontSize: 16,
    color: COLORS.dimText,
    marginBottom: 4,
  },
  tapText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.lives,
    marginTop: 32,
  },
  // ── Game over ──
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 4,
  },
  gameOverName: {
    fontSize: 14,
    color: COLORS.dimText,
    marginTop: 8,
  },
  scoreBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.dimText,
    letterSpacing: 2,
  },
  finalScore: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#00D9FF',
    fontFamily: 'Courier',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 48,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Courier',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.dimText,
    marginTop: 4,
  },
  gameOverButtons: {
    width: '100%',
    marginTop: 48,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.lives,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
  secondaryBtn: {
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  backText: {
    fontSize: 16,
    color: COLORS.dimText,
    textAlign: 'center',
    marginTop: 8,
  },
});
