import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WelcomeSlider } from "./WelcomeSlider";

const { width: SCREEN_W } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const SLIDES: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  title: string;
  body: string;
  before: ImageSourcePropType;
  after: ImageSourcePropType;
}[] = [
  {
    icon: "aperture-outline",
    accent: "#4A90D9",
    title: "Sharpen",
    body: "Bring blurry, soft or low-resolution photos back to life with Cinema-Grade AI upscaling.",
    before: require("../assets/gallery/welcome/portrait_before.png"),
    after: require("../assets/gallery/welcome/portrait_after.png"),
  },
  {
    icon: "color-palette-outline",
    accent: "#C9960C",
    title: "Colourize",
    body: "Add vivid, natural colour to old black-and-white family photos — in seconds.",
    before: require("../assets/gallery/welcome/grandma_before.png"),
    after: require("../assets/gallery/welcome/grandma_after.png"),
  },
  {
    icon: "sunny-outline",
    accent: "#F5A623",
    title: "Restore",
    body: "Lift dark shots, remove grain, and give faded prints a full professional restoration.",
    before: require("../assets/gallery/welcome/victorian_before.png"),
    after: require("../assets/gallery/welcome/victorian_after.png"),
  },
];

const ANIM_DURATION = 300;
const ANIM_EASING = Easing.out(Easing.quad);
const TRANSLATE_START = 14;

interface SlideProps {
  item: (typeof SLIDES)[number];
  isActive: boolean;
}

function AnimatedSlide({ item, isActive }: SlideProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(TRANSLATE_START);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: ANIM_DURATION, easing: ANIM_EASING });
      translateY.value = withTiming(0, { duration: ANIM_DURATION, easing: ANIM_EASING });
    } else {
      opacity.value = 0;
      translateY.value = TRANSLATE_START;
    }
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.slide}>
      <View style={styles.sliderWrapper}>
        <WelcomeSlider before={item.before} after={item.after} accent={item.accent} />
      </View>
      <Animated.View style={[styles.slideTextRow, animStyle]}>
        <Ionicons name={item.icon} size={20} color={item.accent} />
        <Text style={[styles.slideTitle, { color: item.accent }]}>{item.title}</Text>
      </Animated.View>
      <Animated.Text style={[styles.slideBody, animStyle]}>{item.body}</Animated.Text>
    </View>
  );
}

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
  const isNotLast = !isLast;

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

  const activeAccent = SLIDES[activeIndex]?.accent ?? "#C9960C";

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

        {/* Skip link — visible on all slides except the last */}
        {isNotLast && (
          <TouchableOpacity
            onPress={onDismiss}
            style={[styles.skipBtn, { top: insets.top + 10 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* App headline — always visible above the carousel */}
        <Text style={styles.headline}>Welcome to{"\n"}ONJJEM</Text>

        {/* Slides — extraData ensures renderItem re-runs when activeIndex changes */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          extraData={activeIndex}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <AnimatedSlide item={item} isActive={index === activeIndex} />
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
                i === activeIndex && [styles.dotActive, { backgroundColor: activeAccent }],
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
    marginBottom: 14,
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
    fontSize: 34,
    fontWeight: "900",
    color: "#F5EDD8",
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 42,
    marginBottom: 20,
  },
  flatList: {
    flexGrow: 0,
    width: SCREEN_W,
  },
  slide: {
    width: SCREEN_W,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 14,
  },
  sliderWrapper: {
    width: "100%",
  },
  slideTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  slideBody: {
    fontSize: 14,
    color: "rgba(245,237,216,0.62)",
    textAlign: "center",
    lineHeight: 21,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(245,237,216,0.25)",
  },
  dotActive: {
    width: 22,
  },
  ctaWrap: {
    width: SCREEN_W - 56,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
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
  skipBtn: {
    position: "absolute",
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  skipText: {
    fontSize: 14,
    color: "rgba(245,237,216,0.45)",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
