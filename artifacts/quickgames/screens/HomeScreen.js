import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDITS_KEY = '@quickgamer_credits';
const HOF_KEY = '@quickgamer_halloffame';

const COLORS = {
  bg: '#0F1419',
  card: '#1A1F2E',
  text: '#FFFFFF',
  dimText: '#888888',
  accent: '#00D9FF',
  orange: '#FF6B35',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  glow: 'rgba(0, 217, 255, 0.15)',
};

export default function HomeScreen({ navigation }) {
  const [credits, setCredits] = useState(null);
  const [topScores, setTopScores] = useState([]);
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Title entrance animation
    Animated.spring(titleScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const credData = await AsyncStorage.getItem(CREDITS_KEY);
      if (credData) {
        setCredits(JSON.parse(credData));
      } else {
        const defaults = {
          gamesRemaining: 1,
          shields: 3,
          rockets: 0,
          continueTokens: 1,
          ownedVehicles: [],
        };
        await AsyncStorage.setItem(CREDITS_KEY, JSON.stringify(defaults));
        setCredits(defaults);
      }

      const hofData = await AsyncStorage.getItem(HOF_KEY);
      if (hofData) {
        setTopScores(JSON.parse(hofData).slice(0, 3));
      }
    } catch (e) {
      console.log('Failed to load data', e);
    }
  };

  const handleMakeGame = async () => {
    if (!credits || credits.gamesRemaining <= 0) {
      navigation.navigate('Store');
      return;
    }

    const updated = { ...credits, gamesRemaining: credits.gamesRemaining - 1 };
    try {
      await AsyncStorage.setItem(CREDITS_KEY, JSON.stringify(updated));
      setCredits(updated);
    } catch (e) {
      console.log('Failed to update credits', e);
    }

    // Reset stack so user can't go back and exploit free games
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'Design' }],
    });
  };

  const getMedalColor = (i) => {
    if (i === 0) return COLORS.gold;
    if (i === 1) return COLORS.silver;
    if (i === 2) return COLORS.bronze;
    return COLORS.dimText;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Space-themed title ── */}
        <View style={styles.hero}>
          <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
          <Animated.View style={{ transform: [{ scale: titleScale }], alignItems: 'center' }}>
            <Text style={styles.logoEmoji}>🚀</Text>
            <Text style={styles.logoText}>QUICK</Text>
            <Text style={styles.logoTextAccent}>GAMER</Text>
          </Animated.View>
          <View style={styles.starField}>
            <Text style={styles.star}>✦</Text>
            <Text style={[styles.star, { left: '20%', top: 10 }]}>✧</Text>
            <Text style={[styles.star, { left: '75%', top: 20 }]}>✦</Text>
            <Text style={[styles.star, { left: '90%', top: 50 }]}>✧</Text>
            <Text style={[styles.star, { left: '5%', top: 60 }]}>✦</Text>
            <Text style={[styles.star, { left: '60%', top: 5 }]}>✧</Text>
          </View>
          <Text style={styles.tagline}>D E S I G N  •  B U I L D  •  P L A Y</Text>
        </View>

        {/* Credits bar */}
        {credits && (
          <View style={styles.creditsBar}>
            <View style={styles.creditItem}>
              <Text style={styles.creditEmoji}>🎮</Text>
              <Text style={styles.creditCount}>{credits.gamesRemaining}</Text>
            </View>
            <View style={styles.creditItem}>
              <Text style={styles.creditEmoji}>🛡️</Text>
              <Text style={styles.creditCount}>{credits.shields}</Text>
            </View>
            <View style={styles.creditItem}>
              <Text style={styles.creditEmoji}>🚀</Text>
              <Text style={styles.creditCount}>{credits.rockets}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Store')}>
              <Text style={styles.plusBtn}>＋</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── BUILD YOUR GAME button ── */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleMakeGame}>
          <Text style={styles.ctaEmoji}>⚡</Text>
          <Text style={styles.ctaText}>BUILD YOUR GAME</Text>
          <Text style={styles.ctaSubtext}>
            {credits && credits.gamesRemaining > 0
              ? `${credits.gamesRemaining} game${credits.gamesRemaining !== 1 ? 's' : ''} remaining`
              : 'Get more games in the store'}
          </Text>
        </TouchableOpacity>

        {/* Hall of Fame preview */}
        <View style={styles.hofSection}>
          <View style={styles.hofHeader}>
            <Text style={styles.hofTitle}>🏆 Hall of Fame</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('HallOfFame')}
            >
              <Text style={styles.hofSeeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {topScores.length === 0 ? (
            <View style={styles.hofEmpty}>
              <Text style={styles.hofEmptyText}>
                No scores yet — build a game and play!
              </Text>
            </View>
          ) : (
            topScores.map((entry, i) => (
              <View key={i} style={styles.hofRow}>
                <Text style={[styles.hofRank, { color: getMedalColor(i) }]}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </Text>
                <Text style={styles.hofInitials}>{entry.initials}</Text>
                <Text style={styles.hofGame}>{entry.gameName}</Text>
                <Text style={styles.hofScore}>{entry.score}</Text>
              </View>
            ))
          )}
        </View>

        {/* Quick links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('Store')}
          >
            <Text style={styles.linkEmoji}>🏪</Text>
            <Text style={styles.linkText}>Store</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('HallOfFame')}
          >
            <Text style={styles.linkEmoji}>🏆</Text>
            <Text style={styles.linkText}>Scores</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ── Hero — space-themed ──
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.glow,
    top: -20,
  },
  starField: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  star: {
    position: 'absolute',
    fontSize: 12,
    color: 'rgba(0, 217, 255, 0.5)',
    left: '45%',
    top: 30,
  },
  logoEmoji: { fontSize: 56, marginBottom: 4 },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 12,
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoTextAccent: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 16,
    marginTop: -4,
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  tagline: {
    fontSize: 11,
    color: COLORS.dimText,
    marginTop: 12,
    letterSpacing: 3,
  },

  // ── Credits bar ──
  creditsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.1)',
  },
  creditItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creditEmoji: { fontSize: 18 },
  creditCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    fontFamily: 'Courier',
  },
  plusBtn: {
    fontSize: 24,
    color: COLORS.orange,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // ── CTA — space-styled ──
  ctaButton: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaEmoji: { fontSize: 28 },
  ctaText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.bg,
    marginTop: 6,
    letterSpacing: 4,
  },
  ctaSubtext: {
    fontSize: 13,
    color: 'rgba(15, 20, 25, 0.6)',
    marginTop: 4,
    fontWeight: '600',
  },

  // ── Hall of Fame ──
  hofSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  hofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hofTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  hofSeeAll: { fontSize: 14, color: COLORS.accent },
  hofEmpty: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  hofEmptyText: { fontSize: 14, color: COLORS.dimText },
  hofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  hofRank: { fontSize: 20, width: 32 },
  hofInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Courier',
    width: 50,
  },
  hofGame: { flex: 1, fontSize: 13, color: COLORS.dimText },
  hofScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    fontFamily: 'Courier',
  },

  // ── Quick links ──
  quickLinks: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  linkCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.08)',
  },
  linkEmoji: { fontSize: 28 },
  linkText: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 8 },
});
