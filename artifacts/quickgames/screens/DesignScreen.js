import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';

const { width: W } = Dimensions.get('window');

// Real scenery thumbnails for the world picker
const WORLD_THUMBS = {
  forest: require('../assets/worlds/thumb_forest.jpg'),
  space: require('../assets/worlds/thumb_space.jpg'),
  ocean: require('../assets/worlds/thumb_ocean.jpg'),
  city: require('../assets/worlds/thumb_city.jpg'),
  desert: require('../assets/worlds/thumb_desert.jpg'),
  arctic: require('../assets/worlds/thumb_arctic.jpg'),
  volcano: require('../assets/worlds/thumb_volcano.jpg'),
  candy: require('../assets/worlds/thumb_candy.jpg'),
};

// ── Design steps ──
const STEPS = [
  {
    key: 'world',
    title: 'Pick Your World',
    subtitle: 'Where does your game take place?',
    options: [
      { id: 'forest', emoji: '🌲', label: 'Forest' },
      { id: 'space', emoji: '🌌', label: 'Space' },
      { id: 'ocean', emoji: '🌊', label: 'Ocean' },
      { id: 'city', emoji: '🏙️', label: 'City' },
      { id: 'desert', emoji: '🏜️', label: 'Desert' },
      { id: 'arctic', emoji: '❄️', label: 'Arctic' },
      { id: 'volcano', emoji: '🌋', label: 'Volcano' },
      { id: 'candy', emoji: '🍬', label: 'Candy Land' },
    ],
  },
  {
    key: 'ride',
    title: 'Choose Your Ride',
    subtitle: "What are you travelling in?",
    options: [
      { id: 'car', emoji: '🏎️', label: 'Race Car' },
      { id: 'spaceship', emoji: '🚀', label: 'Spaceship' },
      { id: 'skateboard', emoji: '🛹', label: 'Skateboard' },
      { id: 'plane', emoji: '✈️', label: 'Plane' },
      { id: 'boat', emoji: '🚤', label: 'Speedboat' },
      { id: 'bike', emoji: '🚲', label: 'Bike' },
      { id: 'dragon', emoji: '🐉', label: 'Dragon' },
      { id: 'ufo', emoji: '🛸', label: 'UFO' },
    ],
  },
  {
    key: 'hero',
    title: 'Design Your Hero',
    subtitle: 'Who is the main character?',
    options: [
      { id: 'astronaut', emoji: '🧑‍🚀', label: 'Astronaut' },
      { id: 'ninja', emoji: '🥷', label: 'Ninja' },
      { id: 'robot', emoji: '🤖', label: 'Robot' },
      { id: 'wizard', emoji: '🧙', label: 'Wizard' },
      { id: 'pirate', emoji: '🏴‍☠️', label: 'Pirate' },
      { id: 'superhero', emoji: '🦸', label: 'Superhero' },
      { id: 'alien', emoji: '👽', label: 'Alien' },
      { id: 'cat', emoji: '🐱', label: 'Cat' },
    ],
  },
  {
    key: 'enemy',
    title: 'Pick Your Enemies',
    subtitle: 'What are you dodging?',
    options: [
      { id: 'meteors', emoji: '☄️', label: 'Meteors' },
      { id: 'monsters', emoji: '👾', label: 'Monsters' },
      { id: 'lasers', emoji: '⚡', label: 'Lasers' },
      { id: 'boulders', emoji: '🪨', label: 'Boulders' },
      { id: 'ghosts', emoji: '👻', label: 'Ghosts' },
      { id: 'fireballs', emoji: '🔥', label: 'Fireballs' },
      { id: 'snowballs', emoji: '⛄', label: 'Snowballs' },
      { id: 'sharks', emoji: '🦈', label: 'Sharks' },
    ],
  },
  {
    key: 'goal',
    title: 'Set Your Goal',
    subtitle: 'What are you collecting?',
    options: [
      { id: 'coins', emoji: '🪙', label: 'Coins' },
      { id: 'stars', emoji: '⭐', label: 'Stars' },
      { id: 'gems', emoji: '💎', label: 'Gems' },
      { id: 'hearts', emoji: '❤️', label: 'Hearts' },
      { id: 'candy', emoji: '🍭', label: 'Candy' },
      { id: 'trophies', emoji: '🏆', label: 'Trophies' },
    ],
  },
  {
    key: 'name',
    title: 'Name Your Game',
    subtitle: 'Give it a cool name!',
    isTextInput: true,
  },
];

