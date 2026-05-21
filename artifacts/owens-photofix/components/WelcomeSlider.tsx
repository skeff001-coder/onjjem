import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  before: ImageSourcePropType;
  after: ImageSourcePropType;
  accent: string;
  animate?: boolean;
  /** When true the divider sweeps back and forth continuously until the user drags. Defaults to true. */
  loop?: boolean;
}

export function WelcomeSlider({ before, after, accent, animate, loop = true }: Props) {
  const containerWidthRef = useRef(300);
  const [containerWidth, setContainerWidth] = useState(300);
  const startPositionRef = useRef(0.5);
  const positionRef = useRef(0.5);
  const [sliderPos, setSliderPos] = useState(0.5);

  const sliderPosAnim = useRef(new Animated.Value(0.5)).current;
  const hasAnimatedRef = useRef(false);
  const prevAnimateRef = useRef(false);

  // Drag-hint opacity — fades to 0 on first user interaction.
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const hintHiddenRef = useRef(false);

  // Keep sliderPos state in sync with the Animated.Value so existing
  // clip-width rendering works without converting to Animated.View.
  useEffect(() => {
    const listenerId = sliderPosAnim.addListener(({ value }) => {
      positionRef.current = value;
      setSliderPos(value);
    });
    return () => sliderPosAnim.removeListener(listenerId);
  }, [sliderPosAnim]);

  // Sweep animation: re-plays each time the slide becomes active
  // (animate transitions false → true).
  const hintSequenceRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reset the guard when the slide goes inactive so the animation re-plays
    // the next time this slide becomes active (animate: false → true).
    if (!animate) {
      if (prevAnimateRef.current) {
        hasAnimatedRef.current = false;
        hintSequenceRef.current?.stop();
        hintSequenceRef.current = null;
        sliderPosAnim.setValue(0.5);
      }
      prevAnimateRef.current = false;
      return;
    }

    prevAnimateRef.current = true;

    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    // Wait for the slide's fade-in animation (300 ms) to finish first.
    const delay = setTimeout(() => {
      if (loop) {
        // Continuous pendulum: sweeps left ↔ right indefinitely.
        // Animated.loop replays from the current animated value each iteration,
        // so [→0.18, →0.82] naturally produces 0.5→0.18→0.82→0.18→0.82…
        const anim = Animated.loop(
          Animated.sequence([
            Animated.timing(sliderPosAnim, {
              toValue: 0.18,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(sliderPosAnim, {
              toValue: 0.82,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ])
        );
        hintSequenceRef.current = anim;
        anim.start(() => { hintSequenceRef.current = null; });
      } else {
        // One-shot sweep (loop prop disabled).
        const seq = Animated.sequence([
          Animated.timing(sliderPosAnim, {
            toValue: 0.18,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(sliderPosAnim, {
            toValue: 0.82,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(sliderPosAnim, {
            toValue: 0.5,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]);
        hintSequenceRef.current = seq;
        seq.start(() => { hintSequenceRef.current = null; });
      }
    }, 320);

    return () => {
      clearTimeout(delay);
      hintSequenceRef.current?.stop();
      hintSequenceRef.current = null;
    };
  }, [animate, loop, sliderPosAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        // Stop any in-flight hint animation so user drag takes full control.
        hintSequenceRef.current?.stop();
        hintSequenceRef.current = null;
        sliderPosAnim.stopAnimation();
        startPositionRef.current = positionRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        // Fade out the drag hint on first confirmed horizontal drag (>4 px).
        if (!hintHiddenRef.current && Math.abs(gestureState.dx) > 4) {
          hintHiddenRef.current = true;
          Animated.timing(hintOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
        }
        const newPos = Math.max(
          0.03,
          Math.min(
            0.97,
            startPositionRef.current + gestureState.dx / containerWidthRef.current,
          ),
        );
        positionRef.current = newPos;
        sliderPosAnim.setValue(newPos);
      },
    })
  ).current;

  const clipWidth = sliderPos * containerWidth;

  return (
    <View
      style={s.wrapper}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      <Image source={after} style={s.image} resizeMode="cover" />

      <View style={[s.beforeClip, { width: clipWidth }]}>
        <Image
          source={before}
          style={[s.image, { width: containerWidthRef.current }]}
          resizeMode="cover"
        />
      </View>

      <View style={[s.label, s.labelLeft]}>
        <Text style={s.labelText}>Before</Text>
      </View>
      <View style={[s.label, s.labelRight]}>
        <Text style={s.labelText}>After</Text>
      </View>

      <View
        style={[s.dividerWrapper, { left: clipWidth - 1 }]}
        {...panResponder.panHandlers}
      >
        <View style={[s.dividerLine, { backgroundColor: accent }]} />
        <View style={[s.handle, { borderColor: accent + "55" }]}>
          <Ionicons name="chevron-back" size={12} color="#111" />
          <Ionicons name="chevron-forward" size={12} color="#111" />
        </View>
        <Animated.View
          style={[s.hintBubble, { opacity: hintOpacity }]}
          pointerEvents="none"
        >
          <Text style={s.hintText}>DRAG</Text>
        </Animated.View>
        <View style={[s.dividerLine, { backgroundColor: accent }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  beforeClip: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  label: {
    position: "absolute",
    top: 10,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelLeft: { left: 10 },
  labelRight: { right: 10 },
  labelText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  dividerWrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 44,
    marginLeft: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerLine: {
    flex: 1,
    width: 2,
  },
  handle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  hintBubble: {
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: -5,
  },
  hintText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
});
