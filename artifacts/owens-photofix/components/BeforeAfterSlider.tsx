import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  beforeUri: string;
  afterBase64: string;
  modeName?: string;
}

export function BeforeAfterSlider({ beforeUri, afterBase64, modeName }: Props) {
  const colors = useColors();
  const containerWidthRef = useRef(300);
  const [containerWidth, setContainerWidth] = useState(300);
  const startPositionRef = useRef(0.5);
  const positionRef = useRef(0.5);
  const [sliderPos, setSliderPos] = useState(0.5);

  // Drag-hint opacity — fades to 0 on first user interaction.
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const hintHiddenRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
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
        setSliderPos(newPos);
      },
    })
  ).current;

  const clipWidth = sliderPos * containerWidth;
  const afterSource = { uri: `data:image/jpeg;base64,${afterBase64}` };

  return (
    <View
      style={[s.container, { borderRadius: colors.radius }]}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      <Image
        source={afterSource}
        style={s.image}
        resizeMode="cover"
      />

      <View style={[s.beforeClip, { width: clipWidth }]}>
        <Image
          source={{ uri: beforeUri }}
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

      {modeName && (
        <View style={s.modePill} pointerEvents="none">
          <Text style={s.modePillText}>{modeName} applied</Text>
        </View>
      )}

      <View
        style={[s.dividerWrapper, { left: clipWidth - 1 }]}
        {...panResponder.panHandlers}
      >
        <View style={s.dividerLine} />
        <View style={s.handle}>
          <Ionicons name="chevron-back" size={13} color="#111" />
          <Ionicons name="chevron-forward" size={13} color="#111" />
        </View>
        <Animated.View
          style={[s.hintBubble, { opacity: hintOpacity }]}
          pointerEvents="none"
        >
          <Text style={s.hintText}>DRAG</Text>
        </Animated.View>
        <View style={s.dividerLine} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 1,
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
    top: 12,
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  labelLeft: { left: 12 },
  labelRight: { right: 12 },
  labelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  dividerWrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 42,
    marginLeft: -21,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerLine: {
    flex: 1,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  handle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    gap: 0,
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
    fontWeight: "800" as const,
    letterSpacing: 1.4,
  },
  modePill: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modePillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
