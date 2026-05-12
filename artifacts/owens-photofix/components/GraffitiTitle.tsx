import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

// Heart-ring path: outer heart + inner heart (0.60× scale) with evenOdd fill.
// Top notch is very shallow (y=1.5) so the shape reads as a rounded classic O
// with just a hint of heart — elegant rather than cartoonish.
const HEART_RING =
  "M 10 17.5 C 10 17.5 0.5 11 0.5 5 C 0.5 1.5 3 0 5.5 0 C 7.3 0 9.5 0.5 10 1.5 " +
  "C 10.5 0.5 12.7 0 14.5 0 C 17 0 19.5 1.5 19.5 5 C 19.5 11 10 17.5 10 17.5 Z " +
  "M 10 13.9 C 10 13.9 4.3 10.0 4.3 6.4 C 4.3 4.3 5.8 3.4 7.3 3.4 " +
  "C 8.38 3.4 9.7 3.7 10 4.3 C 10.3 3.7 11.62 3.4 12.7 3.4 " +
  "C 14.2 3.4 15.7 4.3 15.7 6.4 C 15.7 10.0 10 13.9 10 13.9 Z";

// Shadow + highlight layers, matching the text depth stack
const LAYERS = [
  { dt: 5, dl: 3, color: "rgba(60,38,0,0.55)" },
  { dt: 4, dl: 2, color: "rgba(80,52,0,0.45)" },
  { dt: 3, dl: 1, color: "rgba(110,72,0,0.40)" },
  { dt: 2, dl: 1, color: "rgba(140,96,0,0.32)" },
  { dt: 1, dl: 0, color: "rgba(170,120,0,0.22)" },
  { dt: -1, dl: -1, color: "rgba(255,240,180,0.22)" },
] as const;

const TOP = { dt: 0, dl: 0, color: "#E2B54A" } as const;

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

export function GraffitiTitle({ fontSize = 52, letterSpacing = 9 }: Props) {
  const lineH = fontSize + 10;
  const containerHeight = fontSize + 16;

  // Cinzel O metrics at this font size
  const oAdvance = Math.round(fontSize * 0.72);   // O glyph advance width ≈ cap height
  const oCell = oAdvance + letterSpacing;           // O cell (advance + letter spacing gap)
  const capH = Math.round(fontSize * 0.72);        // cap height
  // Cap top sits at ~16% of lineHeight inside the line box
  const capTop = Math.round(lineH * 0.16);

  const textStyle = {
    fontSize,
    fontFamily: "Cinzel_400Regular",
    letterSpacing,
    lineHeight: lineH,
  } as const;

  // Heart rendered 18% larger, centred on the same cap position
  const heartScale = 1.18;
  const heartW = Math.round(oAdvance * heartScale);
  const heartH = Math.round(capH * heartScale);

  const renderLayer = (dt: number, dl: number, color: string, glow?: boolean) => (
    <React.Fragment key={`${dt}-${dl}`}>
      {/* Heart-O at this layer's offset — slightly enlarged and re-centred */}
      <View
        style={[
          styles.abs,
          {
            top: dt + capTop - Math.round((heartH - capH) / 2),
            left: dl - Math.round((heartW - oAdvance) / 2),
            width: heartW,
            height: heartH,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={heartW} height={heartH} viewBox="0 0 20 18">
          <Path d={HEART_RING} fill={color} fillRule="evenodd" />
        </Svg>
      </View>

      {/* NJJEM text — starts right after the O's cell, never wraps */}
      <Text
        numberOfLines={1}
        style={[
          styles.abs,
          textStyle,
          {
            top: dt,
            left: dl + oCell,
            color,
            ...(glow
              ? {
                  textShadowColor: "rgba(220,170,50,0.55)",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 14,
                }
              : {}),
          },
        ]}
      >
        NJJEM
      </Text>
    </React.Fragment>
  );

  // Approximate total advance width (O cell + NJJEM glyphs + per-char spacing + max shadow offset)
  const njjemAdv = Math.round(fontSize * (0.68 + 0.44 + 0.44 + 0.59 + 0.80));
  const titleWidth = oCell + njjemAdv + letterSpacing * 5 + 8;

  return (
    <View style={{ height: containerHeight, width: titleWidth }}>
      {LAYERS.map(({ dt, dl, color }) => renderLayer(dt, dl, color))}
      {renderLayer(TOP.dt, TOP.dl, TOP.color, true)}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
});
