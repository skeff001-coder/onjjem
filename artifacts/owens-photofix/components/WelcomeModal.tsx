import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const SLIDES = [
  {
    icon: "aperture-outline" as const,
    accent: "#4A90D9",
    title: "Sharpen",
    body: "Bring blurry, soft or low-resolution photos back to life with Cinema-Grade AI upscaling.",
  },
  {
    icon: "color-palette-outline" as const,
    accent: "#C9960C",
    title: "Colourize",
    body: "Add vivid, natural colour to old black-and-white family photos — in seconds.",
  },
  {
    icon: "sunny-outline" as const,
    accent: "#F5A623",
    title: "Restore",
    body: "Lift dark shots, remove grain, and give faded prints a full professional restoration.",
  },
];

export function WelcomeModal({ visible, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: false });
    }
  }, [visible]);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <LinearGradient
        colors={["#0A0804", "#13100A", "#1C1810"]}
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        {/* Top badge */}
        <View style={styles.badgeRow}>
          <LinearGradient
            colors={["#C9960C", "#F5D78E", "#C9960C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
          >
            <Ionicons name="sparkles" size={11} color="#0A0804" />
            <Text style={styles.badgeText}>CINEMA-GRADE AI</Text>
          </LinearGradient>
        </View>

        {/* App headline — always visible above the carousel */}
        <Text style={styles.headline}>Welcome to{"\n"}ONJJEM</Text>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={[styles.iconCircle, { borderColor: item.accent + "66" }]}>
                <Ionicons name={item.icon} size={48} color={item.accent} />
              </View>
              <Text style={[styles.slideTitle, { color: item.accent }]}>{item.title}</Text>
              <Text style={styles.slideBody}>{item.body}</Text>
            </View>
          )}
          style={styles.flatList}
        />

        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.88}
          style={styles.ctaWrap}
        >
          <LinearGradient
            colors={["#C9960C", "#F5D78E", "#C9960C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{isLast ? "Get Started" : "Next"}</Text>
            <Ionicons
              name={isLast ? "arrow-forward" : "chevron-forward"}
              size={18}
              color="#0A0804"
            />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footnote}>Free to try · No account required</Text>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  badgeRow: {
    marginBottom: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0A0804",
    letterSpacing: 1.4,
  },
  headline: {
    fontSize: 38,
    fontWeight: "900",
    color: "#F5EDD8",
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 46,
    marginBottom: 32,
  },
  flatList: {
    flexGrow: 0,
    width: SCREEN_W,
  },
  slide: {
    width: SCREEN_W,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    minHeight: 260,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  slideBody: {
    fontSize: 15,
    color: "rgba(245,237,216,0.65)",
    textAlign: "center",
    lineHeight: 23,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
    marginBottom: 32,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(245,237,216,0.25)",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#C9960C",
  },
  ctaWrap: {
    width: SCREEN_W - 56,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0A0804",
    letterSpacing: 0.3,
  },
  footnote: {
    fontSize: 12,
    color: "rgba(245,237,216,0.35)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
