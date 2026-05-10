import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type ProductType = "canvas" | "keyring" | "large" | "quilt";

interface Props {
  type: ProductType;
  photoUri: string | null;
  /** Fallback emoji shown when no photo is loaded */
  emoji: string;
  /** Fallback background colour shown when no photo is loaded */
  bg: string;
}

export function ProductMockup({ type, photoUri, emoji, bg }: Props) {
  if (!photoUri) {
    return (
      <View style={[styles.placeholder, { backgroundColor: bg }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
    );
  }

  switch (type) {
    case "canvas":
      return <CanvasMockup uri={photoUri} />;
    case "keyring":
      return <KeyringMockup uri={photoUri} />;
    case "large":
      return <LargePrintMockup uri={photoUri} />;
    case "quilt":
      return <QuiltMockup uri={photoUri} />;
  }
}

/* ── Canvas ─────────────────────────────────────────────────── */

function CanvasMockup({ uri }: { uri: string }) {
  return (
    <View style={styles.canvasOuter}>
      {/* 3D perspective container */}
      <View style={styles.canvasPerspective}>
        {/* Main face */}
        <View style={styles.canvasFace}>
          <Image source={{ uri }} style={styles.canvasPhoto} resizeMode="cover" />
          {/* Canvas wrap white border */}
          <View style={styles.canvasBorderOverlay} />
        </View>
        {/* Right depth edge */}
        <View style={styles.canvasEdgeRight} />
        {/* Bottom depth edge */}
        <View style={styles.canvasEdgeBottom} />
      </View>
    </View>
  );
}

/* ── Keyring ─────────────────────────────────────────────────── */

function KeyringMockup({ uri }: { uri: string }) {
  return (
    <View style={styles.keyringOuter}>
      {/* Ring */}
      <View style={styles.keyringRing} />
      {/* Circular photo */}
      <View style={styles.keyringCircle}>
        <Image source={{ uri }} style={styles.keyringPhoto} resizeMode="cover" />
        {/* Glossy highlight */}
        <View style={styles.keyringGloss} />
      </View>
      {/* Chain link */}
      <View style={styles.keyringChain} />
    </View>
  );
}

/* ── Large Format Print ──────────────────────────────────────── */

function LargePrintMockup({ uri }: { uri: string }) {
  return (
    <View style={styles.printOuter}>
      {/* Outer dark frame */}
      <View style={styles.printFrame}>
        {/* White mat */}
        <View style={styles.printMat}>
          <Image source={{ uri }} style={styles.printPhoto} resizeMode="cover" />
        </View>
      </View>
    </View>
  );
}

/* ── Quilt ───────────────────────────────────────────────────── */

function QuiltMockup({ uri }: { uri: string }) {
  const seams = [0.25, 0.5, 0.75];
  return (
    <View style={styles.quiltOuter}>
      <Image source={{ uri }} style={styles.quiltPhoto} resizeMode="cover" />
      {/* Horizontal seams */}
      {seams.map((pos) => (
        <View
          key={`h${pos}`}
          style={[styles.quiltSeamH, { top: `${pos * 100}%` }]}
        />
      ))}
      {/* Vertical seams */}
      {seams.map((pos) => (
        <View
          key={`v${pos}`}
          style={[styles.quiltSeamV, { left: `${pos * 100}%` }]}
        />
      ))}
      {/* Soft cloth edge vignette */}
      <View style={styles.quiltVignette} />
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */

const CARD_SIZE = 150;

const styles = StyleSheet.create({
  placeholder: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 48,
  },

  /* Canvas */
  canvasOuter: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EAF0",
    paddingVertical: 12,
  },
  canvasPerspective: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    transform: [
      { perspective: 600 },
      { rotateY: "-14deg" },
      { rotateX: "6deg" },
    ],
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  canvasFace: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  canvasPhoto: {
    width: "100%",
    height: "100%",
  },
  canvasBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 10,
    borderColor: "rgba(255,255,255,0.9)",
  },
  canvasEdgeRight: {
    position: "absolute",
    top: 4,
    right: -10,
    width: 10,
    height: CARD_SIZE - 4,
    backgroundColor: "#b0b0b0",
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    transform: [{ skewY: "2deg" }],
  },
  canvasEdgeBottom: {
    position: "absolute",
    bottom: -8,
    left: 4,
    width: CARD_SIZE - 4,
    height: 8,
    backgroundColor: "#c0c0c0",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    transform: [{ skewX: "-2deg" }],
  },

  /* Keyring */
  keyringOuter: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F5",
    gap: 0,
  },
  keyringRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#9E9E9E",
    backgroundColor: "transparent",
    marginBottom: -6,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  keyringCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1,
  },
  keyringPhoto: {
    width: "100%",
    height: "100%",
  },
  keyringGloss: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
    top: 0,
    height: "45%",
  },
  keyringChain: {
    width: 3,
    height: 12,
    backgroundColor: "#9E9E9E",
    borderRadius: 2,
    marginTop: -4,
    zIndex: 2,
  },

  /* Large Print */
  printOuter: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDEDED",
    padding: 8,
  },
  printFrame: {
    flex: 1,
    width: "100%",
    backgroundColor: "#2C2C2C",
    padding: 5,
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  printMat: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  printPhoto: {
    flex: 1,
    width: "100%",
  },

  /* Quilt */
  quiltOuter: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    position: "relative",
    borderRadius: 4,
  },
  quiltPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  quiltSeamH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  quiltSeamV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  quiltVignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 8,
    borderColor: "rgba(180,140,100,0.35)",
    borderRadius: 4,
  },
});
