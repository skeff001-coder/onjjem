import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';

const CHARACTERS = [
  { id: 'bird', emoji: '🐦', name: 'Bird', locked: false },
  { id: 'cube', emoji: '🟦', name: 'Cube', locked: false },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', locked: false },
  { id: 'ball', emoji: '⚽', name: 'Ball', locked: false },
  { id: 'cat', emoji: '🐱', name: 'Cat', locked: true },
];

const THEMES = [
  { id: 'sky', name: 'Sky', emoji: '🌤️' },
  { id: 'space', name: 'Space', emoji: '🌌' },
  { id: 'neon', name: 'Neon', emoji: '⚡' },
];

export default function CustomizeScreen({ navigation }) {
  const [selectedCharacter, setSelectedCharacter] = useState('bird');
  const [selectedTheme, setSelectedTheme] = useState('sky');
  const [gameName, setGameName] = useState('');

  const handleStart = () => {
    if (!gameName.trim()) return;
    navigation.navigate('Game', {
      character: selectedCharacter,
      theme: selectedTheme,
      gameName: gameName.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Game</Text>
          <Text style={styles.subtitle}>Pick your character and theme</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick Your Character</Text>
          <View style={styles.characterGrid}>
            {CHARACTERS.map((char) => (
              <TouchableOpacity
                key={char.id}
                style={[
                  styles.characterButton,
                  selectedCharacter === char.id && styles.characterSelected,
                  char.locked && styles.characterLocked,
                ]}
                onPress={() => !char.locked && setSelectedCharacter(char.id)}
                disabled={char.locked}
              >
                <Text style={styles.characterEmoji}>{char.emoji}</Text>
                <Text style={styles.characterName}>{char.name}</Text>
                {char.locked && <Text style={styles.lockIcon}>🔒</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick Your Theme</Text>
          <View style={styles.themeRow}>
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeButton,
                  selectedTheme === theme.id && styles.themeSelected,
                ]}
                onPress={() => setSelectedTheme(theme.id)}
              >
                <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                <Text style={styles.themeName}>{theme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Give your game a name"
            placeholderTextColor="#666666"
            value={gameName}
            onChangeText={setGameName}
            maxLength={20}
          />
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>Your character:</Text>
          <Text style={styles.previewEmoji}>
            {CHARACTERS.find((c) => c.id === selectedCharacter)?.emoji}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.startButton,
            !gameName.trim() && styles.startButtonDisabled,
          ]}
          onPress={handleStart}
          disabled={!gameName.trim()}
        >
          <Text style={styles.startButtonText}>Start Playing →</Text>
        </TouchableOpacity>
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
    paddingTop: 24,
    paddingBottom: 8,
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
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  characterButton: {
    width: 70,
    alignItems: 'center',
    padding: 8,
  },
  characterSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 8,
  },
  characterLocked: {
    opacity: 0.4,
  },
  characterEmoji: {
    fontSize: 32,
  },
  characterName: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },
  lockIcon: {
    position: 'absolute',
    top: 0,
    right: 8,
    fontSize: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  themeSelected: {
    backgroundColor: '#FF6B35',
  },
  themeEmoji: {
    fontSize: 28,
  },
  themeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  previewSection: {
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    paddingVertical: 24,
  },
  previewLabel: {
    fontSize: 12,
    color: '#888888',
  },
  previewEmoji: {
    fontSize: 48,
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#333333',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
