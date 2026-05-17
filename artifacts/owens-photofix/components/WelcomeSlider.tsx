import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
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
}

export function WelcomeSlider({ before, after, accent }: Props) {
  const containerWidthRef = useRef(300);
  const [containerWidth, setContainerWidth] = useState(300);
  const startPositionRef = useRef(0.5);
  const positionRef = useRef(0.5);
  const [sliderPos, setSliderPos] = useState(0.5);

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
});
