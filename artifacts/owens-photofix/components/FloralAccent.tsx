import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

const GOLD = "#C9960C";
const SW = 0.95;

interface Props {
  side: "left" | "right";
  size?: number;
}

export function FloralAccent({ side, size = 88 }: Props) {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        ...(side === "left" ? { left: 0 } : { right: 0 }),
        width: size,
        height: size,
        opacity: 0.32,
        transform: side === "right" ? [{ scaleX: -1 }] : [],
        pointerEvents: "none" as const,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 88 88">
        {/* Main curved stem descending from top-left corner */}
        <Path
          d="M 4 4 C 10 22 8 42 4 64"
          stroke={GOLD}
          strokeWidth={SW}
          fill="none"
          strokeLinecap="round"
        />

        {/* Branch reaching upper-right toward the logo */}
        <Path
          d="M 8 26 C 19 18 30 11 36 5"
          stroke={GOLD}
          strokeWidth={SW * 0.85}
          fill="none"
          strokeLinecap="round"
        />

        {/* 5-petal bloom at branch tip (centred ~36,5) */}
        <Path d="M 36 5 C 33 0 39 0 36 5"   stroke={GOLD} strokeWidth={SW * 0.78} fill="none" />
        <Path d="M 36 5 C 41 2 43 7 36 5"   stroke={GOLD} strokeWidth={SW * 0.78} fill="none" />
        <Path d="M 36 5 C 41 10 38 14 36 5"  stroke={GOLD} strokeWidth={SW * 0.78} fill="none" />
        <Path d="M 36 5 C 30 14 28 9 36 5"   stroke={GOLD} strokeWidth={SW * 0.78} fill="none" />
        <Path d="M 36 5 C 29 6 31 1 36 5"    stroke={GOLD} strokeWidth={SW * 0.78} fill="none" />
        <Circle cx="36" cy="5" r="1.3" stroke={GOLD} strokeWidth={SW * 0.7} fill="none" />

        {/* Pointed leaf on main stem, left side, ~y=16 */}
        <Path
          d="M 5 16 C 14 9 22 13 13 20 C 22 13 14 9 5 16"
          stroke={GOLD}
          strokeWidth={SW * 0.72}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Second branch lower down */}
        <Path
          d="M 5 43 C 15 37 23 31 27 24"
          stroke={GOLD}
          strokeWidth={SW * 0.82}
          fill="none"
          strokeLinecap="round"
        />

        {/* Teardrop bud at second branch tip */}
        <Path
          d="M 27 24 C 27 20 31 19 32 23 C 34 19 37 20 37 24 C 37 28 27 29 27 24"
          stroke={GOLD}
          strokeWidth={SW * 0.72}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Leaf on main stem ~y=52 */}
        <Path
          d="M 4 52 C 13 46 19 50 11 57 C 19 50 13 46 4 52"
          stroke={GOLD}
          strokeWidth={SW * 0.7}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Small closed bud near the bottom of stem */}
        <Path
          d="M 4 62 C 4 57 8 56 9 60 C 11 56 15 57 15 62 C 15 67 4 67 4 62"
          stroke={GOLD}
          strokeWidth={SW * 0.68}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tiny detached leaf floating near branch 1 */}
        <Path
          d="M 18 14 C 24 9 30 12 24 18 C 30 12 24 9 18 14"
          stroke={GOLD}
          strokeWidth={SW * 0.65}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
