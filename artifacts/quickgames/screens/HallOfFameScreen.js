import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@quickgamer_halloffame';
const MAX_ENTRIES = 20;

const COLORS = {
  bg: '#0F1419',
  card: '#1A1F2E',
  text: '#FFFFFF',
  dimText: '#888888',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  accent: '#00D9FF',
  orange: '#FF6B35',
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function HallOfFameScreen({ route, navigation }) {
  const { score, gameName } = route?.params || {};
  const isNewScore = score !== undefined;

  const [entries, setEntries] = useState([]);
  const [initials, setInitials] = useState(['A', 'A', 'A']);
  const [activeSlot, setActiveSlot] = useState(0);
  const [saved, setSaved] = useState(false);

  // Load existing scores
  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setEntries(JSON.parse(data));
      }
    } catch (e) {
      console.log('Failed to load scores', e);
    }
  };

  const saveScore = async () => {
    if (saved) return;

    const newEntry = {
      initials: initials.join(''),
      score,
      gameName: gameName || 'Unknown',
      date: new Date().toISOString(),
    };

    const updated = [...entries, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setEntries(updated);
      setSaved(true);
    } catch (e) {
      console.log('Failed to save score', e);
    }
  };

  const cycleLetter = (slot, direction) => {
    setInitials((prev) => {
      const updated = [...prev];
      const idx = ALPHABET.indexOf(updated[slot]);
      const newIdx = (idx + direction + 26) % 26;
      updated[slot] = ALPHABET[newIdx];
      return updated;
    });
  };

  const getMedalColor = (rank) => {
    if (rank === 0) return COLORS.gold;
    if (rank === 1) return COLORS.silver;
    if (rank === 2) return COLORS.bronze;
    return COLORS.dimText;
  };

  const getMedalEmoji = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `${rank + 1}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HALL OF FAME</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Initials entry (only for new scores) */}
        {isNewScore && !saved && (
          <View style={styles.entrySection}>
            <Text style={styles.entryTitle}>NEW HIGH SCORE!</Text>
            <Text style={styles.entryScore}>{score}</Text>
            <Text style={styles.entrySubtitle}>Enter your initials</Text>

            <View style={styles.initialsRow}>
              {initials.map((letter, i) => (
                <View key={i} style={styles.initialSlot}>
                  <TouchableOpacity
                    onPress={() => cycleLetter(i, 1)}
                    style={styles.arrowBtn}
                  >
                    <Text style={styles.arrowText}>▲</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveSlot(i)}
                    style={[
                      styles.letterBox,
                      activeSlot === i && styles.letterBoxActive,
                    ]}
                  >
                    <Text style={styles.letterText}>{letter}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => cycleLetter(i, -1)}
                    style={styles.arrowBtn}
                  >
                    <Text style={styles.arrowText}>▼</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveScore}>
              <Text style={styles.saveBtnText}>SAVE SCORE</Text>
            </TouchableOpacity>
          </View>
        )}

        {isNewScore && saved && (
          <View style={styles.savedSection}>
            <Text style={styles.savedEmoji}>🏆</Text>
            <Text style={styles.savedText}>Score saved!</Text>
          </View>
        )}

        {/* Leaderboard */}
        <View style={styles.leaderboard}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>No scores yet</Text>
              <Text style={styles.emptySubtext}>
                Play a game to get on the board!
              </Text>
            </View>
          ) : (
            entries.map((entry, i) => (
              <View
                key={i}
                style={[
                  styles.entryRow,
                  i < 3 && styles.entryRowTop3,
                  saved &&
                    entry.initials === initials.join('') &&
                    entry.score === score &&
                    styles.entryRowHighlight,
                ]}
              >
                <Text
                  style={[
                    styles.rank,
                    { color: getMedalColor(i) },
                  ]}
                >
                  {getMedalEmoji(i)}
                </Text>
                <Text style={styles.entryInitials}>{entry.initials}</Text>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryGameName}>{entry.gameName}</Text>
                </View>
                <Text
                  style={[
                    styles.entryScoreText,
                    i < 3 && styles.entryScoreTop3,
                  ]}
                >
                  {entry.score}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backArrow: { fontSize: 28, color: COLORS.text },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 3,
  },

  // ── Initials entry ──
  entrySection: { alignItems: 'center', paddingVertical: 24 },
  entryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 2,
  },
  entryScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.accent,
    fontFamily: 'Courier',
    marginVertical: 8,
  },
  entrySubtitle: {
    fontSize: 14,
    color: COLORS.dimText,
    marginBottom: 20,
  },
  initialsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  initialSlot: { alignItems: 'center' },
  arrowBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 20,
    color: COLORS.orange,
  },
  letterBox: {
    width: 56,
    height: 64,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  letterBoxActive: {
    borderColor: COLORS.orange,
  },
  letterText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Courier',
  },
  saveBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },

  // ── Saved confirmation ──
  savedSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  savedEmoji: { fontSize: 48 },
  savedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginTop: 8,
  },

  // ── Leaderboard ──
  leaderboard: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: { fontSize: 48, opacity: 0.5 },
  emptyText: {
    fontSize: 18,
    color: COLORS.dimText,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.dimText,
    marginTop: 4,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  entryRowTop3: {
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  entryRowHighlight: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  rank: {
    fontSize: 20,
    width: 36,
    textAlign: 'center',
  },
  entryInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Courier',
    width: 60,
    marginLeft: 8,
  },
  entryInfo: { flex: 1 },
  entryGameName: { fontSize: 12, color: COLORS.dimText },
  entryScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dimText,
    fontFamily: 'Courier',
  },
  entryScoreTop3: { color: COLORS.accent },
});
