import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 40;
const PLAYER_LEFT = 60;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 190;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -9;
const BASE_SPEED = 4;
const PIPE_SPACING = 270;
const HIT_INSET = 6;
const CAP_HEIGHT = 26;

const CHARACTER_EMOJIS = {
  bird: '🐦',
  cube: '🟦',
  rocket: '🚀',
  ball: '⚽',
  cat: '🐱',
};

const THEMES = {
  sky: {
    bg: '#4AA3FF',
    horizon: '#8FCBFF',
    pipe: '#2ECC71',
    edge: '#16A05A',
    glow: '#FFFFFF',
    glowOpacity: 0.25,
    shadow: '#0B6B3A',
    shadowOpacity: 0.35,
    trail: '#FFFFFF',
    deco: 'cloud',
  },
  space: {
    bg: '#0B0030',
    horizon: '#1A0A55',
    pipe: '#7B4DFF',
    edge: '#C3A8FF',
    glow: '#B69CFF',
    glowOpacity: 0.3,
    shadow: '#9B7DFF',
    shadowOpacity: 0.9,
    trail: '#C3A8FF',
    deco: 'star',
  },
  neon: {
    bg: '#12002B',
    horizon: '#2B0057',
    pipe: '#00D9FF',
    edge: '#FF2BD6',
    glow: '#FF2BD6',
    glowOpacity: 0.35,
    shadow: '#FF2BD6',
    shadowOpacity: 1,
    trail: '#00F0FF',
    deco: 'pixel',
  },
};

const rand = (a, b) => a + Math.random() * (b - a);

function makeDeco(areaH) {
  const items = [];
  for (let i = 0; i < 16; i++) {
    items.push({
      id: i,
      x: rand(0, SCREEN_WIDTH),
      y: rand(0, areaH - 40),
      size: rand(24, 64),
      depth: rand(0.15, 0.7),
      o: rand(0.25, 0.9),
    });
  }
  return items;
}

