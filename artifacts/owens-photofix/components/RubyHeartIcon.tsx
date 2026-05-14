import React from "react";
import { View } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  LinearGradient as SvgLinear,
  Path,
  RadialGradient as SvgRadial,
  Stop,
} from "react-native-svg";

// ── Paths in a 100×100 viewBox for maximum detail at any size ────────────────
const OUTER =
  "M 50 92 C 50 92 2 58 2 26 C 2 8 14 1 27 1 C 36 1 47 4 50 9 " +
  "C 53 4 64 1 73 1 C 86 1 98 8 98 26 C 98 58 50 92 50 92 Z";

const INNER =
  "M 50 74 C 50 74 20 56 20 34 C 20 22 28 17 36 17 " +
  "C 42 17 48 19 50 23 C 52 19 58 17 64 17 " +
  "C 72 17 80 22 80 34 C 80 56 50 74 50 74 Z";

// Facet geometry within the ruby (viewBox 100×100)
const F_CROWN   = "M 50 23 L 28 36 L 72 36 Z";              // upper crown triangle
const F_L_PAV   = "M 20 37 L 42 34 L 38 55 Z";              // left pavilion
const F_R_PAV   = "M 80 37 L 58 34 L 62 55 Z";              // right pavilion
const F_KITE    = "M 50 23 L 28 36 L 50 74 L 72 36 Z";      // centre kite

interface Props {
  size?: number;
}

