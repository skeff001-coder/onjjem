import React from "react";
import { View } from "react-native";
import Svg, { Ellipse, G, Path } from "react-native-svg";

// Fine-art botanical climbing-rose wreath behind ONJJEM.
// Rendered BEFORE GraffitiTitle — vines sit BEHIND the gold letters.
//
// SVG coordinate map  (viewBox 0 0 260 90, positioned top=-16, left=-8):
//   Cap top    y≈26      Cap bottom  y≈63      Base vine  y≈71
//
// Vertical stroke centres (Cinzel at fontSize=52, letterSpacing=9):
//   Heart-O x=8–45   N cx≈57   J₁ cx≈107   J₂ cx≈138   E cx≈163   M cx≈202

const V    = "#182E08";   // deep forest-green vine
const LF   = "#213E0A";   // leaf fill
const BUD  = "#760E0E";   // ruby-red bud petals
const BUDS = "#4D0808";   // bud stroke / shadow
const BUDL = "#B02020";   // bud centre-fold highlight
const SEP  = "#1E3A0C";   // sepal green
const SW   = 0.60;        // hairline base stroke width

// ── Pointed botanical rosebud ──────────────────────────────────────────────
// Centred at origin, bud tip points UP. Use transform="translate(x,y) rotate(a)"
// to orient each bud along its tendril direction.
function Bud({ x, y, angle = 0, scale = 1 }: { x: number; y: number; angle?: number; scale?: number }) {
  const s = scale;
  return (
    <G transform={`translate(${x}, ${y}) rotate(${angle})`}>
      {/* Outer petals — pointed teardrop */}
      <Path
        d={`M 0 ${1.2 * s} C ${-2.1 * s} ${1.2 * s} ${-2.3 * s} ${-3.5 * s} 0 ${-5.8 * s} C ${2.3 * s} ${-3.5 * s} ${2.1 * s} ${1.2 * s} 0 ${1.2 * s} Z`}
        fill={BUD} stroke={BUDS} strokeWidth={0.44 * s}
      />
      {/* Centre-fold crease */}
      <Path
        d={`M 0 ${0.8 * s} C 0 ${-1.2 * s} 0 ${-3.8 * s} 0 ${-5.4 * s}`}
        stroke={BUDL} strokeWidth={0.32 * s} fill="none"
      />
      {/* Left sepal */}
      <Path
        d={`M ${-0.5 * s} ${1.3 * s} C ${-2 * s} ${2 * s} ${-3 * s} ${3.5 * s} ${-1.5 * s} ${3.8 * s}`}
        stroke={SEP} strokeWidth={0.34 * s} fill={LF}
      />
      {/* Right sepal */}
      <Path
        d={`M ${0.5 * s} ${1.3 * s} C ${2 * s} ${2 * s} ${3 * s} ${3.5 * s} ${1.5 * s} ${3.8 * s}`}
        stroke={SEP} strokeWidth={0.34 * s} fill={LF}
      />
    </G>
  );
}

