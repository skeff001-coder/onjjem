import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

// Fine-art climbing-rose wreath behind ONJJEM.
// Rendered BEFORE GraffitiTitle so all vines sit BEHIND the gold letters.
//
// SVG coordinate map  (viewBox 0 0 260 90, positioned top=-16, left=-8):
//   Title left edge  → x ≈ 8
//   Cap top          → y ≈ 26      Cap bottom → y ≈ 63
//   Baseline vine    → y ≈ 70–72
//
// Per-letter left-stroke centres (Cinzel cap, letterSpacing=9):
//   Heart-O : x=8–45   N: left-stem cx≈57   J₁: cx≈107
//   J₂: cx≈138         E: cx≈163            M:  cx≈202

const V   = "#1A3A08";   // deep forest-green stem / leaf stroke
const LF  = "#264D0C";   // leaf fill (slightly lighter)
const BUD = "#6A0E0E";   // deep-crimson bud base
const BUH = "#9C1C1C";   // bud highlight
const SW  = 0.62;        // hairline base stroke width

// A tight sinusoidal helix coiling around a vertical letter-stroke.
// cx = horizontal centre of the stroke; runs from y=26 to y=62.
// Each half-cycle ≈ 6 px; amplitude ±2.5 px — hugs a 4-5 px letter stroke.
function helix(cx: number): string {
  const a = cx - 2.5, b = cx + 2.5;
  return (
    `M ${a} 26 C ${a} 28 ${b} 30 ${b} 32 ` +
    `C ${b} 34 ${a} 36 ${a} 38 ` +
    `C ${a} 40 ${b} 42 ${b} 44 ` +
    `C ${b} 46 ${a} 48 ${a} 50 ` +
    `C ${a} 52 ${b} 54 ${b} 56 ` +
    `C ${b} 58 ${a} 60 ${a} 62`
  );
}

