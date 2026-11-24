// Warm "Pet Studio" palette — matches the app icon's cream/gold/brown look
// instead of the previous dark navy "DNA lab" theme. Token NAMES are kept
// unchanged (navy, navyMid, cream, etc.) since dozens of components
// reference them directly — only the hex VALUES moved to the new palette.
// navy/navyMid keep their old job (a dark color for contrast on gold
// buttons/panels), just re-hued from blue-black to warm espresso brown.
const colors = {
  light: {
    text: "#3b2a1d",
    tint: "#e3a93c",

    background: "#fbf3e3",
    foreground: "#3b2a1d",

    card: "#fff9ed",
    cardForeground: "#3b2a1d",

    primary: "#e3a93c",
    primaryForeground: "#2e2013",

    secondary: "#f3dfb8",
    secondaryForeground: "#5c4027",

    muted: "#f6ead3",
    mutedForeground: "#8a7259",

    accent: "#e3a93c",
    accentForeground: "#2e2013",

    destructive: "#d9534f",
    destructiveForeground: "#ffffff",

    border: "#ead9b8",
    input: "#fff9ed",

    gold: "#e3a93c",
    goldLight: "#f0ce85",
    navy: "#2e2013",
    navyLight: "#4a3423",
    navyMid: "#5c4027",
    cream: "#fff9ed",
    creamMuted: "#e8d4ae",
  },
  radius: 12,
};

export default colors;
