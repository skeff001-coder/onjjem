import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinear,
  RadialGradient as SvgRadial,
  Stop,
} from "react-native-svg";

// Outer gold frame heart
const OUTER_HEART =
  "M 10 17.5 C 10 17.5 0.5 11 0.5 5 C 0.5 1.5 3 0 5.5 0 C 7.3 0 9.5 0.5 10 1.5 " +
  "C 10.5 0.5 12.7 0 14.5 0 C 17 0 19.5 1.5 19.5 5 C 19.5 11 10 17.5 10 17.5 Z";

// Inner ruby gemstone heart
const INNER_RUBY =
  "M 10 13.9 C 10 13.9 4.3 10.0 4.3 6.4 C 4.3 4.3 5.8 3.4 7.3 3.4 " +
  "C 8.38 3.4 9.7 3.7 10 4.3 C 10.3 3.7 11.62 3.4 12.7 3.4 " +
  "C 14.2 3.4 15.7 4.3 15.7 6.4 C 15.7 10.0 10 13.9 10 13.9 Z";

// Combined for evenodd shadow layers
const HEART_RING = OUTER_HEART + " " + INNER_RUBY;

// Shadow depth layers (bottom-most to front)
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

  const oAdvance = Math.round(fontSize * 0.72);
  const oCell = oAdvance + letterSpacing;
  const capH = Math.round(fontSize * 0.72);
  const capTop = Math.round(lineH * 0.16);

  const textStyle = {
    fontSize,
    fontFamily: "Cinzel_400Regular",
    letterSpacing,
    lineHeight: lineH,
  } as const;

  const heartScale = 1.18;
  const heartW = Math.round(oAdvance * heartScale);
  const heartH = Math.round(capH * heartScale);
  const heartTop = capTop - Math.round((heartH - capH) / 2);
  const heartLeft = -Math.round((heartW - oAdvance) / 2);

  const renderLayer = (dt: number, dl: number, color: string, isTop = false) => (
    <React.Fragment key={`${dt}-${dl}`}>
      {/* Heart-O */}
      <View
        style={[
          styles.abs,
          {
            top: dt + heartTop,
            left: dl + heartLeft,
            width: heartW,
            height: heartH,
          },
        ]}
        pointerEvents="none"
      >
        {isTop ? (
          /* ── Luxurious 3D heart: polished gold frame + ruby gemstone ── */
          <Svg width={heartW} height={heartH} viewBox="0 0 20 18">
            <Defs>
              {/* Gold frame: bright metallic diagonal */}
              <SvgLinear id="gf_goldFrame" x1="0.2" y1="0" x2="0.85" y2="1">
                <Stop offset="0%"   stopColor="#FFF8C0" />
                <Stop offset="14%"  stopColor="#F8D060" />
                <Stop offset="38%"  stopColor="#D4A010" />
                <Stop offset="60%"  stopColor="#B8850C" />
                <Stop offset="80%"  stopColor="#8A6008" />
                <Stop offset="100%" stopColor="#5C3E04" />
              </SvgLinear>
              {/* Gold top-left specular gleam */}
              <SvgRadial id="gf_goldSpec1" cx="30%" cy="20%" r="50%" fx="28%" fy="18%">
                <Stop offset="0%"   stopColor="rgba(255,255,210,0.95)" />
                <Stop offset="40%"  stopColor="rgba(255,240,160,0.45)" />
                <Stop offset="100%" stopColor="rgba(255,220,80,0)" />
              </SvgRadial>
              {/* Gold bottom-right warm bounce */}
              <SvgRadial id="gf_goldSpec2" cx="72%" cy="78%" r="40%" fx="72%" fy="78%">
                <Stop offset="0%"   stopColor="rgba(255,248,190,0.5)" />
                <Stop offset="100%" stopColor="rgba(255,220,80,0)" />
              </SvgRadial>
              {/* Gold edge facet diagonal streak */}
              <SvgLinear id="gf_goldFacet" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%"   stopColor="rgba(255,252,200,0.65)" />
                <Stop offset="45%"  stopColor="rgba(200,155,10,0)" />
                <Stop offset="100%" stopColor="rgba(60,38,0,0.45)" />
              </SvgLinear>

              {/* Ruby base: deep crimson radial, centre lighter */}
              <SvgRadial id="gf_rubyBase" cx="48%" cy="42%" r="58%" fx="44%" fy="36%">
                <Stop offset="0%"   stopColor="#EC3848" />
                <Stop offset="30%"  stopColor="#C8182A" />
                <Stop offset="65%"  stopColor="#96091A" />
                <Stop offset="100%" stopColor="#48040E" />
              </SvgRadial>
              {/* Ruby inner shadow: dark radial from bottom-right → recessed look */}
              <SvgRadial id="gf_rubyInnerShad" cx="64%" cy="70%" r="58%" fx="64%" fy="70%">
                <Stop offset="0%"   stopColor="rgba(0,0,0,0)" />
                <Stop offset="55%"  stopColor="rgba(0,0,0,0.18)" />
                <Stop offset="100%" stopColor="rgba(0,0,0,0.62)" />
              </SvgRadial>
              {/* Ruby primary glint: large soft highlight top-left */}
              <SvgRadial id="gf_rubyGlint1" cx="34%" cy="36%" r="42%" fx="28%" fy="28%">
                <Stop offset="0%"   stopColor="rgba(255,215,225,0.95)" />
                <Stop offset="35%"  stopColor="rgba(255,150,170,0.55)" />
                <Stop offset="100%" stopColor="rgba(255,80,110,0)" />
              </SvgRadial>
              {/* Ruby secondary glint: sharp specular top-right */}
              <SvgRadial id="gf_rubyGlint2" cx="70%" cy="28%" r="20%" fx="70%" fy="28%">
                <Stop offset="0%"   stopColor="rgba(255,245,248,0.82)" />
                <Stop offset="55%"  stopColor="rgba(255,210,220,0.3)" />
                <Stop offset="100%" stopColor="rgba(255,180,200,0)" />
              </SvgRadial>
            </Defs>

            {/* 1. Gold outer heart — metallic gradient base */}
            <Path d={OUTER_HEART} fill="url(#gf_goldFrame)" />
            {/* 2. Top-left specular shine on gold */}
            <Path d={OUTER_HEART} fill="url(#gf_goldSpec1)" />
            {/* 3. Bottom-right warm gold bounce light */}
            <Path d={OUTER_HEART} fill="url(#gf_goldSpec2)" />
            {/* 4. Diagonal edge facet streak */}
            <Path d={OUTER_HEART} fill="url(#gf_goldFacet)" opacity={0.55} />
            {/* 5. Dark backing for ruby (defines inner border) */}
            <Path d={INNER_RUBY} fill="rgba(25,3,7,0.9)" />
            {/* 6. Ruby gemstone base gradient */}
            <Path d={INNER_RUBY} fill="url(#gf_rubyBase)" />
            {/* 7. Inner shadow → recessed into gold frame */}
            <Path d={INNER_RUBY} fill="url(#gf_rubyInnerShad)" />
            {/* 8. Primary large soft glint */}
            <Path d={INNER_RUBY} fill="url(#gf_rubyGlint1)" />
            {/* 9. Sharp secondary specular glint */}
            <Path d={INNER_RUBY} fill="url(#gf_rubyGlint2)" />
            {/* 10. Crisp outline to define gold frame border */}
            <Path d={OUTER_HEART} fill="none" stroke="rgba(50,28,0,0.55)" strokeWidth={0.3} />
            {/* 11. Thin ruby bezel outline */}
            <Path d={INNER_RUBY} fill="none" stroke="rgba(90,4,12,0.6)" strokeWidth={0.18} />
          </Svg>
        ) : (
          /* Shadow layer: simple flat evenodd ring */
          <Svg width={heartW} height={heartH} viewBox="0 0 20 18">
            <Path d={HEART_RING} fill={color} fillRule="evenodd" />
          </Svg>
        )}
      </View>

      {/* NJJEM text at this depth layer */}
      <Text
        numberOfLines={1}
        style={[
          styles.abs,
          textStyle,
          {
            top: dt,
            left: dl + oCell,
            color,
            ...(isTop
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

  const nAdv = Math.round(fontSize * 0.76);
  const jAdv = Math.round(fontSize * 0.54);
  const eAdv = Math.round(fontSize * 0.66);
  const mAdv = Math.round(fontSize * 0.94);
  const njjemAdv = nAdv + jAdv + jAdv + eAdv + mAdv;
  const titleWidth = oCell + njjemAdv + letterSpacing * 5 + 24;

  return (
    <View style={{ height: containerHeight, width: titleWidth }}>
      {LAYERS.map(({ dt, dl, color }) => renderLayer(dt, dl, color, false))}
      {renderLayer(TOP.dt, TOP.dl, TOP.color, true)}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
});