// ── Dense sinusoidal helix coiling around a letter's vertical stroke ────────
// halfPeriod=2.5 px  →  ~14 half-cycles  =  7 full spirals from cap-top to cap-bottom
// Amplitude ±2.5 px keeps the vine tight against a 4-5 px Cinzel stroke.
function helix(cx: number): string {
  const a = cx - 2.5;      // left side of stroke
  const b = cx + 2.5;      // right side of stroke
  const HALF = 2.5;        // half-period in SVG units
  const Y0 = 62;           // start at cap-bottom (spiral upward visually)
  const Y1 = 26;           // finish at cap-top
  const parts: string[] = [`M ${a} ${Y0}`];
  let y = Y0;
  let leftStart = true;    // first half-cycle starts from left side
  while (y > Y1 + 0.01) {
    const nextY = Math.max(y - HALF, Y1);
    const h = y - nextY;                // positive height of this segment
    const from = leftStart ? a : b;
    const to   = leftStart ? b : a;
    // Cubic bezier control-points approximate a half-sine (smooth S-curve)
    parts.push(`C ${from} ${y - h / 3} ${to} ${nextY + h / 3} ${to} ${nextY}`);
    y = nextY;
    leftStart = !leftStart;
  }
  return parts.join(" ");
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
        opacity: 0.60,           // semi-transparent — blends into vintage background
        pointerEvents: "none" as const,
      }}
    >
      <Svg width={260} height={90} viewBox="0 0 260 90">

        {/* ── MAIN BASE VINE ─────────────────────────────────────────── */}
        <Path
          d="M 0 72 C 20 70 40 74 65 71 C 90 68 112 75 140 71 C 168 67 192 75 220 71 C 238 68 252 73 264 72"
          stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round"
        />

        {/* ── HEART-O  — vine curling around the left lobe ───────────── */}
        <Path
          d="M 11 63 C 8 57 7 50 9 44 C 11 38 9 32 12 27"
          stroke={V} strokeWidth={SW * 0.90} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 9 44 C 5 42 2 37 4 33 C 6 29 10 32 9 38"
          stroke={V} strokeWidth={SW * 0.74} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={4.5} cy={34} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.32} transform="rotate(-52 4.5 34)" />
        <Bud x={12} y={28} angle={-8} />

        {/* ── N  helix  cx≈57 ────────────────────────────────────────── */}
        <Path d={helix(57)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path
          d="M 59.5 32 C 64 30 68 25 65 22 C 62 19 58 22 59.5 27"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 54.5 50 C 50 48 45 43 48 40 C 51 37 55 40 54.5 45"
          stroke={V} strokeWidth={SW * 0.74} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={59.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 59.8 32)" />
        <Ellipse cx={54.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-38 54.2 44)" />
        <Ellipse cx={59.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(42 59.8 56)" />
        <Bud x={65} y={23} angle={18}  />
        <Bud x={46} y={41} angle={-28} scale={0.88} />

        {/* ── J₁  helix  cx≈107 ──────────────────────────────────────── */}
        <Path d={helix(107)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path
          d="M 109.5 38 C 114 36 118 31 115 28 C 112 25 108 28 109.5 33"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 104.5 56 C 99 54 94 49 97 46 C 100 43 105 46 104.5 51"
          stroke={V} strokeWidth={SW * 0.74} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={109.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 109.8 32)" />
        <Ellipse cx={104.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-40 104.2 44)" />
        <Ellipse cx={109.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 109.8 56)" />
        <Bud x={115} y={28} angle={16} />
        <Bud x={95}  y={47} angle={-26} scale={0.88} />

        {/* ── J₂  helix  cx≈138 ──────────────────────────────────────── */}
        <Path d={helix(138)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path
          d="M 140.5 44 C 145 42 149 37 146 34 C 143 31 139 34 140.5 39"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 135.5 32 C 130 30 126 25 129 22 C 132 19 136 22 135.5 27"
          stroke={V} strokeWidth={SW * 0.74} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={140.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(38 140.8 32)" />
        <Ellipse cx={135.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-40 135.2 44)" />
        <Ellipse cx={140.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(42 140.8 56)" />
        <Bud x={146} y={35} angle={14} />
        <Bud x={130} y={22} angle={-22} scale={0.88} />

        {/* ── E  helix  cx≈163 ───────────────────────────────────────── */}
        <Path d={helix(163)} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path
          d="M 165.5 44 C 170 42 174 37 171 34 C 168 31 164 34 165.5 39"
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 160.5 56 C 155 54 150 49 153 46 C 156 43 161 46 160.5 51"
          stroke={V} strokeWidth={SW * 0.74} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={165.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 165.8 32)" />
        <Ellipse cx={160.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-38 160.2 44)" />
        <Ellipse cx={165.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(42 165.8 56)" />
        <Bud x={171} y={35} angle={14} />
        <Bud x={151} y={47} angle={-24} scale={0.88} />

        {/* ── M  helix  cx≈202 (stops at y=56 — M base diverges) ──────── */}
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
          stroke={V} strokeWidth={SW * 0.76} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 199.5 50 C 194 48 189 43 192 40 C 195 37 200 40 199.5 45"
          stroke={V} strokeWidth={SW * 0.74} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={204.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 204.8 32)" />
        <Ellipse cx={199.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-38 199.2 44)" />
        <Ellipse cx={204.8} cy={54} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 204.8 54)" />
        <Bud x={210} y={28} angle={18} />
        <Bud x={190} y={41} angle={-28} scale={0.88} />

        {/* ── INTER-LETTER RISING TENDRILS from the base vine ─────────── */}
        {/* O→N gap */}
        <Path
          d="M 50 71 C 49 67 52 62 50 57 C 48 52 51 47 49 42"
          stroke={V} strokeWidth={SW * 0.84} fill="none" strokeLinecap="round"
        />
        <Bud x={49} y={42} angle={-5} scale={0.82} />

        {/* J₁→J₂ gap */}
        <Path
          d="M 127 71 C 126 66 129 60 126 54 C 123 49 127 43 123 37"
          stroke={V} strokeWidth={SW * 0.84} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={124.5} cy={48} rx={1.1} ry={2.4} fill={LF} stroke={V} strokeWidth={0.28} transform="rotate(-42 124.5 48)" />
        <Bud x={123} y={37} angle={-8} scale={0.82} />

        {/* Right trailing tendril */}
        <Path
          d="M 244 71 C 247 65 244 58 248 51 C 252 45 248 37 253 30"
          stroke={V} strokeWidth={SW * 0.84} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={250} cy={44} rx={1.1} ry={2.4} fill={LF} stroke={V} strokeWidth={0.28} transform="rotate(38 250 44)" />
        <Bud x={253} y={31} angle={12} />

        {/* ── SMALL BUDS GROWING FROM BASE VINE ───────────────────────── */}
        <Bud x={28}  y={71} angle={0}   scale={0.78} />
        <Bud x={78}  y={72} angle={5}   scale={0.72} />
        <Bud x={178} y={71} angle={-3}  scale={0.72} />
        <Bud x={228} y={71} angle={2}   scale={0.78} />

      </Svg>
    </View>
  );
}
