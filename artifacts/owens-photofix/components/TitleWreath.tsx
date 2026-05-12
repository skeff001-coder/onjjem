import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

// Climbing rose vine that weaves around the ONJJEM title letters.
// Rendered BEFORE GraffitiTitle so the vines sit BEHIND the gold text.
// Position: top=-16, left=-8 relative to the GraffitiTitle container.
//
// SVG coordinate reference (260 × 90):
//   Title left edge   ≈ x=8 (8px left margin)
//   Cap top           ≈ y=26
//   Cap bottom        ≈ y=63
//   Main vine stems   ≈ y=70–74

const STEM   = "#3D6426";   // dark green vine
const LEAF   = "#5E8E38";   // mid green leaf fill
const LEAFD  = "#3D6426";   // leaf stroke
const ROSE   = "#F0C4B0";   // soft blush rose petal
const ROSED  = "#C8846A";   // rose stroke / detail
const SW     = 1.15;        // base stroke weight

export function TitleWreath() {
  return (
    <View
      style={{
        position: "absolute",
        top: -16,
        left: -8,
        width: 260,
        height: 90,
        opacity: 0.78,
        pointerEvents: "none" as const,
      }}
    >
      <Svg width={260} height={90} viewBox="0 0 260 90">

        {/* ══════════════════════════════════════════
            MAIN BOTTOM VINE  (runs under all letters)
            ══════════════════════════════════════════ */}
        <Path
          d="M 0 72 C 18 68 38 74 60 71 C 84 68 106 75 132 71 C 158 67 180 75 208 71 C 228 68 246 74 262 72"
          stroke={STEM} strokeWidth={SW} fill="none" strokeLinecap="round"
        />

        {/* ══════════════════════════════════════════
            TENDRIL 1  —  left of heart-O, curls up-left
            (visually tucks around the O/heart)
            ══════════════════════════════════════════ */}
        <Path
          d="M 6 71 C 3 61 0 50 2 40 C 4 31 10 25 6 17 C 4 11 9 7 14 10"
          stroke={STEM} strokeWidth={SW * 0.95} fill="none" strokeLinecap="round"
        />
        {/* side curl off tendril 1 */}
        <Path
          d="M 5 43 C 0 41 -2 37 0 33"
          stroke={STEM} strokeWidth={SW * 0.72} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={1}  cy={37} rx={3}   ry={5.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(-40 1 37)" />
        <Ellipse cx={7}  cy={26} rx={2.5} ry={5}   fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(-55 7 26)" />
        {/* rose bud at tip of tendril 1 */}
        <Circle cx={14} cy={9}  r={3.8} fill={ROSE}   stroke={ROSED} strokeWidth={0.75} />
        <Circle cx={14} cy={8}  r={2.2} fill="#FBDED4" stroke={ROSED} strokeWidth={0.5}  />
        <Circle cx={14} cy={8.5} r={0.9} fill={ROSED} />

        {/* ══════════════════════════════════════════
            TENDRIL 2  —  O‑N gap  (x ≈ 51)
            ══════════════════════════════════════════ */}
        <Path
          d="M 52 71 C 50 61 54 51 49 41 C 45 33 48 25 44 18"
          stroke={STEM} strokeWidth={SW * 0.95} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 50 53 C 55 51 57 47 55 42"
          stroke={STEM} strokeWidth={SW * 0.70} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={48} cy={53} rx={3}   ry={6}   fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(-145 48 53)" />
        <Ellipse cx={45} cy={33} rx={2.5} ry={5.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(-158 45 33)" />
        <Circle cx={44} cy={17}  r={3.8} fill={ROSE}   stroke={ROSED} strokeWidth={0.75} />
        <Circle cx={44} cy={16}  r={2.2} fill="#FBDED4" stroke={ROSED} strokeWidth={0.5}  />
        <Circle cx={44} cy={16.5} r={0.9} fill={ROSED} />

        {/* ══════════════════════════════════════════
            TENDRIL 3  —  N‑J gap  (x ≈ 95)
            ══════════════════════════════════════════ */}
        <Path
          d="M 96 71 C 98 61 94 51 97 41 C 100 33 96 25 99 17"
          stroke={STEM} strokeWidth={SW * 0.95} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 96 50 C 91 48 89 44 91 39"
          stroke={STEM} strokeWidth={SW * 0.70} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={98} cy={51} rx={3}   ry={6}   fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(42 98 51)" />
        <Ellipse cx={98} cy={31} rx={2.5} ry={5.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(32 98 31)" />
        <Circle cx={99} cy={16}  r={3.8} fill={ROSE}   stroke={ROSED} strokeWidth={0.75} />
        <Circle cx={99} cy={15}  r={2.2} fill="#FBDED4" stroke={ROSED} strokeWidth={0.5}  />
        <Circle cx={99} cy={15.5} r={0.9} fill={ROSED} />

        {/* ══════════════════════════════════════════
            TENDRIL 4  —  J‑J gap  (x ≈ 126)  shorter gap
            ══════════════════════════════════════════ */}
        <Path
          d="M 127 71 C 125 63 129 55 125 46 C 122 38 126 30 122 22"
          stroke={STEM} strokeWidth={SW * 0.88} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={124} cy={45} rx={2.5} ry={5}   fill={LEAF} stroke={LEAFD} strokeWidth={0.45} transform="rotate(-148 124 45)" />
        <Ellipse cx={123} cy={28} rx={2.5} ry={4.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.45} transform="rotate(-160 123 28)" />
        <Circle cx={122} cy={21} r={3.2} fill={ROSE}   stroke={ROSED} strokeWidth={0.70} />
        <Circle cx={122} cy={20} r={1.8} fill="#FBDED4" stroke={ROSED} strokeWidth={0.5}  />

        {/* ══════════════════════════════════════════
            TENDRIL 5  —  J‑E gap  (x ≈ 158)
            ══════════════════════════════════════════ */}
        <Path
          d="M 158 71 C 160 61 156 51 159 41 C 162 33 158 25 161 17"
          stroke={STEM} strokeWidth={SW * 0.95} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 159 51 C 164 49 166 45 164 40"
          stroke={STEM} strokeWidth={SW * 0.70} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={160} cy={51} rx={3}   ry={6}   fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(40 160 51)" />
        <Ellipse cx={160} cy={31} rx={2.5} ry={5.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(30 160 31)" />
        <Circle cx={161} cy={16}  r={3.8} fill={ROSE}   stroke={ROSED} strokeWidth={0.75} />
        <Circle cx={161} cy={15}  r={2.2} fill="#FBDED4" stroke={ROSED} strokeWidth={0.5}  />
        <Circle cx={161} cy={15.5} r={0.9} fill={ROSED} />

        {/* ══════════════════════════════════════════
            TENDRIL 6  —  E‑M gap  (x ≈ 196)
            ══════════════════════════════════════════ */}
        <Path
          d="M 197 71 C 195 61 199 51 195 41 C 192 33 196 25 192 17"
          stroke={STEM} strokeWidth={SW * 0.95} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 196 51 C 191 49 189 45 191 40"
          stroke={STEM} strokeWidth={SW * 0.70} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={194} cy={51} rx={3}   ry={6}   fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(-142 194 51)" />
        <Ellipse cx={193} cy={31} rx={2.5} ry={5.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(-155 193 31)" />
        <Circle cx={192} cy={16}  r={3.8} fill={ROSE}   stroke={ROSED} strokeWidth={0.75} />
        <Circle cx={192} cy={15}  r={2.2} fill="#FBDED4" stroke={ROSED} strokeWidth={0.5}  />
        <Circle cx={192} cy={15.5} r={0.9} fill={ROSED} />

        {/* ══════════════════════════════════════════
            TENDRIL 7  —  right of M
            ══════════════════════════════════════════ */}
        <Path
          d="M 249 71 C 253 60 249 50 254 40 C 258 32 253 22 259 14"
          stroke={STEM} strokeWidth={SW * 0.95} fill="none" strokeLinecap="round"
        />
        <Path
          d="M 252 47 C 257 45 259 40 257 35"
          stroke={STEM} strokeWidth={SW * 0.70} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={253} cy={51} rx={3}   ry={6}   fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(40 253 51)" />
        <Ellipse cx={258} cy={31} rx={2.5} ry={5.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.5} transform="rotate(28 258 31)" />
        <Circle cx={259} cy={13}  r={3.8} fill={ROSE}   stroke={ROSED} strokeWidth={0.75} />
        <Circle cx={259} cy={12}  r={2.2} fill="#FBDED4" stroke={ROSED} strokeWidth={0.5}  />
        <Circle cx={259} cy={12.5} r={0.9} fill={ROSED} />

        {/* ══════════════════════════════════════════
            DECORATIVE LOWER CURLS  (add fullness to the bottom vine)
            ══════════════════════════════════════════ */}
        {/* curl below J‑J area */}
        <Path
          d="M 127 72 C 126 79 121 83 116 81 C 111 78 110 74 114 72"
          stroke={STEM} strokeWidth={SW * 0.82} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={115} cy={80} rx={2.5} ry={4.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.42} transform="rotate(22 115 80)" />

        {/* curl below O-N area */}
        <Path
          d="M 54 72 C 54 79 59 83 64 81 C 69 79 70 74 66 72"
          stroke={STEM} strokeWidth={SW * 0.82} fill="none" strokeLinecap="round"
        />
        <Ellipse cx={65} cy={80} rx={2.5} ry={4.5} fill={LEAF} stroke={LEAFD} strokeWidth={0.42} transform="rotate(-22 65 80)" />

        {/* ══════════════════════════════════════════
            SMALL STEM BUDS (on main vine between tendrils)
            ══════════════════════════════════════════ */}
        <Circle cx={28}  cy={71} r={2.3} fill={ROSE} stroke={ROSED} strokeWidth={0.60} />
        <Circle cx={28}  cy={70} r={1.2} fill="#FBDED4" />

        <Circle cx={162} cy={71} r={0} />
        <Circle cx={228} cy={72} r={2.3} fill={ROSE} stroke={ROSED} strokeWidth={0.60} />
        <Circle cx={228} cy={71} r={1.2} fill="#FBDED4" />

        <Circle cx={76}  cy={72} r={2.0} fill={ROSE} stroke={ROSED} strokeWidth={0.55} />
        <Circle cx={76}  cy={71} r={1.0} fill="#FBDED4" />

        <Circle cx={174} cy={71} r={2.0} fill={ROSE} stroke={ROSED} strokeWidth={0.55} />
        <Circle cx={174} cy={70} r={1.0} fill="#FBDED4" />

      </Svg>
    </View>
  );
}
