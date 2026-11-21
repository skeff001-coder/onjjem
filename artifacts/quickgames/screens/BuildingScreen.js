import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';

const { width: W } = Dimensions.get('window');

const BUILD_MESSAGES = [
  'Generating your world...',
  'Drawing your hero...',
  'Spawning enemies...',
  'Painting the scenery...',
  'Adding power-ups...',
  'Tuning the difficulty...',
  'Polishing the details...',
  'Almost ready...',
];

const COLORS = {
  bg: '#0F1419',
  text: '#FFFFFF',
  dimText: '#888888',
  accent: '#00D9FF',
  orange: '#FF6B35',
};

export default function BuildingScreen({ route, navigation }) {
  const { design } = route.params;

  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  // Pulsing animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Progress simulation + message cycling
  useEffect(() => {
    const totalDuration = 4000; // 4 seconds total build time
    const stepTime = totalDuration / BUILD_MESSAGES.length;

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= BUILD_MESSAGES.length - 1) {
          clearInterval(messageTimer);
          return prev;
        }
        return prev + 1;
      });
    }, stepTime);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, totalDuration / 50);

    // Navigate to game when done
    const doneTimer = setTimeout(() => {
      navigation.replace('Game', {
        character: design.hero || 'astronaut',
        theme: design.world || 'space',
        gameName: design.name || 'My Game',
        design,
        initialShields: 3,  // first game: 3 free shields
        initialRockets: 0,
        continueTokens: 1,  // first game: 1 free continue
      });
    }, totalDuration + 500);

    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  // Look up emoji for the design choices
  const worldEmoji = {
    forest: '🌲', space: '🌌', ocean: '🌊', city: '🏙️',
    desert: '🏜️', arctic: '❄️', volcano: '🌋', candy: '🍬',
  }[design.world] || '🌍';

  const heroEmoji = {
    astronaut: '🧑‍🚀', ninja: '🥷', robot: '🤖', wizard: '🧙',
    pirate: '🏴‍☠️', superhero: '🦸', alien: '👽', cat: '🐱',
  }[design.hero] || '🧑';

  const rideEmoji = {
    car: '🏎️', spaceship: '🚀', skateboard: '🛹', plane: '✈️',
    boat: '🚤', bike: '🚲', dragon: '🐉', ufo: '🛸',
  }[design.ride] || '🚗';

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Big emoji showcase */}
        <View style={styles.emojiRow}>
          <Animated.Text
            style={[styles.bigEmoji, { opacity: pulseAnim }]}
          >
            {worldEmoji}
          </Animated.Text>
          <Animated.Text
            style={[styles.bigEmoji, { opacity: pulseAnim }]}
          >
            {rideEmoji}
          </Animated.Text>
          <Animated.Text
            style={[styles.bigEmoji, { opacity: pulseAnim }]}
          >
            {heroEmoji}
          </Animated.Text>
        </View>

        <Text style={styles.buildTitle}>
          Building {design.name || 'your game'}...
        </Text>

        <Text style={styles.buildMessage}>
          {BUILD_MESSAGES[messageIndex]}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>

        {/* Design summary */}
        <View style={styles.designSummary}>
          <Text style={styles.summaryLabel}>YOUR CREATION</Text>
          <Text style={styles.summaryDetail}>
            A {design.hero || 'hero'} in a {design.ride || 'vehicle'},{'\n'}
            dodging {design.enemy || 'enemies'} in the {design.world || 'world'},{'\n'}
            collecting {design.goal || 'treasure'}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
  },
  bigEmoji: {
    fontSize: 56,
  },
  buildTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  buildMessage: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
    height: 24,
    marginBottom: 32,
  },
  progressBg: {
    width: W - 80,
    height: 8,
    backgroundColor: '#1A1F2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.dimText,
    fontFamily: 'Courier',
    marginTop: 8,
  },
  designSummary: {
    marginTop: 40,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    padding: 20,
    width: W - 80,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.dimText,
    letterSpacing: 2,
    marginBottom: 8,
  },
  summaryDetail: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
});
