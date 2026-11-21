import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  PanResponder,
  Image,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// ── Layout ──
const TOP_BAR = 100;
const GAME_TOP = 0;  // All Y coords are relative to game area view
const GAME_H = H - TOP_BAR - 40;
const PLAYER_W = 44;
const PLAYER_H = 44;
const PLAYER_X = 60;

// ── Difficulty curve (gentler ramp) ──
const BASE_SPEED = 3;
const SPEED_INCREASE_INTERVAL = 7000;
const SPEED_INCREASE_FACTOR = 1.04;
const MAX_SPEED_MULTIPLIER = 3;

// ── Obstacles ──
const MIN_OBS_W = 40;
const MAX_OBS_W = 90;
const MIN_OBS_H = 50;
const MAX_OBS_H = 160;
const MIN_GAP_MS = 700;
const INITIAL_GAP_MS = 1800;

// ── Game rules ──
const TOTAL_LIVES = 3;
const INVINCIBILITY_MS = 2000;
const MOVING_OBS_EVERY = 3;
const CONTINUE_SECONDS = 10;

// ── Power-ups ──
const PICKUP_SIZE = 32;
const PICKUP_SPAWN_MIN_MS = 8000;   // earliest next pickup
const PICKUP_SPAWN_MAX_MS = 15000;  // latest next pickup
const NUKE_INTERVAL_MS = 30000;     // nuke appears every 30 seconds
const NUKE_SIZE = 40;
const ROCKET_SPEED = 12;
const ROCKET_W = 20;
const ROCKET_H = 8;
const ROCKET_BLAST_W = 60;         // explosion width

// ── Colours ──
const COLORS = {
  bg: '#0F1419',
  player: '#00D9FF',
  playerHit: '#FF4444',
  shieldGlow: '#00FF88',
  obstacle: '#FF6B35',
  movingObstacle: '#FFD700',
  movingWarning: '#FF0000',
  lives: '#FF6B35',
  livesLost: '#333333',
  score: '#FFFFFF',
  text: '#FFFFFF',
  dimText: '#888888',
  shieldPickup: '#00FF88',
  rocketPickup: '#FF3366',
  nukePickup: '#FFD700',
  nukeFlash: 'rgba(255, 255, 255, 0.8)',
  rocketProjectile: '#FF3366',
  continueBar: '#00D9FF',
};

// ── Emoji maps for design choices ──
const RIDE_EMOJI = {
  car: '🏎️', spaceship: '🚀', skateboard: '🛹', plane: '✈️',
  boat: '🚤', bike: '🚲', dragon: '🐉', ufo: '🛸',
};
const ENEMY_EMOJI = {
  meteors: '☄️', monsters: '👾', lasers: '⚡', boulders: '🪨',
  ghosts: '👻', fireballs: '🔥', snowballs: '⛄', sharks: '🦈',
};
const ENEMY_LABEL = {
  meteors: 'METEORS', monsters: 'MONSTERS', lasers: 'LASERS', boulders: 'BOULDERS',
  ghosts: 'GHOSTS', fireballs: 'FIREBALLS', snowballs: 'SNOWBALLS', sharks: 'SHARKS',
};
const GOAL_EMOJI = {
  coins: '🪙', stars: '⭐', gems: '💎', hearts: '❤️',
  candy: '🍭', trophies: '🏆',
};
const WORLD_IMAGES = {
  forest: require('../assets/worlds/forest.jpg'),
  space: require('../assets/worlds/space.jpg'),
  ocean: require('../assets/worlds/ocean.jpg'),
  city: require('../assets/worlds/city.jpg'),
  desert: require('../assets/worlds/desert.jpg'),
  arctic: require('../assets/worlds/arctic.png'),
  volcano: require('../assets/worlds/volcano.jpg'),
  candy: require('../assets/worlds/candy.jpg'),
};

