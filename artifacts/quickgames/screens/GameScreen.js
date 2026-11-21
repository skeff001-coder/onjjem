import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 160;
const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;

const CHARACTER_EMOJIS = {
  bird: '🐦',
  cube: '🟦',
  rocket: '🚀',
  ball: '⚽',
  cat: '🐱',
};

const THEME_COLORS = {
  sky: ['#3366CC', '#1A3380'],
  space: ['#0D0033', '#1A004D'],
  neon: ['#1A3366', '#4D0066'],
};

export default function GameScreen({ route, navigation }) {
  const { character, theme, gameName } = route.params;

  const [playerY, setPlayerY] = useState(SCREEN_HEIGHT / 2);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const gameLoopRef = useRef(null);
  const obstacleIdRef = useRef(0);

  useEffect(() => {
    startGame();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  const startGame = () => {
    setPlayerY(SCREEN_HEIGHT / 2);
    setVelocity(0);
    setObstacles([]);
    setScore(0);
    setGameActive(true);
    setGameOver(false);

    gameLoopRef.current = setInterval(() => {
      updateGame();
    }, 16);
  };

  const stopGame = () => {
    setGameActive(false);
    setGameOver(true);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  };

  const updateGame = () => {
    setVelocity((v) => v + GRAVITY);
    setPlayerY((y) => {
      const newY = y + velocity;

      if (newY < 0 || newY > SCREEN_HEIGHT - 150) {
        stopGame();
        return y;
      }

      return newY;
    });

    setObstacles((prev) => {
      let updated = prev.map((obs) => ({ ...obs, x: obs.x - 6 }));

      if (updated.length === 0 || updated[updated.length - 1].x < SCREEN_WIDTH - 250) {
        const topHeight = Math.random() * 200 + 80;
        obstacleIdRef.current += 1;
        updated.push({
          id: obstacleIdRef.current,
          x: SCREEN_WIDTH,
          topHeight,
          bottomY: topHeight + OBSTACLE_GAP,
          scored: false,
        });
      }

      updated = updated.filter((obs) => obs.x > -OBSTACLE_WIDTH);

      updated.forEach((obs) => {
        const playerLeft = 50;
        const playerRight = playerLeft + PLAYER_SIZE;
        const playerTop = playerY;
        const playerBottom = playerY + PLAYER_SIZE;

        if (
          playerRight > obs.x &&
          playerLeft < obs.x + OBSTACLE_WIDTH &&
          (playerTop < obs.topHeight || playerBottom > obs.bottomY)
        ) {
          stopGame();
        }

        if (obs.x + OBSTACLE_WIDTH < playerLeft && !obs.scored) {
          obs.scored = true;
          setScore((s) => s + 1);
        }
      });

      return updated;
    });
  };

  const handleTap = () => {
    if (gameActive) {
      setVelocity(JUMP_STRENGTH);
    }
  };

  const themeColors = THEME_COLORS[theme] || THEME_COLORS.sky;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors[0] }]}>
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>{score}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.gameArea}>
          <Text
            style={[
              styles.player,
              { top: playerY, left: 50 },
            ]}
          >
            {CHARACTER_EMOJIS[character] || '🐦'}
          </Text>

          {obstacles.map((obs) => (
            <View key={obs.id}>
              <View
                style={[
                  styles.pipe,
                  {
                    left: obs.x,
                    top: 0,
                    height: obs.topHeight,
                    width: OBSTACLE_WIDTH,
                  },
                ]}
              />
              <View
                style={[
                  styles.pipe,
                  {
                    left: obs.x,
                    top: obs.bottomY,
                    height: SCREEN_HEIGHT - obs.bottomY,
                    width: OBSTACLE_WIDTH,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </TouchableWithoutFeedback>

      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverTitle}>Game Over</Text>
          <Text style={styles.gameOverGameName}>{gameName}</Text>
          <Text style={styles.gameOverScoreLabel}>Score</Text>
          <Text style={styles.gameOverScore}>{score}</Text>

          <View style={styles.gameOverButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={startGame}>
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                navigation.navigate('Share', { score, gameName })
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
    paddingVertical: 16,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Courier',
  },
  closeButton: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  player: {
    position: 'absolute',
    fontSize: 32,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  pipe: {
    position: 'absolute',
    backgroundColor: '#2ECC71',
  },
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
  },
  gameOverTitle: {
    fontSize: 42,
    fontWeight: 'bold',
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
    marginTop: 32,
  },
  gameOverScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00D9FF',
    fontFamily: 'Courier',
    marginTop: 8,
  },
  gameOverButtons: {
    width: '100%',
    marginTop: 48,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    paddingVertical: 14,
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
