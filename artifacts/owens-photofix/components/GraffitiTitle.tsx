import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinear,
  RadialGradient as SvgRadial,
  Stop,
  ClipPath,
} from "react-native-svg";

// ── Heart paths ──────────────────────────────────────────────────────────────
const OUTER_HEART =
  "M 10 17.5 C 10 17.5 0.5 11 0.5 5 C 0.5 1.5 3 0 5.5 0 C 7.3 0 9.5 0.5 10 1.5 " +
  "C 10.5 0.5 12.7 0 14.5 0 C 17 0 19.5 1.5 19.5 5 C 19.5 11 10 17.5 10 17.5 Z";
const INNER_RUBY =
  "M 10 13.9 C 10 13.9 4.3 10.0 4.3 6.4 C 4.3 4.3 5.8 3.4 7.3 3.4 " +
  "C 8.38 3.4 9.7 3.7 10 4.3 C 10.3 3.7 11.62 3.4 12.7 3.4 " +
  "C 14.2 3.4 15.7 4.3 15.7 6.4 C 15.7 10.0 10 13.9 10 13.9 Z";
const HEART_RING = OUTER_HEART + " " + INNER_RUBY;

// ── Ruby facet paths ─────────────────────────────────────────────────────────
const FACET_CROWN  = "M 10 4.3 L 5.8 6.8 L 14.2 6.8 Z";
const FACET_LEFT   = "M 4.5 7.2 L 8.5 6.6 L 7.8 10.5 Z";
const FACET_RIGHT  = "M 15.5 7.2 L 11.5 6.6 L 12.2 10.5 Z";
const FACET_CENTRE = "M 10 4.3 L 5.8 6.8 L 10 13.9 L 14.2 6.8 Z";

// ── Text layer definitions ───────────────────────────────────────────────────
const BORDER_OFFSETS: Array<[number, number]> = [
  [-2, 0], [2, 0], [0, -2], [0, 2],
  [-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5],
];
const BORDER_COLOR = "#2E1A00";

const DEPTH_LAYERS = [
  { dt: 5, dl: 3, color: "#3A2200" },
  { dt: 4, dl: 2, color: "#5A3600" },
  { dt: 3, dl: 2, color: "#7A4E04" },
  { dt: 2, dl: 1, color: "#9A6A08" },
  { dt: 1, dl: 1, color: "#B8840C" },
  { dt: 1, dl: 0, color: "#C99010" },
] as const;

// Heart-specific depth layers — dark crimson for ruby rim extrusion
const HEART_DEPTH_LAYERS = [
  { dt: 5, dl: 3, color: "#2A0008" },
  { dt: 4, dl: 2, color: "#450010" },
  { dt: 3, dl: 2, color: "#620018" },
  { dt: 2, dl: 1, color: "#820025" },
  { dt: 1, dl: 1, color: "#9E0030" },
  { dt: 1, dl: 0, color: "#B80038" },
] as const;

const TOP_COLOR = "#F0CA2A";

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

