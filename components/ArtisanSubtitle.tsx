import React, { useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

// A simpler companion to GraffitiTitle's rich gold-depth effect, built for
// the "ARTISAN PRINT EMPORIUM" subtitle line. Uses the same layered-shadow
// technique (dark bronze depth fading up to a bright gold top face) minus
// the ruby heart, since that ornament is specific to the ONJJEM wordmark.

const DEPTH_LAYERS = [
  { dt: 3, dl: 2, color: "#3A2200" },
  { dt: 2, dl: 1, color: "#5A3600" },
  { dt: 2, dl: 1, color: "#7A4E04" },
  { dt: 1, dl: 1, color: "#9A6A08" },
  { dt: 1, dl: 0, color: "#B8840C" },
] as const;

const TOP_COLOR = "#F0CA2A";

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

export function ArtisanSubtitle({ fontSize = 18, letterSpacing = 3 }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const lineH = fontSize + 6;

  const textStyle = {
    fontSize,
    fontFamily: "Baloo2_700Bold",
    letterSpacing,
    lineHeight: lineH,
  } as const;

  const renderText = (dt: number, dl: number, color: string, key: string, glow = false) => (
    <Text
      key={key}
      numberOfLines={1}
      style={[
        styles.abs,
        textStyle,
        { top: dt, left: dl, color, width: screenWidth, textAlign: "center" },
        glow
          ? {
              textShadowColor: "rgba(240,200,42,0.6)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            }
          : {},
      ]}
    >
      ARTISAN PRINT EMPORIUM
    </Text>
  );

  return (
    <View style={{ height: lineH + 6, width: screenWidth, overflow: "visible" }}>
      {DEPTH_LAYERS.map(({ dt, dl, color }) => renderText(dt, dl, color, `depth-${dt}-${dl}`))}
      {renderText(0, 0, TOP_COLOR, "top", true)}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
});
