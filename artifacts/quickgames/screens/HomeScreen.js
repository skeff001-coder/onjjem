import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
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
};

export default function HomeScreen({ navigation }) {
  const [credits, setCredits] = useState(null);
  const [topScores, setTopScores] = useState([]);

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
        // First launch: set defaults
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

    // Deduct a game credit
    const updated = { ...credits, gamesRemaining: credits.gamesRemaining - 1 };
    try {
      await AsyncStorage.setItem(CREDITS_KEY, JSON.stringify(updated));
      setCredits(updated);
    } catch (e) {
      console.log('Failed to update credits', e);
    }

    navigation.navigate('Design');
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
        {/* Logo / title */}
        <View style={styles.hero}>
          <Text style={styles.logoEmoji}>🎮</Text>
          <Text style={styles.logoText}>Quick Gamer</Text>
          <Text style={styles.tagline}>Design • Build • Play</Text>
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

        {/* CTA button */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleMakeGame}>
          <Text style={styles.ctaEmoji}>🛠️</Text>
          <Text style={styles.ctaText}>Make Your Own Game</Text>
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
                No scores yet — make a game and play!
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

  // ── Hero ──
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
  },
  logoEmoji: { fontSize: 56 },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.dimText,
    marginTop: 4,
    letterSpacing: 2,
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

  // ── CTA ──
  ctaButton: {
    backgroundColor: COLORS.orange,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  ctaEmoji: { fontSize: 32 },
  ctaText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  ctaSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
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
  },
  linkEmoji: { fontSize: 28 },
  linkText: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 8 },
});