export function TitleWreath() {
  return (
    <View
      style={{
        position: "absolute",
        top: -16,
        left: -8,
        width: 260,
        height: 90,
        opacity: 0.82,
        pointerEvents: "none" as const,
      }}
    >
      <Svg width={260} height={90} viewBox="0 0 260 90">

        {/* ── MAIN BASE VINE  (hairline, gently undulating beneath the title) ── */}
        <Path
          d="M 0 72 C 20 70 40 74 65 71 C 90 68 112 75 140 71 C 168 67 192 75 220 71 C 238 68 252 73 264 72"
          stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round"
        />

        {/* ══════════════════════════════════════════════════════
            HEART-O  —  delicate vine curling around the left lobe
            ══════════════════════════════════════════════════════ */}
        <Path
          d="M 11 63 C 8 57 7 50 9 44 C 11 38 9 32 12 27"
          stroke={V} strokeWidth={SW * 0.90} fill="none" strokeLinecap="round"
        />
        {/* Small outward spiral off the O vine at mid-height */}
        <Path
          d="M 9 44 C 5 42 2 37 4 33 C 6 29 10 32 9 38"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={4.5} cy={34} rx={1.3} ry={3.0} fill={LF} stroke={V} strokeWidth={0.35} transform="rotate(-52 4.5 34)" />
        <Circle cx={12} cy={26.5} r={1.8} fill={BUD} stroke={BUH} strokeWidth={0.44} />
        <Circle cx={12} cy={25.9} r={0.80} fill={BUH} />

        {/* ══════════════════════════════════════════════════════
            N  —  helix on left vertical stroke  (cx ≈ 57)
            ══════════════════════════════════════════════════════ */}
        <Path d={helix(57)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        {/* Branching curl  → right (from the rightmost peak at y=32) */}
        <Path
          d="M 59.5 32 C 64 30 68 25 65 22 C 62 19 58 22 59.5 27"
          stroke={V} strokeWidth={SW * 0.78} fill="none" strokeLinecap="round"
        />
        {/* Branching curl  ← left (from leftmost trough at y=50) */}
        <Path
          d="M 54.5 50 C 50 48 45 43 48 40 C 51 37 55 40 54.5 45"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={59.8} cy={32} rx={1.3} ry={3.0} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(40 59.8 32)" />
        <Ellipse cx={54.2} cy={44} rx={1.3} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(-38 54.2 44)" />
        <Ellipse cx={59.8} cy={56} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(42 59.8 56)" />
        <Circle cx={65} cy={21.5} r={1.7} fill={BUD} stroke={BUH} strokeWidth={0.42} />
        <Circle cx={65} cy={20.9} r={0.72} fill={BUH} />
        <Circle cx={45} cy={40.5} r={1.6} fill={BUD} stroke={BUH} strokeWidth={0.40} />
        <Circle cx={45} cy={39.9} r={0.68} fill={BUH} />

        {/* ══════════════════════════════════════════════════════
            J₁  —  helix on vertical stroke  (cx ≈ 107)
            ══════════════════════════════════════════════════════ */}
        <Path d={helix(107)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path
          d="M 109.5 38 C 114 36 118 31 115 28 C 112 25 108 28 109.5 33"
          stroke={V} strokeWidth={SW * 0.78} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 104.5 56 C 99 54 94 49 97 46 C 100 43 105 46 104.5 51"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={109.8} cy={32} rx={1.3} ry={3.0} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(40 109.8 32)" />
        <Ellipse cx={104.2} cy={44} rx={1.3} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(-40 104.2 44)" />
        <Ellipse cx={109.8} cy={56} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(40 109.8 56)" />
        <Circle cx={115} cy={27.5} r={1.7} fill={BUD} stroke={BUH} strokeWidth={0.42} />
        <Circle cx={115} cy={26.9} r={0.72} fill={BUH} />
        <Circle cx={94} cy={46.5} r={1.6} fill={BUD} stroke={BUH} strokeWidth={0.40} />
        <Circle cx={94} cy={45.9} r={0.68} fill={BUH} />

        {/* ══════════════════════════════════════════════════════
            J₂  —  helix on vertical stroke  (cx ≈ 138)
            ══════════════════════════════════════════════════════ */}
        <Path d={helix(138)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path
          d="M 140.5 44 C 145 42 149 37 146 34 C 143 31 139 34 140.5 39"
          stroke={V} strokeWidth={SW * 0.78} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 135.5 32 C 130 30 126 25 129 22 C 132 19 136 22 135.5 27"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={140.8} cy={32} rx={1.3} ry={3.0} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(38 140.8 32)" />
        <Ellipse cx={135.2} cy={44} rx={1.3} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(-40 135.2 44)" />
        <Ellipse cx={140.8} cy={56} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(42 140.8 56)" />
        <Circle cx={146} cy={33.5} r={1.7} fill={BUD} stroke={BUH} strokeWidth={0.42} />
        <Circle cx={146} cy={32.9} r={0.72} fill={BUH} />
        <Circle cx={129} cy={21.5} r={1.6} fill={BUD} stroke={BUH} strokeWidth={0.40} />
        <Circle cx={129} cy={20.9} r={0.68} fill={BUH} />

        {/* ══════════════════════════════════════════════════════
            E  —  helix on left vertical stroke  (cx ≈ 163)
            ══════════════════════════════════════════════════════ */}
        <Path d={helix(163)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path
          d="M 165.5 44 C 170 42 174 37 171 34 C 168 31 164 34 165.5 39"
          stroke={V} strokeWidth={SW * 0.78} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 160.5 56 C 155 54 150 49 153 46 C 156 43 161 46 160.5 51"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={165.8} cy={32} rx={1.3} ry={3.0} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(40 165.8 32)" />
        <Ellipse cx={160.2} cy={44} rx={1.3} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(-38 160.2 44)" />
        <Ellipse cx={165.8} cy={56} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(42 165.8 56)" />
        <Circle cx={171} cy={33.5} r={1.7} fill={BUD} stroke={BUH} strokeWidth={0.42} />
        <Circle cx={171} cy={32.9} r={0.72} fill={BUH} />
        <Circle cx={150} cy={46.5} r={1.6} fill={BUD} stroke={BUH} strokeWidth={0.40} />
        <Circle cx={150} cy={45.9} r={0.68} fill={BUH} />

        {/* ══════════════════════════════════════════════════════
            M  —  helix on left vertical stroke  (cx ≈ 202)
            ══════════════════════════════════════════════════════ */}
        {/* M helix stops at y=56 — the M foot merges mid-letter */}
        <Path
          d={
            "M 199.5 26 C 199.5 28 204.5 30 204.5 32 " +
            "C 204.5 34 199.5 36 199.5 38 " +
            "C 199.5 40 204.5 42 204.5 44 " +
            "C 204.5 46 199.5 48 199.5 50 " +
            "C 199.5 52 204.5 54 204.5 56"
          }
          stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 204.5 38 C 209 36 213 31 210 28 C 207 25 203 28 204.5 33"
          stroke={V} strokeWidth={SW * 0.78} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 199.5 50 C 194 48 189 43 192 40 C 195 37 200 40 199.5 45"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={204.8} cy={32} rx={1.3} ry={3.0} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(40 204.8 32)" />
        <Ellipse cx={199.2} cy={44} rx={1.3} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(-38 199.2 44)" />
        <Ellipse cx={204.8} cy={54} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.33} transform="rotate(40 204.8 54)" />
        <Circle cx={210} cy={27.5} r={1.7} fill={BUD} stroke={BUH} strokeWidth={0.42} />
        <Circle cx={210} cy={26.9} r={0.72} fill={BUH} />
        <Circle cx={189} cy={40.5} r={1.6} fill={BUD} stroke={BUH} strokeWidth={0.40} />
        <Circle cx={189} cy={39.9} r={0.68} fill={BUH} />

        {/* ══════════════════════════════════════════════════════
            INTER-LETTER RISING TENDRILS from the base vine
            ══════════════════════════════════════════════════════ */}
        {/* Between O and N */}
        <Path
          d="M 50 71 C 49 67 52 62 50 57 C 48 52 51 47 49 42"
          stroke={V} strokeWidth={SW * 0.86} fill="none" strokeLinecap="round"
        />
        <Circle cx={49} cy={41.5} r={1.5} fill={BUD} stroke={BUH} strokeWidth={0.38} />

        {/* Between J₁ and J₂ */}
        <Path
          d="M 127 71 C 126 66 129 60 126 54 C 123 49 127 43 123 37"
          stroke={V} strokeWidth={SW * 0.86} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={124.5} cy={48} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-42 124.5 48)" />
        <Circle cx={123} cy={36.5} r={1.5} fill={BUD} stroke={BUH} strokeWidth={0.38} />

        {/* Right of M — trailing tendril */}
        <Path
          d="M 244 71 C 247 65 244 58 248 51 C 252 45 248 37 253 30"
          stroke={V} strokeWidth={SW * 0.86} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={250} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(38 250 44)" />
        <Circle cx={253} cy={29.5} r={1.7} fill={BUD} stroke={BUH} strokeWidth={0.42} />
        <Circle cx={253} cy={28.9} r={0.72} fill={BUH} />

        {/* ══════════════════════════════════════════════════════
            MICRO BUDS sitting on the base vine
            ══════════════════════════════════════════════════════ */}
        <Circle cx={28}  cy={71}  r={1.45} fill={BUD} stroke={BUH} strokeWidth={0.36} />
        <Circle cx={78}  cy={72}  r={1.35} fill={BUD} stroke={BUH} strokeWidth={0.36} />
        <Circle cx={178} cy={71}  r={1.35} fill={BUD} stroke={BUH} strokeWidth={0.36} />
        <Circle cx={228} cy={71}  r={1.45} fill={BUD} stroke={BUH} strokeWidth={0.36} />

      </Svg>
    </View>
  );
}
