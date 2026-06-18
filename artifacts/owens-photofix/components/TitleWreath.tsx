import React from "react";
import { View } from "react-native";
import Svg, { Ellipse, G, Path } from "react-native-svg";

// ─────────────────────────────────────────────────────────────────────────────
// How the layered wrapping illusion works:
//   • TitleWreath    → rendered BEFORE GraffitiTitle → sits BEHIND the gold
//   • TitleWreathFront → rendered AFTER  GraffitiTitle → sits IN FRONT of the gold
//
// Each helix coil alternates between a "back crossing" (b→a) and a "front
// crossing" (a→b). Back crossings go to TitleWreath; front crossings go to
// TitleWreathFront. The eye reads this as the vine genuinely spiralling around
// each letter stroke.
//
// SVG viewBox 0 0 260 90, positioned top=-16, left=-8 in both layers.
// Cap area: y=26 (top) to y=62 (bottom).  Base vine: y≈71.
// Per-letter left-stroke centres: N cx≈57  J₁ cx≈107  J₂ cx≈138  E cx≈163  M cx≈202
// ─────────────────────────────────────────────────────────────────────────────

const V    = "#182E08";   // deep forest-green vine / leaf stroke
const LF   = "#213E0A";   // leaf fill
const BUD  = "#760E0E";   // ruby-red bud
const BUDS = "#4D0808";   // bud stroke
const BUDL = "#B02020";   // bud centre-fold
const SEP  = "#1E3A0C";   // sepal green
const SW   = 0.60;        // hairline base stroke

// ── Pointed botanical rosebud ──────────────────────────────────────────────
function Bud({ x, y, angle = 0, scale = 1 }: {
  x: number; y: number; angle?: number; scale?: number;
}) {
  const s = scale;
  return (
    <G transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <Path
        d={`M 0 ${1.2*s} C ${-2.1*s} ${1.2*s} ${-2.3*s} ${-3.5*s} 0 ${-5.8*s} C ${2.3*s} ${-3.5*s} ${2.1*s} ${1.2*s} 0 ${1.2*s} Z`}
        fill={BUD} stroke={BUDS} strokeWidth={0.44 * s}
      />
      <Path
        d={`M 0 ${0.8*s} C 0 ${-1.2*s} 0 ${-3.8*s} 0 ${-5.4*s}`}
        stroke={BUDL} strokeWidth={0.32 * s} fill="none"
      />
      <Path
        d={`M ${-0.5*s} ${1.3*s} C ${-2*s} ${2*s} ${-3*s} ${3.5*s} ${-1.5*s} ${3.8*s}`}
        stroke={SEP} strokeWidth={0.34 * s} fill={LF}
      />
      <Path
        d={`M ${0.5*s} ${1.3*s} C ${2*s} ${2*s} ${3*s} ${3.5*s} ${1.5*s} ${3.8*s}`}
        stroke={SEP} strokeWidth={0.34 * s} fill={LF}
      />
    </G>
  );
}

// ── Split helix into back (b→a) and front (a→b) crossing segments ──────────
// Each half-cycle is 2.5 px → 14 half-cycles = 7 full spirals over cap height.
// a = left side of stroke (cx−2.5), b = right side (cx+2.5).
// a→b : vine crosses the face of the post  → FRONT layer (drawn over letters)
// b→a : vine crosses the back of the post  → BACK  layer (drawn under letters)
function helixSplit(cx: number): { back: string; front: string } {
  const a = +(cx - 2.5).toFixed(1);
  const b = +(cx + 2.5).toFixed(1);
  const HALF = 2.5;
  const Y0 = 62, Y1 = 26;
  const back: string[] = [], front: string[] = [];

  let y = Y0;
  let aToB = true; // first half-cycle: a→b (front crossing)

  while (y > Y1 + 0.01) {
    const ny  = +Math.max(y - HALF, Y1).toFixed(1);
    const h   = +(y - ny).toFixed(1);
    const fx  = aToB ? a : b;
    const tx  = aToB ? b : a;
    const seg = `M ${fx} ${y} C ${fx} ${+(y - h/3).toFixed(1)} ${tx} ${+(ny + h/3).toFixed(1)} ${tx} ${ny}`;
    (aToB ? front : back).push(seg);
    y = ny;
    aToB = !aToB;
  }

  return { back: back.join(" "), front: front.join(" ") };
}

