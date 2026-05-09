import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
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
}

export function BeforeAfterSlider({ beforeUri, afterBase64 }: Props) {
  const colors = useColors();
  const [containerWidth, setContainerWidth] = useState(300);
  const startPositionRef = useRef(0.5);
  const positionRef = useRef(0.5);
  const [sliderPos, setSliderPos] = useState(0.5);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startPositionRef.current = positionRef.current;
    },
    onPanResponderMove: (_, gestureState) => {
      const newPos = Math.max(
        0.03,
        Math.min(
          0.97,
          startPositionRef.current + gestureState.dx / containerWidth,
        ),
      );
      positionRef.current = newPos;
      setSliderPos(newPos);
    },
  });

  const clipWidth = sliderPos * containerWidth;
  const afterSource = { uri: `data:image/jpeg;base64,${afterBase64}` };

  return (
    <View
      style={[s.container, { borderRadius: colors.radius }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Image
        source={afterSource}
        style={s.image}
        resizeMode="cover"
      />

      <View style={[s.beforeClip, { width: clipWidth }]}>
        <Image
          source={{ uri: beforeUri }}
          style={[s.image, { width: containerWidth }]}
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
        <View style={s.dividerLine} />
        <View style={s.handle}>
          <Ionicons name="chevron-back" size={13} color="#111" />
          <Ionicons name="chevron-forward" size={13} color="#111" />
        </View>
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
});