export default function GameScreen({ route, navigation }) {
  const { character, theme, gameName } = route.params;
  const T = THEMES[theme] || THEMES.sky;

  const areaHeightRef = useRef(SCREEN_HEIGHT - 200);
  const gameRef = useRef({
    t: 0,
    playerY: 0,
    velocity: 0,
    obstacles: [],
    trail: [],
    deco: makeDeco(SCREEN_HEIGHT - 200),
    score: 0,
    best: 0,
    started: false,
    over: false,
    nextId: 1,
  });
  const loopRef = useRef(null);
  const flash = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  const [view, setView] = useState({
    playerY: SCREEN_HEIGHT / 2,
    velocity: 0,
    obstacles: [],
    trail: [],
    deco: [],
    score: 0,
    best: 0,
    started: false,
    over: false,
  });

  const publish = () => {
    const g = gameRef.current;
    setView({
      playerY: g.playerY,
      velocity: g.velocity,
      obstacles: g.obstacles.map((o) => ({ ...o })),
      trail: g.trail.map((p) => ({ ...p })),
      deco: g.deco.map((d) => ({ ...d })),
      score: g.score,
      best: g.best,
      started: g.started,
      over: g.over,
    });
  };

  const crashEffects = () => {
    flash.setValue(0.55);
    Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(shake, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const endGame = () => {
    const g = gameRef.current;
    g.over = true;
    g.best = Math.max(g.best, g.score);
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    crashEffects();
    publish();
  };

  const tick = () => {
    const g = gameRef.current;
    if (g.over) return;
    const areaH = areaHeightRef.current;
    g.t += 1;

    const speed = BASE_SPEED + Math.min(g.score * 0.15, 2.5);

    g.deco.forEach((d) => {
      d.x -= (g.started ? speed : 1) * d.depth;
      if (d.x < -80) {
        d.x = SCREEN_WIDTH + rand(0, 80);
        d.y = rand(0, areaH - 40);
      }
    });

    if (!g.started) {
      g.playerY = areaH / 2 - PLAYER_SIZE / 2 + Math.sin(g.t / 12) * 10;
      g.velocity = Math.sin(g.t / 12) * -1.5;
      publish();
      return;
    }

    g.velocity += GRAVITY;
    g.playerY += g.velocity;

    if (g.playerY < 0 || g.playerY + PLAYER_SIZE > areaH) {
      g.playerY = Math.min(Math.max(g.playerY, 0), areaH - PLAYER_SIZE);
      endGame();
      return;
    }

    if (g.t % 2 === 0) {
      g.trail.push({ id: g.t, x: PLAYER_LEFT + 4, y: g.playerY + PLAYER_SIZE / 2, life: 14 });
    }
    g.trail.forEach((p) => {
      p.x -= speed;
      p.life -= 1;
    });
    g.trail = g.trail.filter((p) => p.life > 0);

    g.obstacles.forEach((o) => {
      o.x -= speed;
    });

    const last = g.obstacles[g.obstacles.length - 1];
    if (!last || last.x < SCREEN_WIDTH - PIPE_SPACING) {
      const minTop = 80;
      const maxTop = Math.max(minTop + 10, areaH - OBSTACLE_GAP - 80);
      const topHeight = rand(minTop, maxTop);
      g.obstacles.push({
        id: g.nextId++,
        x: SCREEN_WIDTH,
        topHeight,
        bottomY: topHeight + OBSTACLE_GAP,
        scored: false,
      });
    }

    g.obstacles = g.obstacles.filter((o) => o.x > -OBSTACLE_WIDTH - 10);

    const pl = PLAYER_LEFT + HIT_INSET;
    const pr = PLAYER_LEFT + PLAYER_SIZE - HIT_INSET;
    const pt = g.playerY + HIT_INSET;
    const pb = g.playerY + PLAYER_SIZE - HIT_INSET;

    for (const o of g.obstacles) {
      if (pr > o.x && pl < o.x + OBSTACLE_WIDTH && (pt < o.topHeight || pb > o.bottomY)) {
        endGame();
        return;
      }
      if (o.x + OBSTACLE_WIDTH < PLAYER_LEFT && !o.scored) {
        o.scored = true;
        g.score += 1;
      }
    }

    publish();
  };

  const resetGame = () => {
    if (loopRef.current) clearInterval(loopRef.current);
    const areaH = areaHeightRef.current;
    const best = gameRef.current.best || 0;
    gameRef.current = {
      t: 0,
      playerY: areaH / 2 - PLAYER_SIZE / 2,
      velocity: 0,
      obstacles: [],
      trail: [],
      deco: makeDeco(areaH),
      score: 0,
      best,
      started: false,
      over: false,
      nextId: 1,
    };
    publish();
    loopRef.current = setInterval(tick, 16);
  };

  useEffect(() => {
    resetGame();
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, []);

  const handleTap = () => {
    const g = gameRef.current;
    if (g.over) return;
    g.started = true;
    g.velocity = JUMP_STRENGTH;
  };

  const areaH = areaHeightRef.current;
  const tilt = Math.max(-25, Math.min(70, view.velocity * 5));

  const renderDeco = (d) => {
    if (T.deco === 'cloud') {
      return (
        <Text
          key={d.id}
          style={{ position: 'absolute', left: d.x, top: d.y, fontSize: d.size, opacity: d.o * 0.8 }}
        >
          ☁️
        </Text>
      );
    }
    if (T.deco === 'star') {
      const s = Math.max(2, d.size / 14);
      return (
        <View
          key={d.id}
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: s,
            height: s,
            borderRadius: s,
            backgroundColor: '#FFFFFF',
            opacity: 0.3 + 0.7 * Math.abs(Math.sin((view.deco.length ? gameRef.current.t : 0) / 20 + d.id)),
          }}
        />
      );
    }
    const s = Math.max(4, d.size / 6);
    return (
      <View
        key={d.id}
        style={{
          position: 'absolute',
          left: d.x,
          top: d.y,
          width: s,
          height: s,
          backgroundColor: d.id % 2 === 0 ? '#00F0FF' : '#FF2BD6',
          opacity: d.o * 0.7,
          transform: [{ rotate: '45deg' }],
        }}
      />
    );
  };

  const pipeStyle = {
    backgroundColor: T.pipe,
    borderColor: T.edge,
    borderWidth: 3,
    shadowColor: T.shadow,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: shake }] }}>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{view.score}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPressIn={handleTap}>
          <View
            style={[styles.gameArea, { backgroundColor: T.horizon }]}
            onLayout={(e) => {
              areaHeightRef.current = e.nativeEvent.layout.height;
            }}
          >
            {view.deco.map(renderDeco)}

            {view.trail.map((p) => {
              const s = 4 + p.life * 0.7;
              return (
                <View
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: p.x - s / 2,
                    top: p.y - s / 2,
                    width: s,
                    height: s,
                    borderRadius: s,
                    backgroundColor: T.trail,
                    opacity: p.life / 20,
                  }}
                />
              );
            })}

            {view.obstacles.map((obs) => (
              <View key={obs.id}>
                <View
                  style={[
                    styles.pipe,
                    pipeStyle,
                    { left: obs.x, top: -10, height: obs.topHeight + 10, width: OBSTACLE_WIDTH },
                  ]}
                />
                <View
                  style={[
                    styles.pipe,
                    pipeStyle,
                    {
                      left: obs.x - 6,
                      top: obs.topHeight - CAP_HEIGHT,
                      height: CAP_HEIGHT,
                      width: OBSTACLE_WIDTH + 12,
                      borderRadius: 8,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.pipe,
                    pipeStyle,
                    {
                      left: obs.x,
                      top: obs.bottomY,
                      height: Math.max(0, areaH - obs.bottomY + 10),
                      width: OBSTACLE_WIDTH,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.pipe,
                    pipeStyle,
                    {
                      left: obs.x - 6,
                      top: obs.bottomY,
                      height: CAP_HEIGHT,
                      width: OBSTACLE_WIDTH + 12,
                      borderRadius: 8,
                    },
                  ]}
                />
              </View>
            ))}

            <View
              style={{
                position: 'absolute',
                left: PLAYER_LEFT - 12,
                top: view.playerY - 12,
                width: PLAYER_SIZE + 24,
                height: PLAYER_SIZE + 24,
                borderRadius: (PLAYER_SIZE + 24) / 2,
                backgroundColor: T.glow,
                opacity: T.glowOpacity,
              }}
            />
            <Text
              style={[
                styles.player,
                {
                  top: view.playerY,
                  left: PLAYER_LEFT,
                  transform: [{ rotate: `${tilt}deg` }],
                },
              ]}
            >
              {CHARACTER_EMOJIS[character] || '🐦'}
            </Text>

            {!view.started && !view.over && (
              <Text style={styles.tapHint}>Tap to fly</Text>
            )}
          </View>
        </TouchableWithoutFeedback>

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flash }]}
        />
      </Animated.View>

      {view.over && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverEmoji}>{CHARACTER_EMOJIS[character] || '🐦'}</Text>
          <Text style={styles.gameOverTitle}>Crash!</Text>
          {!!gameName && <Text style={styles.gameOverGameName}>{gameName}</Text>}
          <Text style={styles.gameOverScoreLabel}>Score</Text>
          <Text style={styles.gameOverScore}>{view.score}</Text>
          <Text style={styles.bestText}>Your best: {view.best}</Text>

          <View style={styles.gameOverButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={resetGame}>
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                navigation.navigate('Share', { score: view.score, gameName })
              }
            >
              <Text style={styles.secondaryButtonText}>Share Score</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Back</Text>
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
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  score: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  closeButton: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  player: {
    position: 'absolute',
    fontSize: 32,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    lineHeight: PLAYER_SIZE,
    textAlign: 'center',
  },
  pipe: {
    position: 'absolute',
  },
  tapHint: {
    position: 'absolute',
    top: '62%',
    alignSelf: 'center',
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  gameOverEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  gameOverTitle: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gameOverGameName: {
    fontSize: 14,
    color: '#888888',
    marginTop: 8,
  },
  gameOverScoreLabel: {
    fontSize: 14,
    color: '#888888',
    marginTop: 28,
  },
  gameOverScore: {
    fontSize: 72,
    fontWeight: '900',
    color: '#00D9FF',
    marginTop: 4,
  },
  bestText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD24D',
    marginTop: 4,
  },
  gameOverButtons: {
    width: '100%',
    marginTop: 40,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#1A1F2E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
});
