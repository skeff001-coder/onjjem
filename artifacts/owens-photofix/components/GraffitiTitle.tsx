import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

export function GraffitiTitle({ fontSize = 52, letterSpacing = 9 }: Props) {
  const containerHeight = fontSize + 16;

  const textStyle = {
    fontSize,
    fontFamily: "Cinzel_400Regular",
    letterSpacing,
    lineHeight: fontSize + 10,
  } as const;

  const heartSize = Math.round(fontSize * 0.24);
  const heartTop = Math.round(fontSize * 0.19);
  const heartLeft = Math.round(fontSize * 0.085);

  return (
    <View style={{ height: containerHeight }}>
      {/* 3-D letterpress depth — stacked dark layers going down-right */}
      <Text style={[styles.abs, textStyle, { top: 5, left: 3, color: "rgba(60,38,0,0.55)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 4, left: 2, color: "rgba(80,52,0,0.45)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 3, left: 1, color: "rgba(110,72,0,0.40)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 2, left: 1, color: "rgba(140,96,0,0.32)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 1, left: 0, color: "rgba(170,120,0,0.22)" }]}>ONJJEM</Text>

      {/* Specular highlight — light catching top-left edge */}
      <Text
        style={[
          styles.abs,
          textStyle,
          { top: -1, left: -1, color: "rgba(255,240,180,0.22)" },
        ]}
      >
        ONJJEM
      </Text>

      {/* Top face — warm cream-gold with ambient glow */}
      <Text
        style={[
          styles.abs,
          textStyle,
          {
            top: 0,
            left: 0,
            color: "#E2B54A",
            textShadowColor: "rgba(220,170,50,0.55)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 14,
          },
        ]}
      >
        ONJJEM
      </Text>

      {/* Subtle heart nestled inside the counter of the O — only visible on close inspection */}
      <Text
        style={[
          styles.abs,
          {
            top: heartTop,
            left: heartLeft,
            fontSize: heartSize,
            lineHeight: heartSize + 2,
            color: "rgba(160,60,60,0.28)",
          },
        ]}
      >
        ♥
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: "absolute",
  },
});
