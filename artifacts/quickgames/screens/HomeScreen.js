import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const MOCK_GAMES = [
  { id: 1, name: 'Spike Runner', creator: 'Alex', plays: 1234, rating: 4.8, score: 456 },
  { id: 2, name: 'Space Tap', creator: 'Jordan', plays: 892, rating: 4.2, score: 389 },
  { id: 3, name: 'Dino Jump', creator: 'Casey', plays: 734, rating: 4.9, score: 612 },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Top Games</Text>
          <Text style={styles.subtitle}>This Week</Text>
        </View>

        <View style={styles.leaderboard}>
          {MOCK_GAMES.map((game, index) => (
            <View
              key={game.id}
              style={[
                styles.gameCard,
                index === 0 && styles.gameCardHighlight,
              ]}
            >
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.creator}>by {game.creator}</Text>
              </View>
              <View style={styles.gameStats}>
                <Text style={styles.plays}>{game.plays} plays</Text>
                <Text style={styles.rating}>★ {game.rating}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>Ready to create?</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Customize')}
          >
            <Text style={styles.ctaButtonText}>Make Your Own Game →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  leaderboard: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    padding: 16,
  },
  gameCardHighlight: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  rank: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#888888',
    width: 50,
    fontFamily: 'Courier',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  creator: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  gameStats: {
    alignItems: 'flex-end',
  },
  plays: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
    fontFamily: 'Courier',
  },
  rating: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 4,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