// Pre-compute split paths for every letter at module load time
const HELICES: Record<string, { back: string; front: string }> = {
  N:  helixSplit(57),
  J1: helixSplit(107),
  J2: helixSplit(138),
  E:  helixSplit(163),
  M:  helixSplit(202),
};

// ── Shared SVG wrapper ─────────────────────────────────────────────────────
function WreathSvg({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        position: "absolute",
        top: -16, left: -8,
        width: 260, height: 90,
        opacity: 0.60,
        pointerEvents: "none" as const,
      }}
    >
      <Svg width={260} height={90} viewBox="0 0 260 90">
        {children}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — BEHIND the gold letters
// Contains: base vine, heart-O curl, back helix crossings, all leaves & buds
// ─────────────────────────────────────────────────────────────────────────────
export function TitleWreath() {
  return (
    <WreathSvg>

      {/* Base vine */}
      <Path
        d="M 0 72 C 20 70 40 74 65 71 C 90 68 112 75 140 71 C 168 67 192 75 220 71 C 238 68 252 73 264 72"
        stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round"
      />

      {/* Heart-O — vine curling around the left lobe */}
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

      {/* ── N  back crossings + leaves + buds ── */}
      <Path d={HELICES.N.back}  stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
      <Path d="M 59.5 32 C 64 30 68 25 65 22 C 62 19 58 22 59.5 27" stroke={V} strokeWidth={SW*0.76} fill="none" strokeLinecap="round" />
      <Path d="M 54.5 50 C 50 48 45 43 48 40 C 51 37 55 40 54.5 45" stroke={V} strokeWidth={SW*0.74} fill="none" strokeLinecap="round" />
      <Ellipse cx={59.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 59.8 32)" />
      <Ellipse cx={54.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-38 54.2 44)" />
      <Ellipse cx={59.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(42 59.8 56)" />
      <Bud x={65} y={23} angle={18} />
      <Bud x={46} y={41} angle={-28} scale={0.88} />

      {/* ── J₁ back crossings + leaves + buds ── */}
      <Path d={HELICES.J1.back} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
      <Path d="M 109.5 38 C 114 36 118 31 115 28 C 112 25 108 28 109.5 33" stroke={V} strokeWidth={SW*0.76} fill="none" strokeLinecap="round" />
      <Path d="M 104.5 56 C 99 54 94 49 97 46 C 100 43 105 46 104.5 51"  stroke={V} strokeWidth={SW*0.74} fill="none" strokeLinecap="round" />
      <Ellipse cx={109.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 109.8 32)" />
      <Ellipse cx={104.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-40 104.2 44)" />
      <Ellipse cx={109.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 109.8 56)" />
      <Bud x={115} y={28} angle={16} />
      <Bud x={95}  y={47} angle={-26} scale={0.88} />

      {/* ── J₂ back crossings + leaves + buds ── */}
      <Path d={HELICES.J2.back} stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
      <Path d="M 140.5 44 C 145 42 149 37 146 34 C 143 31 139 34 140.5 39" stroke={V} strokeWidth={SW*0.76} fill="none" strokeLinecap="round" />
      <Path d="M 135.5 32 C 130 30 126 25 129 22 C 132 19 136 22 135.5 27" stroke={V} strokeWidth={SW*0.74} fill="none" strokeLinecap="round" />
      <Ellipse cx={140.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(38 140.8 32)" />
      <Ellipse cx={135.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-40 135.2 44)" />
      <Ellipse cx={140.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(42 140.8 56)" />
      <Bud x={146} y={35} angle={14} />
      <Bud x={130} y={22} angle={-22} scale={0.88} />

      {/* ── E  back crossings + leaves + buds ── */}
      <Path d={HELICES.E.back}  stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
      <Path d="M 165.5 44 C 170 42 174 37 171 34 C 168 31 164 34 165.5 39" stroke={V} strokeWidth={SW*0.76} fill="none" strokeLinecap="round" />
      <Path d="M 160.5 56 C 155 54 150 49 153 46 C 156 43 161 46 160.5 51" stroke={V} strokeWidth={SW*0.74} fill="none" strokeLinecap="round" />
      <Ellipse cx={165.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 165.8 32)" />
      <Ellipse cx={160.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-38 160.2 44)" />
      <Ellipse cx={165.8} cy={56} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(42 165.8 56)" />
      <Bud x={171} y={35} angle={14} />
      <Bud x={151} y={47} angle={-24} scale={0.88} />

      {/* ── M  back crossings + leaves + buds ── */}
      <Path d={HELICES.M.back}  stroke={V} strokeWidth={SW} fill="none" strokeLinecap="round" />
      <Path d="M 204.5 38 C 209 36 213 31 210 28 C 207 25 203 28 204.5 33" stroke={V} strokeWidth={SW*0.76} fill="none" strokeLinecap="round" />
      <Path d="M 199.5 50 C 194 48 189 43 192 40 C 195 37 200 40 199.5 45" stroke={V} strokeWidth={SW*0.74} fill="none" strokeLinecap="round" />
      <Ellipse cx={204.8} cy={32} rx={1.2} ry={2.8} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 204.8 32)" />
      <Ellipse cx={199.2} cy={44} rx={1.2} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(-38 199.2 44)" />
      <Ellipse cx={204.8} cy={54} rx={1.1} ry={2.6} fill={LF} stroke={V} strokeWidth={0.30} transform="rotate(40 204.8 54)" />
      <Bud x={210} y={28} angle={18} />
      <Bud x={190} y={41} angle={-28} scale={0.88} />

      {/* Inter-letter rising tendrils */}
      <Path d="M 50 71 C 49 67 52 62 50 57 C 48 52 51 47 49 42" stroke={V} strokeWidth={SW*0.84} fill="none" strokeLinecap="round" />
      <Bud x={49} y={42} angle={-5} scale={0.82} />

      <Path d="M 127 71 C 126 66 129 60 126 54 C 123 49 127 43 123 37" stroke={V} strokeWidth={SW*0.84} fill="none" strokeLinecap="round" />
      <Ellipse cx={124.5} cy={48} rx={1.1} ry={2.4} fill={LF} stroke={V} strokeWidth={0.28} transform="rotate(-42 124.5 48)" />
      <Bud x={123} y={37} angle={-8} scale={0.82} />

      <Path d="M 244 71 C 247 65 244 58 248 51 C 252 45 248 37 253 30" stroke={V} strokeWidth={SW*0.84} fill="none" strokeLinecap="round" />
      <Ellipse cx={250} cy={44} rx={1.1} ry={2.4} fill={LF} stroke={V} strokeWidth={0.28} transform="rotate(38 250 44)" />
      <Bud x={253} y={31} angle={12} />

      {/* Micro buds on base vine */}
      <Bud x={28}  y={71} angle={0}  scale={0.78} />
      <Bud x={78}  y={72} angle={5}  scale={0.72} />
      <Bud x={178} y={71} angle={-3} scale={0.72} />
      <Bud x={228} y={71} angle={2}  scale={0.78} />

    </WreathSvg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — IN FRONT of the gold letters
// Contains ONLY the front (a→b) helix crossings — hairline arcs that pass
// over the letter face to complete the wrapping illusion.
// ─────────────────────────────────────────────────────────────────────────────
export function TitleWreathFront() {
  return (
    <WreathSvg>
      <Path d={HELICES.N.front}  stroke={V} strokeWidth={SW * 0.90} fill="none" strokeLinecap="round" />
      <Path d={HELICES.J1.front} stroke={V} strokeWidth={SW * 0.90} fill="none" strokeLinecap="round" />
      <Path d={HELICES.J2.front} stroke={V} strokeWidth={SW * 0.90} fill="none" strokeLinecap="round" />
      <Path d={HELICES.E.front}  stroke={V} strokeWidth={SW * 0.90} fill="none" strokeLinecap="round" />
      <Path d={HELICES.M.front}  stroke={V} strokeWidth={SW * 0.90} fill="none" strokeLinecap="round" />
    </WreathSvg>
  );
}
