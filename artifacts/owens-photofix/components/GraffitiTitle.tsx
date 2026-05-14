import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinear,
  RadialGradient as SvgRadial,
  Stop,
  ClipPath,
  Rect,
} from "react-native-svg";

// ── Heart paths ──────────────────────────────────────────────────────────────
// Outer heart (the full gold frame shape)
const OUTER_HEART =
  "M 10 17.5 C 10 17.5 0.5 11 0.5 5 C 0.5 1.5 3 0 5.5 0 C 7.3 0 9.5 0.5 10 1.5 " +
  "C 10.5 0.5 12.7 0 14.5 0 C 17 0 19.5 1.5 19.5 5 C 19.5 11 10 17.5 10 17.5 Z";

// Inner ruby gem (slightly smaller, sitting inside the gold frame)
const INNER_RUBY =
  "M 10 13.9 C 10 13.9 4.3 10.0 4.3 6.4 C 4.3 4.3 5.8 3.4 7.3 3.4 " +
  "C 8.38 3.4 9.7 3.7 10 4.3 C 10.3 3.7 11.62 3.4 12.7 3.4 " +
  "C 14.2 3.4 15.7 4.3 15.7 6.4 C 15.7 10.0 10 13.9 10 13.9 Z";

// Evenodd ring — used only on depth-shadow layers
const HEART_RING = OUTER_HEART + " " + INNER_RUBY;

// ── Facet paths (within the inner ruby boundary, viewBox 0 0 20 18) ──────────
// Upper crown facet — bright, top half
const FACET_CROWN  = "M 10 4.3 L 5.8 6.8 L 14.2 6.8 Z";
// Left pavilion facet — mid-dark
const FACET_LEFT   = "M 4.5 7.2 L 8.5 6.6 L 7.8 10.5 Z";
// Right pavilion facet — mid-dark (symmetrical)
const FACET_RIGHT  = "M 15.5 7.2 L 11.5 6.6 L 12.2 10.5 Z";
// Centre kite — medium value
const FACET_CENTRE = "M 10 4.3 L 5.8 6.8 L 10 13.9 L 14.2 6.8 Z";

// ── Depth / shadow layers ────────────────────────────────────────────────────
const LAYERS = [
  { dt: 5, dl: 3, color: "rgba(60,38,0,0.55)" },
  { dt: 4, dl: 2, color: "rgba(80,52,0,0.45)" },
  { dt: 3, dl: 1, color: "rgba(110,72,0,0.40)" },
  { dt: 2, dl: 1, color: "rgba(140,96,0,0.32)" },
  { dt: 1, dl: 0, color: "rgba(170,120,0,0.22)" },
  { dt: -1, dl: -1, color: "rgba(255,240,180,0.22)" },
] as const;

const TOP = { dt: 0, dl: 0 } as const;

interface Props {
  fontSize?: number;
  letterSpacing?: number;
}

