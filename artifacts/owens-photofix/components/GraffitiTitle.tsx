import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

const SHADOW_LAYERS: { top: number; left: number; color: string }[] = [
  { top: 4, left: 0,  color: "rgba(100,70,0,0.55)" },
  { top: 3, left: 0,  color: "rgba(130,90,0,0.45)" },
  { top: 2, left: 0,  color: "rgba(160,110,0,0.35)" },
  { top: 1, left: 0,  color: "rgba(180,130,0,0.25)" },
  { top: 0, left: -1, color: "rgba(80,55,0,0.3)" },
  { top: 0, left: 1,  color: "rgba(80,55,0,0.3)" },
];

export function GraffitiTitle({ fontSize = 52, letterSpacing = 5 }: Props) {
  const containerHeight = fontSize + 8 + 4;

  const textStyle = {
    fontSize,
    fontFamily: "Cinzel_700Bold",
    letterSpacing,
    lineHeight: fontSize + 4,
  } as const;

  return (
    <View style={{ height: containerHeight }}>
      {SHADOW_LAYERS.map((layer, i) => (
        <Text
          key={i}
          style={[
            styles.abs,
            textStyle,
            { top: layer.top, left: layer.left, color: layer.color },
          ]}
        >
          ONJJEM
        </Text>
      ))}

      {/* Mid shimmer layer — warm gold */}
      <Text
        style={[
          styles.abs,
          textStyle,
          {
            top: 0,
            left: 0,
            color: "#C9960C",
            opacity: 0.35,
          },
        ]}
      >
        ONJJEM
      </Text>

      {/* Top layer — cream gold */}
      <Text
        style={[
          styles.abs,
          textStyle,
          {
            top: 0,
            left: 0,
            color: "#F5E4A0",
            textShadowColor: "rgba(201,150,12,0.7)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 18,
          },
        ]}
      >
        ONJJEM
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: "absolute",
  },
});
