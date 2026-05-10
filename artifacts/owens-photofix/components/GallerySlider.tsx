import React, { useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GOLD = "#C9960C";

interface Props {
  beforeSource: ImageSourcePropType;
  afterSource: ImageSourcePropType;
  initialPos?: number;
}

export function GallerySlider({ beforeSource, afterSource, initialPos = 0.5 }: Props) {
  const [containerWidth, setContainerWidth] = useState(320);
  const startRef = useRef(initialPos);
  const posRef = useRef(initialPos);
  const [sliderPos, setSliderPos] = useState(initialPos);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startRef.current = posRef.current;
    },
    onPanResponderMove: (_, g) => {
      const next = Math.max(0.03, Math.min(0.97, startRef.current + g.dx / containerWidth));
      posRef.current = next;
      setSliderPos(next);
    },
  });

  const clipWidth = sliderPos * containerWidth;

  return (
    <View
      style={s.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* After image — full width behind */}
      <Image source={afterSource} style={s.image} resizeMode="cover" />

      {/* Before image — clipped on the left */}
      <View style={[s.clip, { width: clipWidth }]}>
        <Image source={beforeSource} style={[s.image, { width: containerWidth }]} resizeMode="cover" />
      </View>

      {/* Corner labels */}
      <View style={[s.label, s.labelLeft]}>
        <Text style={s.labelText}>BEFORE</Text>
      </View>
      <View style={[s.label, s.labelRight]}>
        <Text style={[s.labelText, s.labelAfter]}>AFTER</Text>
      </View>

      {/* Drag handle */}
      <View style={[s.dividerWrap, { left: clipWidth - 1 }]} {...panResponder.panHandlers}>
        <View style={s.line} />
        <View style={s.handle}>
          <Ionicons name="chevron-back" size={12} color={GOLD} />
          <Ionicons name="chevron-forward" size={12} color={GOLD} />
        </View>
        <View style={s.line} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 4 / 3,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
  },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  clip: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  label: {
    position: "absolute",
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  labelLeft: { left: 12 },
  labelRight: { right: 12 },
  labelText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
  },
  labelAfter: {
    color: "#FBD96A",
  },
  dividerWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 44,
    marginLeft: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flex: 1,
    width: 2.5,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  handle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "#F5D78E",
  },
});