export function GraffitiTitle({ fontSize = 52, letterSpacing = 9 }: Props) {
  const lineH    = fontSize + 10;
  const containerHeight = fontSize + 20;

  const oAdvance = Math.round(fontSize * 0.70);
  const oCell    = oAdvance + letterSpacing;
  const capH     = Math.round(fontSize * 0.70);
  const capTop   = Math.round(lineH * 0.16);

  const textStyle = {
    fontSize,
    fontFamily: "Cinzel_700Bold",
    letterSpacing,
    lineHeight: lineH,
  } as const;

  // Heart scaled to fill the O bowl — 68 % of cell width gives a prominent gem
  const heartScale = 0.68;
  const heartW     = Math.round(oAdvance * heartScale);
  const heartH     = Math.round(capH     * heartScale);
  // Centre the heart within the O bowl.
  // +2 px rightward nudge accounts for Cinzel Bold's left sidebearing on "O"
  const heartTop   = capTop + Math.round((capH - heartH) / 2);
  const heartLeft  = Math.round((oAdvance - heartW) / 2) + 2;

  // ── Rich 3D heart (top face — ruby red outer, ruby gem inner) ─────────────
  const renderRichHeart = () => (
    <View
      style={[styles.abs, { top: heartTop, left: heartLeft, width: heartW, height: heartH }]}
      pointerEvents="none"
    >
      <Svg width={heartW} height={heartH} viewBox="0 0 20 18">
        <Defs>
          {/* Ruby red outer heart gradients */}
          <SvgRadial id="gf_outerBase" cx="40%" cy="35%" r="75%" fx="35%" fy="28%">
            <Stop offset="0%"   stopColor="#F03050" />
            <Stop offset="25%"  stopColor="#CC0E28" />
            <Stop offset="55%"  stopColor="#8A0418" />
            <Stop offset="100%" stopColor="#350208" />
          </SvgRadial>
          <SvgRadial id="gf_outerBevelHi" cx="28%" cy="20%" r="48%" fx="22%" fy="14%">
            <Stop offset="0%"   stopColor="rgba(255,200,215,0.88)" />
            <Stop offset="35%"  stopColor="rgba(255,140,165,0.45)" />
            <Stop offset="70%"  stopColor="rgba(255,90,120,0.15)" />
            <Stop offset="100%" stopColor="rgba(255,60,90,0)" />
          </SvgRadial>
          <SvgRadial id="gf_outerShadow" cx="50%" cy="92%" r="52%" fx="50%" fy="92%">
            <Stop offset="0%"   stopColor="rgba(40,0,8,0.65)" />
            <Stop offset="100%" stopColor="rgba(40,0,8,0)" />
          </SvgRadial>
          {/* Inner ruby gem gradients */}
          <SvgRadial id="gf_rubyBase" cx="50%" cy="38%" r="60%" fx="46%" fy="32%">
            <Stop offset="0%"   stopColor="#F0203A" />
            <Stop offset="28%"  stopColor="#C8102A" />
            <Stop offset="60%"  stopColor="#8E0518" />
            <Stop offset="100%" stopColor="#3A0208" />
          </SvgRadial>
          <SvgLinear id="gf_rubyCrown" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%"   stopColor="rgba(255,90,110,0.55)" />
            <Stop offset="45%"  stopColor="rgba(220,30,55,0.18)" />
            <Stop offset="100%" stopColor="rgba(150,0,20,0)" />
          </SvgLinear>
          <SvgRadial id="gf_innerShad" cx="54%" cy="65%" r="60%" fx="54%" fy="65%">
            <Stop offset="0%"   stopColor="rgba(0,0,0,0)" />
            <Stop offset="50%"  stopColor="rgba(0,0,0,0.15)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.68)" />
          </SvgRadial>
          <SvgRadial id="gf_glint1" cx="36%" cy="36%" r="44%" fx="28%" fy="26%">
            <Stop offset="0%"   stopColor="rgba(255,220,230,0.96)" />
            <Stop offset="32%"  stopColor="rgba(255,155,175,0.58)" />
            <Stop offset="70%"  stopColor="rgba(255,80,110,0.18)" />
            <Stop offset="100%" stopColor="rgba(255,40,80,0)" />
          </SvgRadial>
          <SvgRadial id="gf_glint2" cx="69%" cy="30%" r="18%" fx="69%" fy="30%">
            <Stop offset="0%"   stopColor="rgba(255,248,252,0.88)" />
            <Stop offset="50%"  stopColor="rgba(255,210,225,0.4)" />
            <Stop offset="100%" stopColor="rgba(255,180,200,0)" />
          </SvgRadial>
          <SvgRadial id="gf_glint3" cx="50%" cy="20%" r="12%" fx="50%" fy="20%">
            <Stop offset="0%"   stopColor="rgba(255,255,255,0.72)" />
            <Stop offset="100%" stopColor="rgba(255,200,215,0)" />
          </SvgRadial>
          <ClipPath id="gf_rubyClip">
            <Path d={INNER_RUBY} />
          </ClipPath>
        </Defs>
        {/* Outer heart — ruby red */}
        <Path d={OUTER_HEART} fill="url(#gf_outerBase)" />
        <Path d={OUTER_HEART} fill="url(#gf_outerBevelHi)" />
        <Path d={OUTER_HEART} fill="url(#gf_outerShadow)" />
        <Path d={OUTER_HEART} fill="none" stroke="rgba(80,0,15,0.75)" strokeWidth={0.65} />
        <Path d={OUTER_HEART} fill="none" stroke="rgba(255,120,145,0.30)" strokeWidth={0.4} />
        {/* Dark separator ring — makes the inner gem stand out clearly */}
        <Path d={HEART_RING} fill="rgba(12,0,3,0.90)" fillRule="evenodd" />
        {/* Inner ruby gem */}
        <Path d={INNER_RUBY} fill="rgba(18,2,5,0.92)" />
        <Path d={INNER_RUBY} fill="url(#gf_rubyBase)" />
        <Path d={INNER_RUBY} fill="url(#gf_rubyCrown)" clipPath="url(#gf_rubyClip)" />
        <Path d={FACET_CROWN}  fill="rgba(255,110,135,0.28)" clipPath="url(#gf_rubyClip)" />
        <Path d={FACET_LEFT}   fill="rgba(220,60,85,0.22)"   clipPath="url(#gf_rubyClip)" />
        <Path d={FACET_RIGHT}  fill="rgba(80,0,12,0.28)"     clipPath="url(#gf_rubyClip)" />
        <Path d={FACET_CENTRE} fill="rgba(0,0,0,0.10)"       clipPath="url(#gf_rubyClip)" />
        <Path d={INNER_RUBY} fill="url(#gf_innerShad)" />
        <Path d={INNER_RUBY} fill="url(#gf_glint1)" clipPath="url(#gf_rubyClip)" />
        <Path d={INNER_RUBY} fill="url(#gf_glint2)" clipPath="url(#gf_rubyClip)" />
        <Path d={INNER_RUBY} fill="url(#gf_glint3)" clipPath="url(#gf_rubyClip)" />
        <Path d={INNER_RUBY} fill="none" stroke="rgba(70,2,10,0.65)" strokeWidth={0.22} />
        <Path d={INNER_RUBY} fill="none" stroke="rgba(255,120,145,0.30)" strokeWidth={0.15} />
      </Svg>
    </View>
  );

  // ── Shadow heart (crimson depth layers behind the rich heart) ──────────────
  const renderShadowHeart = (dt: number, dl: number, color: string) => (
    <View
      key={`sh-${dt}-${dl}`}
      style={[styles.abs, { top: dt + heartTop, left: dl + heartLeft, width: heartW, height: heartH }]}
      pointerEvents="none"
    >
      <Svg width={heartW} height={heartH} viewBox="0 0 20 18">
        <Path d={HEART_RING} fill={color} fillRule="evenodd" />
      </Svg>
    </View>
  );

  // ── Text rendering — renders full "ONJJEM" so the O is visible in gold ─────
  const renderText = (
    dt: number,
    dl: number,
    color: string,
    key: string,
    glow = false,
  ) => (
    <Text
      key={key}
      numberOfLines={1}
      style={[
        styles.abs,
        textStyle,
        {
          top: dt,
          left: dl,
          color,
          ...(glow
            ? {
                textShadowColor: "rgba(240,200,42,0.7)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
              }
            : {}),
        },
      ]}
    >
      ONJJEM
    </Text>
  );

  const nAdv = Math.round(fontSize * 0.75);
  const jAdv = Math.round(fontSize * 0.50);
  const eAdv = Math.round(fontSize * 0.65);
  const mAdv = Math.round(fontSize * 0.90);
  const titleWidth = oCell + nAdv + jAdv + jAdv + eAdv + mAdv + letterSpacing * 5 + 32;

  return (
    <View style={{ height: containerHeight, width: titleWidth, overflow: "visible" }}>
      {/* ── 1. Thick dark border outline (8 directions) ── */}
      {BORDER_OFFSETS.map(([dl, dt], i) =>
        renderText(dt, dl, BORDER_COLOR, `border-${i}`),
      )}

      {/* ── 2. 3D extrusion depth layers (text + heart shadow) ── */}
      {DEPTH_LAYERS.map(({ dt, dl, color }, i) => (
        <React.Fragment key={`depth-${dt}-${dl}`}>
          {renderShadowHeart(dt, dl, HEART_DEPTH_LAYERS[i].color)}
          {renderText(dt, dl, color, `depth-t-${dt}-${dl}`)}
        </React.Fragment>
      ))}

      {/* ── 3. Rich jewel heart (top face) ── */}
      {renderRichHeart()}

      {/* ── 4. Bright gold top face text ── */}
      {renderText(0, 0, TOP_COLOR, "top", true)}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
});