export function RubyHeartIcon({ size = 56 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        shadowColor: "#C9960C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.65,
        shadowRadius: 12,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* ── GOLD FRAME ── */}
          {/* Base metallic diagonal: cream highlight top-left → deep amber bottom-right */}
          <SvgLinear id="rhi_goldBase" x1="0.15" y1="0" x2="0.9" y2="1">
            <Stop offset="0%"   stopColor="#FFF8B8" />
            <Stop offset="10%"  stopColor="#F8D055" />
            <Stop offset="32%"  stopColor="#D4A010" />
            <Stop offset="55%"  stopColor="#B8850C" />
            <Stop offset="76%"  stopColor="#8A6008" />
            <Stop offset="100%" stopColor="#4E3402" />
          </SvgLinear>
          {/* Top-left bevel specular: large soft bloom */}
          <SvgRadial id="rhi_goldSpec1" cx="28%" cy="18%" r="50%" fx="22%" fy="12%">
            <Stop offset="0%"   stopColor="rgba(255,255,228,0.98)" />
            <Stop offset="28%"  stopColor="rgba(255,248,185,0.68)" />
            <Stop offset="60%"  stopColor="rgba(255,235,130,0.22)" />
            <Stop offset="100%" stopColor="rgba(255,215,70,0)" />
          </SvgRadial>
          {/* Bottom-right warm secondary bounce */}
          <SvgRadial id="rhi_goldSpec2" cx="74%" cy="80%" r="38%" fx="74%" fy="80%">
            <Stop offset="0%"   stopColor="rgba(255,248,190,0.55)" />
            <Stop offset="100%" stopColor="rgba(255,215,70,0)" />
          </SvgRadial>
          {/* Diagonal edge-facet streak (upper-left bright → lower-right dark) */}
          <SvgLinear id="rhi_goldFacet" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="rgba(255,252,200,0.72)" />
            <Stop offset="40%"  stopColor="rgba(200,155,10,0)" />
            <Stop offset="100%" stopColor="rgba(50,30,0,0.48)" />
          </SvgLinear>
          {/* Bottom vignette shadow (frame depth) */}
          <SvgRadial id="rhi_goldShad" cx="50%" cy="96%" r="55%">
            <Stop offset="0%"   stopColor="rgba(28,14,0,0.55)" />
            <Stop offset="100%" stopColor="rgba(28,14,0,0)" />
          </SvgRadial>

          {/* ── RUBY GEM ── */}
          {/* Base: deep crimson core brightening toward top-centre */}
          <SvgRadial id="rhi_rubyBase" cx="50%" cy="36%" r="62%" fx="46%" fy="30%">
            <Stop offset="0%"   stopColor="#F02040" />
            <Stop offset="26%"  stopColor="#C8101E" />
            <Stop offset="58%"  stopColor="#8E0514" />
            <Stop offset="100%" stopColor="#38020A" />
          </SvgRadial>
          {/* Crown brightener: upper half lighter */}
          <SvgLinear id="rhi_rubyCrown" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%"   stopColor="rgba(255,80,105,0.55)" />
            <Stop offset="42%"  stopColor="rgba(220,25,50,0.18)" />
            <Stop offset="100%" stopColor="rgba(140,0,18,0)" />
          </SvgLinear>
          {/* Inner shadow: dark radial from bottom-right → recessed into gold */}
          <SvgRadial id="rhi_rubyInnerShad" cx="58%" cy="68%" r="62%" fx="58%" fy="68%">
            <Stop offset="0%"   stopColor="rgba(0,0,0,0)" />
            <Stop offset="48%"  stopColor="rgba(0,0,0,0.18)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.70)" />
          </SvgRadial>
          {/* Primary glint: large soft bloom top-left */}
          <SvgRadial id="rhi_glint1" cx="35%" cy="34%" r="45%" fx="26%" fy="24%">
            <Stop offset="0%"   stopColor="rgba(255,218,228,0.96)" />
            <Stop offset="30%"  stopColor="rgba(255,148,170,0.58)" />
            <Stop offset="68%"  stopColor="rgba(255,75,108,0.18)" />
            <Stop offset="100%" stopColor="rgba(255,35,75,0)" />
          </SvgRadial>
          {/* Secondary glint: sharp pinpoint top-right */}
          <SvgRadial id="rhi_glint2" cx="70%" cy="28%" r="18%" fx="70%" fy="28%">
            <Stop offset="0%"   stopColor="rgba(255,248,252,0.90)" />
            <Stop offset="48%"  stopColor="rgba(255,208,222,0.40)" />
            <Stop offset="100%" stopColor="rgba(255,175,198,0)" />
          </SvgRadial>
          {/* Third micro-glint at notch */}
          <SvgRadial id="rhi_glint3" cx="50%" cy="18%" r="11%">
            <Stop offset="0%"   stopColor="rgba(255,255,255,0.75)" />
            <Stop offset="100%" stopColor="rgba(255,198,212,0)" />
          </SvgRadial>

          {/* ClipPath: keep all gem paint inside the ruby boundary */}
          <ClipPath id="rhi_rubyClip">
            <Path d={INNER} />
          </ClipPath>
        </Defs>

        {/* ════════════ GOLD FRAME ════════════ */}
        {/* 1. Metallic base */}
        <Path d={OUTER} fill="url(#rhi_goldBase)" />
        {/* 2. Top-left specular bloom */}
        <Path d={OUTER} fill="url(#rhi_goldSpec1)" />
        {/* 3. Bottom-right warm bounce */}
        <Path d={OUTER} fill="url(#rhi_goldSpec2)" />
        {/* 4. Diagonal edge-facet */}
        <Path d={OUTER} fill="url(#rhi_goldFacet)" opacity={0.55} />
        {/* 5. Bottom depth shadow */}
        <Path d={OUTER} fill="url(#rhi_goldShad)" />
        {/* 6. Bright inner bevel rim (raised gold lip) */}
        <Path d={OUTER} fill="none" stroke="rgba(255,248,175,0.78)" strokeWidth={1.8} />
        {/* 7. Dark outer border for definition */}
        <Path d={OUTER} fill="none" stroke="rgba(42,22,0,0.62)" strokeWidth={1.2} />

        {/* ════════════ RUBY GEM ════════════ */}
        {/* 8. Dark backing / deep bezel */}
        <Path d={INNER} fill="rgba(16,1,4,0.94)" />
        {/* 9. Ruby base crimson radial */}
        <Path d={INNER} fill="url(#rhi_rubyBase)" />
        {/* 10. Crown brightener */}
        <Path d={INNER} fill="url(#rhi_rubyCrown)" clipPath="url(#rhi_rubyClip)" />
        {/* 11. Crown facet triangle */}
        <Path d={F_CROWN}  fill="rgba(255,105,130,0.28)" clipPath="url(#rhi_rubyClip)" />
        {/* 12. Left pavilion facet */}
        <Path d={F_L_PAV}  fill="rgba(220,55,82,0.22)"   clipPath="url(#rhi_rubyClip)" />
        {/* 13. Right pavilion facet (opposite light, darker) */}
        <Path d={F_R_PAV}  fill="rgba(72,0,10,0.28)"     clipPath="url(#rhi_rubyClip)" />
        {/* 14. Centre kite (medium depth) */}
        <Path d={F_KITE}   fill="rgba(0,0,0,0.09)"       clipPath="url(#rhi_rubyClip)" />
        {/* 15. Inner shadow — recessed look */}
        <Path d={INNER} fill="url(#rhi_rubyInnerShad)" />
        {/* 16. Primary large soft glint */}
        <Path d={INNER} fill="url(#rhi_glint1)" clipPath="url(#rhi_rubyClip)" />
        {/* 17. Sharp secondary specular */}
        <Path d={INNER} fill="url(#rhi_glint2)" clipPath="url(#rhi_rubyClip)" />
        {/* 18. Micro-glint at notch */}
        <Path d={INNER} fill="url(#rhi_glint3)" clipPath="url(#rhi_rubyClip)" />
        {/* 19. Ruby bezel edge */}
        <Path d={INNER} fill="none" stroke="rgba(65,2,8,0.68)" strokeWidth={0.6} />
        {/* 20. Thin gold-catch rim on ruby */}
        <Path d={INNER} fill="none" stroke="rgba(255,115,140,0.28)" strokeWidth={0.4} />
      </Svg>
    </View>
  );
}
