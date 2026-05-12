import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

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

  // Heart overlay positioned inside the counter of the 'O' (first character)
  const hW = Math.round(fontSize * 0.28);
  const hH = Math.round(fontSize * 0.22);
  const hTop = Math.round(fontSize * 0.3);
  const hLeft = Math.round(fontSize * 0.18);

  return (
    <View style={{ height: containerHeight }}>
      {/* 3-D letterpress depth — stacked dark layers going down-right */}
      <Text style={[styles.abs, textStyle, { top: 5, left: 3, color: "rgba(60,38,0,0.55)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 4, left: 2, color: "rgba(80,52,0,0.45)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 3, left: 1, color: "rgba(110,72,0,0.40)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 2, left: 1, color: "rgba(140,96,0,0.32)" }]}>ONJJEM</Text>
      <Text style={[styles.abs, textStyle, { top: 1, left: 0, color: "rgba(170,120,0,0.22)" }]}>ONJJEM</Text>

      {/* Specular highlight — light catching top-left edge */}
      <Text style={[styles.abs, textStyle, { top: -1, left: -1, color: "rgba(255,240,180,0.22)" }]}>
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

      {/* Subtle heart outline hidden inside the counter of the 'O' — reveals itself on close inspection */}
      <View
        style={[
          styles.abs,
          { top: hTop, left: hLeft, width: hW, height: hH, opacity: 0.26 },
        ]}
        pointerEvents="none"
      >
        <Svg width={hW} height={hH} viewBox="0 0 20 16">
          <Path
            d="M 10 15 C 10 15 0.5 9 0.5 4.2 C 0.5 1.5 2.8 0 5.2 0 C 7 0 9 1.2 10 3 C 11 1.2 13 0 14.8 0 C 17.2 0 19.5 1.5 19.5 4.2 C 19.5 9 10 15 10 15 Z"
            stroke="#E2B54A"
            strokeWidth={1.1}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="10" cy="7" r="0.8" fill="#E2B54A" opacity={0.5} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: "absolute",
  },
});
