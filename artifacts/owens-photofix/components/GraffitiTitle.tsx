import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

const DEPTH = 7;

const LAYERS: { top: number; left: number; color: string }[] = [
  ...Array.from({ length: DEPTH }, (_, i) => ({
    top: DEPTH - i,
    left: DEPTH - i,
    color: i < 3 ? "#3D1200" : i < 5 ? "#8B3A00" : "#D46000",
  })),
  { top: -1, left: 0,  color: "#1A0800" },
  { top: 1,  left: 0,  color: "#1A0800" },
  { top: 0,  left: -1, color: "#1A0800" },
  { top: 0,  left: 1,  color: "#1A0800" },
];

export function GraffitiTitle({ fontSize = 52, letterSpacing = 5 }: Props) {
  const containerHeight = fontSize + 2 + DEPTH + 2;

  const textStyle = {
    fontSize,
    fontFamily: "BebasNeue_400Regular",
    letterSpacing,
    lineHeight: fontSize + 2,
  } as const;

  return (
    <View style={{ height: containerHeight }}>
      {LAYERS.map((layer, i) => (
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

      <Text
        style={[
          styles.abs,
          textStyle,
          {
            top: 0,
            left: 0,
            color: "#FFE033",
            textShadowColor: "rgba(255,110,0,0.95)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 16,
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