const COLORS = {
  bg: '#0F1419',
  card: '#1A1F2E',
  cardSelected: '#FF6B35',
  text: '#FFFFFF',
  dimText: '#888888',
  accent: '#00D9FF',
  orange: '#FF6B35',
};

export default function DesignScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState({});
  const [gameName, setGameName] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentStep = STEPS[step];
  const totalSteps = STEPS.length;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const selectOption = (optionId) => {
    setChoices((prev) => ({ ...prev, [currentStep.key]: optionId }));
  };

  const animateTransition = (callback) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };

  const goNext = () => {
    if (step === totalSteps - 1) {
      // All done — go to building screen
      const finalName = gameName.trim() || 'My Game';
      navigation.replace('Building', {
        design: { ...choices, name: finalName },
      });
      return;
    }
    animateTransition(() => setStep(step + 1));
  };

  const goBack = () => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    animateTransition(() => setStep(step - 1));
  };

  const canProceed =
    currentStep.isTextInput
      ? gameName.trim().length > 0
      : !!choices[currentStep.key];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepCounter}>
          {step + 1} / {totalSteps}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {/* ── Step content ── */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

        {currentStep.isTextInput ? (
          <View style={styles.nameSection}>
            <TextInput
              style={styles.nameInput}
              placeholder="Type a name..."
              placeholderTextColor="#555"
              value={gameName}
              onChangeText={setGameName}
              maxLength={24}
              autoFocus
              returnKeyType="done"
            />
            <Text style={styles.charCount}>{gameName.length}/24</Text>

            {/* Summary of choices */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Your Game</Text>
              {Object.keys(choices).map((key) => {
                const stepDef = STEPS.find((s) => s.key === key);
                const opt = stepDef?.options?.find(
                  (o) => o.id === choices[key]
                );
                if (!opt) return null;
                return (
                  <View key={key} style={styles.summaryRow}>
                    <Text style={styles.summaryEmoji}>{opt.emoji}</Text>
                    <Text style={styles.summaryLabel}>{opt.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.optionsGrid}
          >
            {currentStep.options.map((opt) => {
              const isSelected = choices[currentStep.key] === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => selectOption(opt.id)}
                  activeOpacity={0.7}
                >
                  {currentStep.key === 'world' && WORLD_THUMBS[opt.id] ? (
                    <Image source={WORLD_THUMBS[opt.id]} style={styles.worldThumb} resizeMode="cover" />
                  ) : (
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Next button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={goNext}
          disabled={!canProceed}
        >
          <Text style={styles.nextBtnText}>
            {step === totalSteps - 1 ? 'BUILD MY GAME →' : 'NEXT →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CARD_W = (W - 60) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backArrow: { fontSize: 28, color: COLORS.text },
  stepCounter: {
    fontSize: 16,
    color: COLORS.dimText,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  progressBg: {
    height: 4,
    backgroundColor: '#1A1F2E',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },
  content: { flex: 1, paddingTop: 20 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.dimText,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 20,
  },
  optionCard: {
    width: CARD_W,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.cardSelected,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  optionEmoji: { fontSize: 40 },
  worldThumb: { width: CARD_W - 24, height: CARD_W - 24, borderRadius: 12 },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  optionLabelSelected: { color: COLORS.cardSelected },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardSelected,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },

  // ── Name step ──
  nameSection: { paddingHorizontal: 20, flex: 1 },
  nameInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 22,
    color: COLORS.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.dimText,
    textAlign: 'right',
    marginTop: 6,
  },
  summaryBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dimText,
    marginBottom: 12,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  summaryEmoji: { fontSize: 24 },
  summaryLabel: { fontSize: 16, color: COLORS.text },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  nextBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#333' },
  nextBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
});
