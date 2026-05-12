import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

export function GraffitiTitle({ fontSize = 52, letterSpacing = 8 }: Props) {
  const containerHeight = fontSize + 12;

  const textStyle = {
    fontSize,
    fontFamily: "Cinzel_400Regular",
    letterSpacing,
    lineHeight: fontSize + 8,
  } as const;

  return (
    <View style={{ height: containerHeight }}>
      {/* Subtle warm drop shadow for depth */}
      <Text
        style={[
          styles.abs,
          textStyle,
          { top: 3, left: 0, color: "rgba(100,68,0,0.28)" },
        ]}
      >
        ONJJEM
      </Text>

      {/* Top layer — refined cream-gold with soft glow */}
      <Text
        style={[
          styles.abs,
          textStyle,
          {
            top: 0,
            left: 0,
            color: "#D4A843",
            textShadowColor: "rgba(212,168,67,0.45)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
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