export default function GameScreen({ route, navigation }) {
  const { character, theme, gameName, initialShields, initialRockets, continueTokens, onGameEnd, design } =
    route?.params || {};

  // Resolve design emojis
  const rideEmoji = RIDE_EMOJI[design?.ride] || '🚀';
  const enemyEmoji = ENEMY_EMOJI[design?.enemy] || '☄️';
  const enemyLabel = ENEMY_LABEL[design?.enemy] || 'ASTEROIDS';
  const goalEmoji = GOAL_EMOJI[design?.goal] || '⭐';
  const worldImage = WORLD_IMAGES[design?.world] || WORLD_IMAGES.space;

  // ── Background stars (fixed random positions) ──
  const bgStars = useMemo(() => {
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        id: i,
        x: Math.random() * W,
        y: Math.random() * GAME_H * 0.75, // only in top 75% (above the strip)
        size: Math.random() < 0.85 ? Math.random() * 2 + 1 : Math.random() * 4 + 3, // mostly tiny, a few bigger
        opacity: Math.random() * 0.6 + 0.2,
        char: Math.random() < 0.92 ? '·' : Math.random() < 0.5 ? '✦' : '✧',
      });
    }
    return stars;
  }, []);

  // ── Render state ──
  const [playerY, setPlayerY] = useState(GAME_H / 2 - PLAYER_H / 2);
  const [obstacles, setObstacles] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [rockets, setRockets] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [shields, setShields] = useState(initialShields || 0);
  const [rocketAmmo, setRocketAmmo] = useState(initialRockets || 0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [invincible, setInvincible] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showContinue, setShowContinue] = useState(false);
  const [continueCountdown, setContinueCountdown] = useState(CONTINUE_SECONDS);
  const [shieldFlash, setShieldFlash] = useState(false);
  const [rocketBlasts, setRocketBlasts] = useState([]);
  const [bgScrollX, setBgScrollX] = useState(0);
  const [nukeFlash, setNukeFlash] = useState(false);
  const [nukePickups, setNukePickups] = useState([]);

  // ── Refs ──
  const playerYRef = useRef(GAME_H / 2 - PLAYER_H / 2);
  const targetYRef = useRef(GAME_H / 2 - PLAYER_H / 2);
  const obstaclesRef = useRef([]);
  const pickupsRef = useRef([]);
  const rocketsRef = useRef([]);
  const blastsRef = useRef([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(TOTAL_LIVES);
  const shieldsRef = useRef(initialShields || 0);
  const rocketAmmoRef = useRef(initialRockets || 0);
  const speedRef = useRef(1);
  const gameActiveRef = useRef(false);
  const invincibleRef = useRef(false);
  const invincibleUntilRef = useRef(0);
  const frameIdRef = useRef(null);
  const lastObstacleTimeRef = useRef(0);
  const obstacleCountRef = useRef(0);
  const lastSpeedBumpRef = useRef(0);
  const lastTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const nextPickupTimeRef = useRef(0);
  const continueTimerRef = useRef(null);
  const continueTokensRef = useRef(continueTokens || 0);
  const usedContinueRef = useRef(false);
  const bgScrollRef = useRef(0);
  const nukePickupsRef = useRef([]);
  const lastNukeTimeRef = useRef(0);

  // ── Touch ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!gameActiveRef.current && !gameOver) {
          startGame();
          return;
        }
        const touchY = evt.nativeEvent.locationY;
        targetYRef.current = Math.max(
          0,
          Math.min(touchY - PLAYER_H / 2, GAME_H - PLAYER_H)
        );
      },
      onPanResponderMove: (evt) => {
        const touchY = evt.nativeEvent.locationY;
        targetYRef.current = Math.max(
          0,
          Math.min(touchY - PLAYER_H / 2, GAME_H - PLAYER_H)
        );
      },
    })
  ).current;

  // ── Fire rocket ──
  const fireRocket = useCallback(() => {
    if (rocketAmmoRef.current <= 0 || !gameActiveRef.current) return;
    rocketAmmoRef.current -= 1;
    rocketsRef.current.push({
      id: Date.now(),
      x: PLAYER_X + PLAYER_W,
      y: playerYRef.current + PLAYER_H / 2 - ROCKET_H / 2,
    });
  }, []);

  // ── Start / restart ──
  const startGame = useCallback(() => {
    const now = performance.now();
    gameActiveRef.current = true;
    playerYRef.current = GAME_H / 2 - PLAYER_H / 2;
    targetYRef.current = GAME_H / 2 - PLAYER_H / 2;
    obstaclesRef.current = [];
    pickupsRef.current = [];
    rocketsRef.current = [];
    blastsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = TOTAL_LIVES;
    shieldsRef.current = initialShields || 0;
    rocketAmmoRef.current = initialRockets || 0;
    speedRef.current = 1;
    invincibleRef.current = false;
    invincibleUntilRef.current = 0;
    lastObstacleTimeRef.current = now;
    obstacleCountRef.current = 0;
    lastSpeedBumpRef.current = now;
    lastTimeRef.current = now;
    elapsedRef.current = 0;
    nextPickupTimeRef.current = now + PICKUP_SPAWN_MIN_MS;
    usedContinueRef.current = false;
    bgScrollRef.current = 0;
    nukePickupsRef.current = [];
    lastNukeTimeRef.current = now + NUKE_INTERVAL_MS; // first nuke after 30s

    setPlayerY(playerYRef.current);
    setObstacles([]);
    setPickups([]);
    setNukePickups([]);
    setRockets([]);
    setRocketBlasts([]);
    setScore(0);
    setLives(TOTAL_LIVES);
    setShields(initialShields || 0);
    setRocketAmmo(initialRockets || 0);
    setGameOver(false);
    setGameStarted(true);
    setInvincible(false);
    setSpeedMultiplier(1);
    setShowContinue(false);
    setContinueCountdown(CONTINUE_SECONDS);

    if (continueTimerRef.current) clearInterval(continueTimerRef.current);

    frameIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ── Continue from where you left off ──
  const handleContinue = useCallback(() => {
    if (continueTokensRef.current <= 0) return;
    continueTokensRef.current -= 1;
    usedContinueRef.current = true;
    if (continueTimerRef.current) clearInterval(continueTimerRef.current);

    // Revive with 1 life, keep score, clear nearby obstacles
    livesRef.current = 1;
    invincibleRef.current = true;
    invincibleUntilRef.current = performance.now() + 3000;
    gameActiveRef.current = true;

    // Clear obstacles near the player
    obstaclesRef.current = obstaclesRef.current.filter(
      (o) => o.x > PLAYER_X + 150
    );

    setLives(1);
    setGameOver(false);
    setShowContinue(false);
    setInvincible(true);
    setObstacles([...obstaclesRef.current]);
    lastTimeRef.current = performance.now();

    frameIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ── Trigger game-over or continue ──
  const triggerGameOver = useCallback((finalScore, finalSpeed, obs) => {
    gameActiveRef.current = false;
    scoreRef.current = finalScore;
    setScore(finalScore);
    setLives(0);
    setPlayerY(playerYRef.current);
    setObstacles([...obs]);
    setSpeedMultiplier(finalSpeed);

    // If player has continue tokens and hasn't used one yet, show countdown
    if (continueTokensRef.current > 0 && !usedContinueRef.current) {
      setShowContinue(true);
      setContinueCountdown(CONTINUE_SECONDS);

      let count = CONTINUE_SECONDS;
      continueTimerRef.current = setInterval(() => {
        count -= 1;
        setContinueCountdown(count);
        if (count <= 0) {
          clearInterval(continueTimerRef.current);
          setShowContinue(false);
          setGameOver(true);
        }
      }, 1000);
    } else {
      setGameOver(true);
    }
  }, []);

  // ── Main game loop ──
  const gameLoop = useCallback((timestamp) => {
    if (!gameActiveRef.current) return;

    const dt = Math.min(timestamp - lastTimeRef.current, 33);
    lastTimeRef.current = timestamp;
    elapsedRef.current += dt;
    const elapsed = elapsedRef.current;
    const elapsedS = elapsed / 1000;

    // ── Speed ramp ──
    if (timestamp - lastSpeedBumpRef.current >= SPEED_INCREASE_INTERVAL) {
      speedRef.current = Math.min(
        speedRef.current * SPEED_INCREASE_FACTOR,
        MAX_SPEED_MULTIPLIER
      );
      lastSpeedBumpRef.current = timestamp;
    }
    const speed = BASE_SPEED * speedRef.current;

    // ── Scroll background ──
    bgScrollRef.current = (bgScrollRef.current + speed * 0.5) % W;

    // ── Player movement ──
    const diff = targetYRef.current - playerYRef.current;
    playerYRef.current += diff * 0.18;

    // ── Invincibility timeout ──
    if (invincibleRef.current && timestamp >= invincibleUntilRef.current) {
      invincibleRef.current = false;
    }

    // ── Spawn obstacles ──
    const progress = Math.min(elapsedS / 60, 1);
    const spawnGap = INITIAL_GAP_MS - (INITIAL_GAP_MS - MIN_GAP_MS) * progress;

    if (timestamp - lastObstacleTimeRef.current >= spawnGap) {
      lastObstacleTimeRef.current = timestamp;
      obstacleCountRef.current += 1;
      const count = obstacleCountRef.current;

      const sizeProgress = Math.min(elapsedS / 45, 1);
      const obsW = MIN_OBS_W + (MAX_OBS_W - MIN_OBS_W) * sizeProgress;
      const obsH = MIN_OBS_H + (MAX_OBS_H - MIN_OBS_H) * sizeProgress * 0.7;
      const obsY = Math.random() * (GAME_H - obsH);

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
        warningFlash: isMoving,
      });
    }

    // ── Spawn pickups ──
    if (timestamp >= nextPickupTimeRef.current && elapsedS > 5) {
      const type = Math.random() < 0.5 ? 'shield' : 'rocket';
      const py = Math.random() * (GAME_H - PICKUP_SIZE);
      pickupsRef.current.push({
        id: Date.now(),
        x: W + 10,
        y: py,
        type,
      });
      const delay =
        PICKUP_SPAWN_MIN_MS +
        Math.random() * (PICKUP_SPAWN_MAX_MS - PICKUP_SPAWN_MIN_MS);
      nextPickupTimeRef.current = timestamp + delay;
    }

    // ── Spawn nuke pickup (every 30 seconds) ──
    if (timestamp >= lastNukeTimeRef.current && elapsedS > 10) {
      const ny = Math.random() * (GAME_H - NUKE_SIZE);
      nukePickupsRef.current.push({
        id: Date.now() + 999,
        x: W + 10,
        y: ny,
      });
      lastNukeTimeRef.current = timestamp + NUKE_INTERVAL_MS;
    }

    // ── Update obstacles ──
    const obs = obstaclesRef.current;
    let newScore = scoreRef.current;

    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i];
      o.x -= speed;

      if (o.isMoving) {
        const t = timestamp - o.spawnTime;
        o.y = o.baseY + Math.sin(t * o.moveSpeed) * o.moveAmplitude;
        o.y = Math.max(0, Math.min(o.y, GAME_H - o.h));
      }

      if (o.x + o.w < -20) {
        obs.splice(i, 1);
        continue;
      }

      if (!o.scored && o.x + o.w < PLAYER_X) {
        o.scored = true;
        newScore += 1;
      }

      // Player collision
      if (!invincibleRef.current) {
        const px = PLAYER_X;
        const py = playerYRef.current;
        if (
          px + PLAYER_W > o.x &&
          px < o.x + o.w &&
          py + PLAYER_H > o.y &&
          py < o.y + o.h
        ) {
          // Shield absorbs the hit
          if (shieldsRef.current > 0) {
            shieldsRef.current -= 1;
            obs.splice(i, 1); // destroy the obstacle
            invincibleRef.current = true;
            invincibleUntilRef.current = timestamp + 800;
            setShieldFlash(true);
            setTimeout(() => setShieldFlash(false), 300);
            continue;
          }

          // No shield — lose a life
          livesRef.current -= 1;
          if (livesRef.current <= 0) {
            triggerGameOver(newScore, speedRef.current, obs);
            return;
          }
          invincibleRef.current = true;
          invincibleUntilRef.current = timestamp + INVINCIBILITY_MS;
        }
      }
    }

    // ── Update pickups ──
    const pks = pickupsRef.current;
    for (let i = pks.length - 1; i >= 0; i--) {
      const p = pks[i];
      p.x -= speed * 0.8; // slightly slower than obstacles

      if (p.x + PICKUP_SIZE < -10) {
        pks.splice(i, 1);
        continue;
      }

      // Collect
      const px = PLAYER_X;
      const py = playerYRef.current;
      if (
        px + PLAYER_W > p.x &&
        px < p.x + PICKUP_SIZE &&
        py + PLAYER_H > p.y &&
        py < p.y + PICKUP_SIZE
      ) {
        if (p.type === 'shield') {
          shieldsRef.current += 1;
        } else {
          rocketAmmoRef.current += 1;
        }
        pks.splice(i, 1);
      }
    }

    // ── Update nuke pickups ──
    const nks = nukePickupsRef.current;
    for (let i = nks.length - 1; i >= 0; i--) {
      const n = nks[i];
      n.x -= speed * 0.6; // slower than obstacles so player can grab it

      if (n.x + NUKE_SIZE < -10) {
        nks.splice(i, 1);
        continue;
      }

      // Collect nuke
      const npx = PLAYER_X;
      const npy = playerYRef.current;
      if (
        npx + PLAYER_W > n.x &&
        npx < n.x + NUKE_SIZE &&
        npy + PLAYER_H > n.y &&
        npy < n.y + NUKE_SIZE
      ) {
        nks.splice(i, 1);
        // NUKE! Clear all obstacles on screen
        const nukedCount = obstaclesRef.current.length;
        obstaclesRef.current = [];
        newScore += nukedCount * 2; // bonus points for each nuked enemy
        // Trigger flash effect
        setNukeFlash(true);
        setTimeout(() => setNukeFlash(false), 300);
      }
    }

    // ── Update rockets (player-fired projectiles) ──
    const rks = rocketsRef.current;
    const bls = blastsRef.current;
    for (let i = rks.length - 1; i >= 0; i--) {
      const r = rks[i];
      r.x += ROCKET_SPEED;

      if (r.x > W + 20) {
        rks.splice(i, 1);
        continue;
      }

      // Check rocket vs obstacles
      for (let j = obs.length - 1; j >= 0; j--) {
        const o = obs[j];
        if (
          r.x + ROCKET_W > o.x &&
          r.x < o.x + o.w &&
          r.y + ROCKET_H > o.y &&
          r.y < o.y + o.h
        ) {
          // Blast! Destroy obstacle and add score
          bls.push({ id: Date.now() + j, x: o.x, y: o.y, life: 10 });
          obs.splice(j, 1);
          rks.splice(i, 1);
          newScore += 2; // bonus for rocket kill
          break;
        }
      }
    }

    // Decay blasts
    for (let i = bls.length - 1; i >= 0; i--) {
      bls[i].life -= 1;
      if (bls[i].life <= 0) bls.splice(i, 1);
    }

    scoreRef.current = newScore;

    // ── Push to React state ──
    setPlayerY(playerYRef.current);
    setObstacles([...obs]);
    setPickups([...pks]);
    setRockets([...rks]);
    setRocketBlasts([...bls]);
    setNukePickups([...nks]);
    setScore(newScore);
    setLives(livesRef.current);
    setShields(shieldsRef.current);
    setRocketAmmo(rocketAmmoRef.current);
    setInvincible(invincibleRef.current);
    setSpeedMultiplier(speedRef.current);
    setBgScrollX(bgScrollRef.current);

    frameIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Player taps the game area to start (handled by panResponder)

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      gameActiveRef.current = false;
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      if (continueTimerRef.current) clearInterval(continueTimerRef.current);
    };
  }, []);

  // ── Render helpers ──
  const renderLives = () => {
    const hearts = [];
    for (let i = 0; i < TOTAL_LIVES; i++) {
      hearts.push(
        <Text
          key={i}
          style={[styles.heart, { color: i < lives ? COLORS.lives : COLORS.livesLost }]}
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
            if (continueTimerRef.current) clearInterval(continueTimerRef.current);
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        >
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Power-up HUD ── */}
      <View style={styles.hudRow}>
        <View style={styles.hudItem}>
          <Text style={styles.hudEmoji}>🛡️</Text>
          <Text style={[styles.hudCount, shields > 0 && styles.hudCountActive]}>
            {shields}
          </Text>
        </View>
        <Text style={styles.speedText}>{speedMultiplier.toFixed(1)}×</Text>
        <TouchableOpacity
          style={[styles.rocketBtn, rocketAmmo <= 0 && styles.rocketBtnDisabled]}
          onPress={fireRocket}
          disabled={rocketAmmo <= 0}
        >
          <Text style={styles.hudEmoji}>🚀</Text>
          <Text style={[styles.hudCount, rocketAmmo > 0 && styles.hudCountRocket]}>
            {rocketAmmo}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Game area ── */}
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* Scrolling background — bottom third strip for seamless loop */}
        <View style={styles.bgStripContainer}>
          <Image source={worldImage} style={[styles.bgStrip, { left: -bgScrollX }]} resizeMode="cover" />
          <Image source={worldImage} style={[styles.bgStrip, { left: W - bgScrollX }]} resizeMode="cover" />
        </View>
        {/* Stars and planets scattered in the dark sky */}
        {bgStars.map((s) => (
          <Text
            key={s.id}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              fontSize: s.size,
              color: `rgba(200, 220, 255, ${s.opacity})`,
              zIndex: 1,
            }}
          >
            {s.char}
          </Text>
        ))}
        {/* Player */}
        <View
          style={[
            styles.player,
            {
              top: playerY,
              left: PLAYER_X,
              opacity: invincible
                ? Math.floor(Date.now() / 100) % 2 === 0
                  ? 1
                  : 0.3
                : 1,
            },
          ]}
        >
          <Text style={styles.playerEmoji}>{rideEmoji}</Text>
        </View>

        {/* Shield glow ring */}
        {shields > 0 && (
          <View
            style={[
              styles.shieldRing,
              {
                top: playerY - 6,
                left: PLAYER_X - 6,
              },
            ]}
          />
        )}

        {/* Obstacles — enemy emoji floating freely */}
        {obstacles.map((o) => (
          <View
            key={o.id}
            style={{
              position: 'absolute',
              left: o.x,
              top: o.y,
              width: o.w,
              height: o.h,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: o.isMoving && o.x > W - 60
                ? Math.floor(Date.now() / 150) % 2 === 0
                  ? 1
                  : 0.6
                : 1,
            }}
          >
            <Text style={{ fontSize: Math.min(o.w, o.h) * 0.7, textAlign: 'center' }}>
              {enemyEmoji}
            </Text>
          </View>
        ))}

        {/* Pickups */}
        {pickups.map((p) => (
          <View
            key={p.id}
            style={[
              styles.pickup,
              {
                left: p.x,
                top: p.y,
                backgroundColor:
                  p.type === 'shield' ? COLORS.shieldPickup : COLORS.rocketPickup,
              },
            ]}
          >
            <Text style={styles.pickupEmoji}>
              {p.type === 'shield' ? '🛡️' : '🚀'}
            </Text>
          </View>
        ))}

        {/* Nuke pickups */}
        {nukePickups.map((n) => (
          <View
            key={n.id}
            style={{
              position: 'absolute',
              left: n.x,
              top: n.y,
              width: NUKE_SIZE,
              height: NUKE_SIZE,
              borderRadius: NUKE_SIZE / 2,
              backgroundColor: 'rgba(255, 215, 0, 0.3)',
              borderWidth: 2,
              borderColor: COLORS.nukePickup,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 16,
            }}
          >
            <Text style={{ fontSize: 22 }}>💣</Text>
          </View>
        ))}

        {/* Nuke flash effect */}
        {nukeFlash && (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: COLORS.nukeFlash,
              zIndex: 50,
            }}
          />
        )}

        {/* Player rockets */}
        {rockets.map((r) => (
          <View
            key={r.id}
            style={[
              styles.rocketProjectile,
              { left: r.x, top: r.y },
            ]}
          />
        ))}

        {/* Blast effects */}
        {rocketBlasts.map((b) => (
          <View
            key={b.id}
            style={[
              styles.blast,
              {
                left: b.x,
                top: b.y - 10,
                opacity: b.life / 10,
              },
            ]}
          >
            <Text style={styles.blastEmoji}>💥</Text>
          </View>
        ))}

        {/* Pre-game guide — explains all icons then auto-starts */}
        {!gameStarted && !gameOver && !showContinue && (
          <View style={styles.startOverlay}>
            <Text style={styles.startTitle}>{gameName || 'Quick Gamer'}</Text>
            <Text style={styles.introText}>{enemyEmoji}  DODGE THE {enemyLabel}  {enemyEmoji}</Text>

            <View style={styles.guideBox}>
              <View style={styles.guideRow}>
                <Text style={styles.guideIcon}>♥♥♥</Text>
                <Text style={styles.guideLabel}>Your lives — lose them all and it's game over</Text>
              </View>
              <View style={styles.guideRow}>
                <Text style={styles.guideIcon}>{enemyEmoji}</Text>
                <Text style={styles.guideLabel}>Enemies — dodge them!</Text>
              </View>
              <View style={styles.guideRow}>
                <Text style={styles.guideIcon}>🛡️</Text>
                <Text style={styles.guideLabel}>Shield — absorbs one hit for you</Text>
              </View>
              <View style={styles.guideRow}>
                <Text style={styles.guideIcon}>🚀</Text>
                <Text style={styles.guideLabel}>Rocket — tap the button to blast enemies</Text>
              </View>
              <View style={styles.guideRow}>
                <View style={[styles.guidePickup, { backgroundColor: COLORS.shieldPickup }]} />
                <Text style={styles.guideLabel}>Collect for extra shields</Text>
              </View>
              <View style={styles.guideRow}>
                <View style={[styles.guidePickup, { backgroundColor: COLORS.rocketPickup }]} />
                <Text style={styles.guideLabel}>Collect for extra rockets</Text>
              </View>
              <View style={styles.guideRow}>
                <Text style={styles.guideIcon}>💣</Text>
                <Text style={styles.guideLabel}>NUKE — wipes every enemy on screen!</Text>
              </View>
            </View>

            {(initialShields > 0 || initialRockets > 0) && (
              <View style={styles.startLoadout}>
                {initialShields > 0 && (
                  <Text style={styles.startLoadoutText}>
                    🛡️ ×{initialShields}
                  </Text>
                )}
                {initialRockets > 0 && (
                  <Text style={styles.startLoadoutText}>
                    🚀 ×{initialRockets}
                  </Text>
                )}
              </View>
            )}
            <Text style={styles.tapText}>TAP TO LAUNCH</Text>
          </View>
        )}
      </View>

      {/* ── Continue countdown ── */}
      {showContinue && (
        <View style={styles.continueOverlay}>
          <Text style={styles.continueTitle}>CONTINUE?</Text>
          <Text style={styles.continueScore}>Score: {score}</Text>

          <View style={styles.continueTimerWrap}>
            <Text style={styles.continueNumber}>{continueCountdown}</Text>
            <View style={styles.continueBarBg}>
              <View
                style={[
                  styles.continueBarFill,
                  { width: `${(continueCountdown / CONTINUE_SECONDS) * 100}%` },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>
              CONTINUE (1 token)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (continueTimerRef.current) clearInterval(continueTimerRef.current);
              setShowContinue(false);
              setGameOver(true);
            }}
          >
            <Text style={styles.continueSkip}>End Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Game Over ── */}
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
                navigation.navigate('HallOfFame', { score, gameName })
              }
            >
              <Text style={styles.secondaryBtnText}>Hall of Fame</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() =>
                navigation.navigate('Share', { score, gameName })
              }
            >
              <Text style={styles.secondaryBtnText}>Share Score</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
              <Text style={styles.backText}>Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    height: 70,
  },
  livesRow: { flexDirection: 'row', gap: 6 },
  heart: { fontSize: 28 },
  scoreText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.score,
    fontFamily: 'Courier',
  },
  closeBtn: { fontSize: 28, color: COLORS.dimText },

  // ── Power-up HUD ──
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 6,
    height: 36,
  },
  hudItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hudEmoji: { fontSize: 18 },
  hudCount: { fontSize: 16, color: COLORS.dimText, fontFamily: 'Courier', fontWeight: 'bold' },
  hudCountActive: { color: COLORS.shieldGlow },
  hudCountRocket: { color: COLORS.rocketPickup },
  rocketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rocketBtnDisabled: { opacity: 0.3 },
  speedText: { fontSize: 14, color: COLORS.dimText, fontFamily: 'Courier' },

  // ── Game area ──
  gameArea: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a1a' },
  bgStripContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', overflow: 'hidden' },
  bgStrip: { position: 'absolute', top: 0, width: W, height: '100%' },
  player: {
    position: 'absolute',
    width: PLAYER_W,
    height: PLAYER_H,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  playerEmoji: { fontSize: 32 },
  shieldRing: {
    position: 'absolute',
    width: PLAYER_W + 12,
    height: PLAYER_H + 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.shieldGlow,
    opacity: 0.5,
    zIndex: 19,
  },
  obstacle: { position: 'absolute', zIndex: 10 },

  // ── Pickups ──
  pickup: {
    position: 'absolute',
    width: PICKUP_SIZE,
    height: PICKUP_SIZE,
    borderRadius: PICKUP_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    opacity: 0.9,
  },
  pickupEmoji: { fontSize: 18 },

  // ── Rockets ──
  rocketProjectile: {
    position: 'absolute',
    width: ROCKET_W,
    height: ROCKET_H,
    backgroundColor: COLORS.rocketProjectile,
    borderRadius: 4,
    zIndex: 18,
  },
  blast: { position: 'absolute', zIndex: 25 },
  blastEmoji: { fontSize: 32 },

  // ── Start overlay ──
  startOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
  introText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00D9FF',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: '#00D9FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  guideBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginHorizontal: 10,
    gap: 8,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideIcon: { fontSize: 18, width: 36, textAlign: 'center' },
  guideLabel: { fontSize: 13, color: '#CCCCCC', flex: 1 },
  guideSwatch: {
    width: 28,
    height: 16,
    borderRadius: 3,
    marginLeft: 4,
    marginRight: 4,
  },
  guidePickup: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 7,
    marginRight: 7,
  },
  startLoadout: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startLoadoutText: { fontSize: 18, color: COLORS.text },
  tapText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.lives,
    marginTop: 32,
  },

  // ── Continue ──
  continueOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  continueTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 3,
  },
  continueScore: { fontSize: 18, color: COLORS.dimText, marginTop: 8 },
  continueTimerWrap: { alignItems: 'center', marginTop: 32 },
  continueNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: COLORS.continueBar,
    fontFamily: 'Courier',
  },
  continueBarBg: {
    width: 200,
    height: 6,
    backgroundColor: '#1A1F2E',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  continueBarFill: {
    height: '100%',
    backgroundColor: COLORS.continueBar,
    borderRadius: 3,
  },
  continueBtn: {
    backgroundColor: COLORS.continueBar,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 32,
  },
  continueBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.bg,
    letterSpacing: 1,
  },
  continueSkip: {
    fontSize: 16,
    color: COLORS.dimText,
    marginTop: 20,
  },

  // ── Game over ──
  gameOverOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
  gameOverName: { fontSize: 14, color: COLORS.dimText, marginTop: 8 },
  scoreBox: { marginTop: 40, alignItems: 'center' },
  scoreLabel: { fontSize: 14, color: COLORS.dimText, letterSpacing: 2 },
  finalScore: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#00D9FF',
    fontFamily: 'Courier',
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 48, marginTop: 24 },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Courier',
  },
  statLabel: { fontSize: 12, color: COLORS.dimText, marginTop: 4 },
  gameOverButtons: { width: '100%', marginTop: 48, gap: 12 },
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
  secondaryBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  backText: { fontSize: 16, color: COLORS.dimText, textAlign: 'center', marginTop: 8 },
});