export function GraffitiTitle({ fontSize = 52, letterSpacing = 9 }: Props) {
  const lineH = fontSize + 10;
  const containerHeight = fontSize + 16;

  const oAdvance = Math.round(fontSize * 0.72);
  const oCell    = oAdvance + letterSpacing;
  const capH     = Math.round(fontSize * 0.72);
  const capTop   = Math.round(lineH * 0.16);

  const textStyle = {
    fontSize,
    fontFamily: "PlayfairDisplay_900Black",
    letterSpacing,
    lineHeight: lineH,
  } as const;

  // Heart is 30% larger than the O glyph so it really reads as an icon
  const heartScale = 1.30;
  const heartW     = Math.round(oAdvance * heartScale);
  const heartH     = Math.round(capH     * heartScale);
  const heartTop   = capTop - Math.round((heartH - capH) / 2);
  const heartLeft  = -Math.round((heartW - oAdvance) / 2);

  /* ── Shadow-layer heart: flat evenodd ring ──────────────────────────────── */
  const renderShadowHeart = (dt: number, dl: number, color: string) => (
    <View
      key={`h-${dt}-${dl}`}
      style={[styles.abs, { top: dt + heartTop, left: dl + heartLeft, width: heartW, height: heartH }]}
      pointerEvents="none"
    >
      <Svg width={heartW} height={heartH} viewBox="0 0 20 18">
        <Path d={HEART_RING} fill={color} fillRule="evenodd" />
      </Svg>
    </View>
  );

  /* ── Rich top-face heart ────────────────────────────────────────────────── */
  const renderRichHeart = () => (
    <View
      style={[styles.abs, { top: heartTop, left: heartLeft, width: heartW, height: heartH }]}
      pointerEvents="none"
    >
      <Svg width={heartW} height={heartH} viewBox="0 0 20 18">
        <Defs>
          {/* ── GOLD frame gradients ── */}
          {/* Base metallic: light top-left, dark bottom-right */}
          <SvgLinear id="gf_base" x1="0.1" y1="0" x2="0.95" y2="1">
            <Stop offset="0%"   stopColor="#FFF6B8" />
            <Stop offset="12%"  stopColor="#F7CC50" />
            <Stop offset="35%"  stopColor="#D9A814" />
            <Stop offset="58%"  stopColor="#B8880C" />
            <Stop offset="78%"  stopColor="#8A6208" />
            <Stop offset="100%" stopColor="#513B03" />
          </SvgLinear>
          {/* Bright bevel highlight — top-left strong specular */}
          <SvgRadial id="gf_bevelHi" cx="28%" cy="18%" r="52%" fx="22%" fy="12%">
            <Stop offset="0%"   stopColor="rgba(255,255,230,0.98)" />
            <Stop offset="30%"  stopColor="rgba(255,248,190,0.65)" />
            <Stop offset="65%"  stopColor="rgba(255,235,140,0.20)" />
            <Stop offset="100%" stopColor="rgba(255,220,80,0)" />
          </SvgRadial>
          {/* Secondary warm glow lower-right */}
          <SvgRadial id="gf_bevelLo" cx="74%" cy="80%" r="38%" fx="74%" fy="80%">
            <Stop offset="0%"   stopColor="rgba(255,245,185,0.55)" />
            <Stop offset="100%" stopColor="rgba(255,210,80,0)" />
          </SvgRadial>
          {/* Diagonal edge facet streak */}
          <SvgLinear id="gf_facetStreak" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="rgba(255,252,200,0.72)" />
            <Stop offset="42%"  stopColor="rgba(200,155,10,0)" />
            <Stop offset="100%" stopColor="rgba(55,34,0,0.48)" />
          </SvgLinear>
          {/* Dark shadow vignette bottom */}
          <SvgRadial id="gf_shadow" cx="50%" cy="95%" r="55%" fx="50%" fy="95%">
            <Stop offset="0%"   stopColor="rgba(30,15,0,0.55)" />
            <Stop offset="100%" stopColor="rgba(30,15,0,0)" />
          </SvgRadial>

          {/* ── RUBY gem gradients ── */}
          {/* Base deep crimson — bright ruby at top-centre, almost black at edges */}
          <SvgRadial id="gf_rubyBase" cx="50%" cy="38%" r="60%" fx="46%" fy="32%">
            <Stop offset="0%"   stopColor="#F0203A" />
            <Stop offset="28%"  stopColor="#C8102A" />
            <Stop offset="60%"  stopColor="#8E0518" />
            <Stop offset="100%" stopColor="#3A0208" />
          </SvgRadial>
          {/* Crown facet overlay — brighter upper zone */}
          <SvgLinear id="gf_rubyCrown" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%"   stopColor="rgba(255,90,110,0.55)" />
            <Stop offset="45%"  stopColor="rgba(220,30,55,0.18)" />
            <Stop offset="100%" stopColor="rgba(150,0,20,0)" />
          </SvgLinear>
          {/* Inner shadow — recessed into gold frame, dark at perimeter */}
          <SvgRadial id="gf_innerShad" cx="54%" cy="65%" r="60%" fx="54%" fy="65%">
            <Stop offset="0%"   stopColor="rgba(0,0,0,0)" />
            <Stop offset="50%"  stopColor="rgba(0,0,0,0.15)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.68)" />
          </SvgRadial>
          {/* Primary glint: large soft bloom top-left */}
          <SvgRadial id="gf_glint1" cx="36%" cy="36%" r="44%" fx="28%" fy="26%">
            <Stop offset="0%"   stopColor="rgba(255,220,230,0.96)" />
            <Stop offset="32%"  stopColor="rgba(255,155,175,0.58)" />
            <Stop offset="70%"  stopColor="rgba(255,80,110,0.18)" />
            <Stop offset="100%" stopColor="rgba(255,40,80,0)" />
          </SvgRadial>
          {/* Secondary glint: sharp pinpoint top-right */}
          <SvgRadial id="gf_glint2" cx="69%" cy="30%" r="18%" fx="69%" fy="30%">
            <Stop offset="0%"   stopColor="rgba(255,248,252,0.88)" />
            <Stop offset="50%"  stopColor="rgba(255,210,225,0.4)" />
            <Stop offset="100%" stopColor="rgba(255,180,200,0)" />
          </SvgRadial>
          {/* Third tiny glint near notch */}
          <SvgRadial id="gf_glint3" cx="50%" cy="20%" r="12%" fx="50%" fy="20%">
            <Stop offset="0%"   stopColor="rgba(255,255,255,0.72)" />
            <Stop offset="100%" stopColor="rgba(255,200,215,0)" />
          </SvgRadial>

          {/* ClipPath: restrict facet/glint paints to inside the ruby boundary */}
          <ClipPath id="gf_rubyClip">
            <Path d={INNER_RUBY} />
          </ClipPath>
        </Defs>

        {/* ════════════ GOLD FRAME ════════════ */}
        {/* 1. Base metallic gradient */}
        <Path d={OUTER_HEART} fill="url(#gf_base)" />
        {/* 2. Top-left bevel highlight */}
        <Path d={OUTER_HEART} fill="url(#gf_bevelHi)" />
        {/* 3. Lower-right warm bounce */}
        <Path d={OUTER_HEART} fill="url(#gf_bevelLo)" />
        {/* 4. Diagonal facet streak */}
        <Path d={OUTER_HEART} fill="url(#gf_facetStreak)" opacity={0.55} />
        {/* 5. Bottom shadow vignette */}
        <Path d={OUTER_HEART} fill="url(#gf_shadow)" />
        {/* 6. Thin bright inner-edge bevel rim (simulates raised gold lip) */}
        <Path d={OUTER_HEART} fill="none"
          stroke="rgba(255,248,180,0.75)" strokeWidth={0.65} />
        {/* 7. Outer dark border */}
        <Path d={OUTER_HEART} fill="none"
          stroke="rgba(45,25,0,0.6)" strokeWidth={0.4} />

        {/* ════════════ RUBY GEM ════════════ */}
        {/* 8. Dark backing / bezel */}
        <Path d={INNER_RUBY} fill="rgba(18,2,5,0.92)" />
        {/* 9. Ruby base crimson radial */}
        <Path d={INNER_RUBY} fill="url(#gf_rubyBase)" />
        {/* 10. Crown (upper) facet brightener */}
        <Path d={INNER_RUBY} fill="url(#gf_rubyCrown)" clipPath="url(#gf_rubyClip)" />
        {/* 11. Geometric crown facet triangle — lighter upper face */}
        <Path d={FACET_CROWN} fill="rgba(255,110,135,0.28)" clipPath="url(#gf_rubyClip)" />
        {/* 12. Left pavilion facet — slightly lighter */}
        <Path d={FACET_LEFT}  fill="rgba(220,60,85,0.22)"  clipPath="url(#gf_rubyClip)" />
        {/* 13. Right pavilion facet — darker (opposite to light source) */}
        <Path d={FACET_RIGHT} fill="rgba(80,0,12,0.28)"    clipPath="url(#gf_rubyClip)" />
        {/* 14. Centre kite — medium depth */}
        <Path d={FACET_CENTRE} fill="rgba(0,0,0,0.10)"     clipPath="url(#gf_rubyClip)" />
        {/* 15. Inner shadow — recessed into gold */}
        <Path d={INNER_RUBY} fill="url(#gf_innerShad)" />
        {/* 16. Primary large soft glint */}
        <Path d={INNER_RUBY} fill="url(#gf_glint1)" clipPath="url(#gf_rubyClip)" />
        {/* 17. Sharp secondary specular */}
        <Path d={INNER_RUBY} fill="url(#gf_glint2)" clipPath="url(#gf_rubyClip)" />
        {/* 18. Third tiny glint at notch */}
        <Path d={INNER_RUBY} fill="url(#gf_glint3)" clipPath="url(#gf_rubyClip)" />
        {/* 19. Ruby bezel outline */}
        <Path d={INNER_RUBY} fill="none"
          stroke="rgba(70,2,10,0.65)" strokeWidth={0.22} />
        {/* 20. Thin bright ruby rim (gem appears to catch gold light) */}
        <Path d={INNER_RUBY} fill="none"
          stroke="rgba(255,120,145,0.30)" strokeWidth={0.15} />
      </Svg>
    </View>
  );

  /* ── Text layer ─────────────────────────────────────────────────────────── */
  const renderText = (dt: number, dl: number, color: string, isTop = false) => (
    <Text
      key={`t-${dt}-${dl}`}
      numberOfLines={1}
      style={[
        styles.abs,
        textStyle,
        {
          top: dt,
          left: dl + oCell,
          color,
          ...(isTop ? {
            textShadowColor: "rgba(220,170,50,0.55)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 14,
          } : {}),
        },
      ]}
    >
      NJJEM
    </Text>
  );

  const nAdv = Math.round(fontSize * 0.76);
  const jAdv = Math.round(fontSize * 0.54);
  const eAdv = Math.round(fontSize * 0.66);
  const mAdv = Math.round(fontSize * 0.94);
  const titleWidth = oCell + nAdv + jAdv + jAdv + eAdv + mAdv + letterSpacing * 5 + 24;

  return (
    <View style={{ height: containerHeight, width: titleWidth }}>
      {/* Shadow depth layers — hearts + text */}
      {LAYERS.map(({ dt, dl, color }) => (
        <React.Fragment key={`layer-${dt}-${dl}`}>
          {renderShadowHeart(dt, dl, color)}
          {renderText(dt, dl, color)}
        </React.Fragment>
      ))}
      {/* Top face — rich heart + gold text */}
      {renderRichHeart()}
      {renderText(TOP.dt, TOP.dl, "#E2B54A", true)}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
});
