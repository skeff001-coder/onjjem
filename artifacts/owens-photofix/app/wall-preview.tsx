import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";
const PANEL_WIDTH_CM = 62.5;

const { width: SCREEN_W } = Dimensions.get("window");
const CANVAS_H_PX = 220;

function SeamCanvas({
  wallWidthCm,
  wallHeightCm,
}: {
  wallWidthCm: number;
  wallHeightCm: number;
}) {
  const canvasW = SCREEN_W - 36;
  const panelCount = Math.ceil(wallWidthCm / PANEL_WIDTH_CM);
  const panelWidthPx = (PANEL_WIDTH_CM / wallWidthCm) * canvasW;

  const seams: number[] = [];
  for (let i = 1; i < panelCount; i++) {
    seams.push(i * panelWidthPx);
  }

  const panels = Array.from({ length: panelCount }, (_, i) => i);

  return (
    <View style={[sc.canvas, { width: canvasW, height: CANVAS_H_PX }]}>
      {/* Wall background gradient */}
      <LinearGradient
        colors={["#2E2A1E", "#1C1A14", "#2E2A1E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Panel backgrounds alternating subtle tint */}
      {panels.map((i) => (
        <View
          key={i}
          style={[
            sc.panelBg,
            {
              left: i * panelWidthPx,
              width: Math.min(panelWidthPx, canvasW - i * panelWidthPx),
              backgroundColor:
                i % 2 === 0
                  ? "rgba(201,150,12,0.04)"
                  : "rgba(201,150,12,0.08)",
            },
          ]}
        />
      ))}

      {/* Photo-fill hint text */}
      <View style={sc.photoHint}>
        <Text style={sc.photoHintText}>Your restored photo fills this entire wall</Text>
      </View>

      {/* Seam lines */}
      {seams.map((x, i) => (
        <View key={i} style={[sc.seam, { left: x }]}>
          <View style={sc.seamLine} />
          <View style={sc.seamLabel}>
            <Text style={sc.seamLabelText}>SEAM</Text>
          </View>
        </View>
      ))}

      {/* Panel labels */}
      {panels.map((i) => {
        const labelLeft = i * panelWidthPx + 4;
        const labelWidth = Math.min(panelWidthPx - 8, canvasW - labelLeft - 4);
        if (labelWidth < 20) return null;
        return (
          <View
            key={i}
            style={[sc.panelLabel, { left: labelLeft, width: labelWidth }]}
          >
            <Text style={sc.panelLabelText} numberOfLines={1}>
              {String(i + 1).padStart(2, "0")}
            </Text>
          </View>
        );
      })}

      {/* Dimension ruler — bottom */}
      <View style={sc.ruler}>
        <View style={sc.rulerLine} />
        <Text style={sc.rulerText}>{wallWidthCm} cm wide</Text>
        <View style={sc.rulerLine} />
      </View>

      {/* Height label — right side */}
      <View style={sc.heightLabel} pointerEvents="none">
        <Text style={sc.heightLabelText}>{wallHeightCm} cm</Text>
      </View>
    </View>
  );
}

export default function WallPreviewScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 72) : insets.top;
  const router = useRouter();

  const [widthCm, setWidthCm] = useState(300);
  const [heightCm, setHeightCm] = useState(240);

  const panelCount = Math.ceil(widthCm / PANEL_WIDTH_CM);
  const areaSqM = (widthCm / 100) * (heightCm / 100);
  const estimatedCost = Math.ceil(areaSqM * 45);

  function changeWidth(delta: number) {
    setWidthCm((w) => Math.max(50, Math.min(600, w + delta)));
  }
  function changeHeight(delta: number) {
    setHeightCm((h) => Math.max(100, Math.min(400, h + delta)));
  }

  const PRESETS = [
    { label: "Small", w: 150, h: 220 },
    { label: "Standard", w: 240, h: 240 },
    { label: "Large", w: 360, h: 260 },
    { label: "Full Room", w: 480, h: 280 },
  ];

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      <LinearGradient
        colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.goldBar}
      />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerEyebrow}>ONJJEM</Text>
          <Text style={s.headerTitle}>Seam Preview</Text>
        </View>
        <View style={s.headerRight} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={s.introBlock}>
          <View style={s.introBadge}>
            <Ionicons name="eye-outline" size={13} color={GOLD} />
            <Text style={s.introBadgeText}>PANEL SEAM VISUALISER</Text>
          </View>
          <Text style={s.introTitle}>See Exactly Where Your Seams Will Fall</Text>
          <Text style={s.introBody}>
            Our wallpaper is printed in panels {PANEL_WIDTH_CM} cm wide. Each panel joins at a precision-cut seam that is virtually invisible once hung. Use this tool to see exactly how many panels your wall needs and where each seam will sit — so you can plan your crop before you order.
          </Text>
        </View>

        {/* Canvas */}
        <View style={s.canvasWrap}>
          <SeamCanvas wallWidthCm={widthCm} wallHeightCm={heightCm} />
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{panelCount}</Text>
            <Text style={s.statLabel}>Panels</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCard}>
            <Text style={s.statValue}>{PANEL_WIDTH_CM} cm</Text>
            <Text style={s.statLabel}>Each panel</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCard}>
            <Text style={s.statValue}>£{estimatedCost}</Text>
            <Text style={s.statLabel}>Est. price</Text>
          </View>
        </View>

        {/* Quick presets */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>QUICK PRESETS</Text>
          <View style={s.presetRow}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={[
                  s.presetChip,
                  widthCm === p.w && heightCm === p.h && s.presetChipActive,
                ]}
                onPress={() => {
                  setWidthCm(p.w);
                  setHeightCm(p.h);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    s.presetLabel,
                    widthCm === p.w && heightCm === p.h && s.presetLabelActive,
                  ]}
                >
                  {p.label}
                </Text>
                <Text
                  style={[
                    s.presetSize,
                    widthCm === p.w && heightCm === p.h && s.presetSizeActive,
                  ]}
                >
                  {p.w}×{p.h}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Width control */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>WALL WIDTH</Text>
          <View style={s.controlRow}>
            <TouchableOpacity style={s.stepBtn} onPress={() => changeWidth(-10)} activeOpacity={0.7}>
              <Ionicons name="remove" size={22} color={DARK} />
            </TouchableOpacity>
            <View style={s.controlValue}>
              <Text style={s.controlValueNum}>{widthCm}</Text>
              <Text style={s.controlValueUnit}>cm</Text>
            </View>
            <TouchableOpacity style={s.stepBtn} onPress={() => changeWidth(10)} activeOpacity={0.7}>
              <Ionicons name="add" size={22} color={DARK} />
            </TouchableOpacity>
          </View>
          <View style={s.controlHints}>
            {[100, 150, 200, 250, 300, 360, 420, 480].map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.hintChip, widthCm === v && s.hintChipActive]}
                onPress={() => setWidthCm(v)}
                activeOpacity={0.7}
              >
                <Text style={[s.hintChipText, widthCm === v && s.hintChipTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Height control */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>WALL HEIGHT</Text>
          <View style={s.controlRow}>
            <TouchableOpacity style={s.stepBtn} onPress={() => changeHeight(-10)} activeOpacity={0.7}>
              <Ionicons name="remove" size={22} color={DARK} />
            </TouchableOpacity>
            <View style={s.controlValue}>
              <Text style={s.controlValueNum}>{heightCm}</Text>
              <Text style={s.controlValueUnit}>cm</Text>
            </View>
            <TouchableOpacity style={s.stepBtn} onPress={() => changeHeight(10)} activeOpacity={0.7}>
              <Ionicons name="add" size={22} color={DARK} />
            </TouchableOpacity>
          </View>
          <View style={s.controlHints}>
            {[180, 200, 220, 240, 260, 280, 300].map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.hintChip, heightCm === v && s.hintChipActive]}
                onPress={() => setHeightCm(v)}
                activeOpacity={0.7}
              >
                <Text style={[s.hintChipText, heightCm === v && s.hintChipTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seam info box */}
        <LinearGradient colors={["#1C1A14", "#2A2215"]} style={s.infoBox}>
          <View style={s.infoRow}>
            <Ionicons name="information-circle-outline" size={17} color={GOLD} />
            <Text style={s.infoTitle}>About Seams</Text>
          </View>
          <Text style={s.infoBody}>
            Each wallpaper panel is precisely {PANEL_WIDTH_CM} cm wide. The seams are laser-cut and colour-matched to be virtually invisible once the paper is hung flat. Our hanging guide is included with every order — or any local decorator can hang it in under an hour.
          </Text>
          <Text style={[s.infoBody, { marginTop: 8 }]}>
            For walls wider than one panel, position your key subject (a face, a focal point) in the centre of a panel — away from any seam line. Use this canvas to plan that position before you order.
          </Text>
        </LinearGradient>

        {/* CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => router.push("/feature-walls")}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={[GOLD, "#A67C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaBtnGradient}
          >
            <Ionicons name="home-outline" size={22} color="#fff" />
            <View style={s.ctaBtnText}>
              <Text style={s.ctaBtnPrimary}>Start My Mural — {widthCm}×{heightCm} cm</Text>
              <Text style={s.ctaBtnSub}>Est. £{estimatedCost} · {panelCount} panels · Get an exact quote →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  canvas: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    position: "relative",
  },
  panelBg: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  photoHint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  photoHintText: {
    fontSize: 11,
    color: "rgba(245,237,216,0.35)",
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  seam: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    alignItems: "center",
  },
  seamLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  seamLabel: {
    position: "absolute",
    top: 8,
    backgroundColor: "rgba(201,150,12,0.75)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    transform: [{ translateX: -12 }],
  },
  seamLabelText: {
    fontSize: 7,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  panelLabel: {
    position: "absolute",
    bottom: 36,
    alignItems: "center",
  },
  panelLabelText: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.1)",
    textAlign: "center",
  },
  ruler: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  rulerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(201,150,12,0.5)",
  },
  rulerText: {
    fontSize: 10,
    color: GOLD,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  heightLabel: {
    position: "absolute",
    right: 6,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  heightLabelText: {
    fontSize: 9,
    color: "rgba(245,237,216,0.4)",
    fontFamily: "Inter_400Regular",
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  goldBar: { height: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
    backgroundColor: CREAM,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 1 },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  headerRight: { width: 40 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 0 },

  introBlock: {
    paddingTop: 24,
    paddingBottom: 18,
    gap: 10,
    alignItems: "flex-start",
  },
  introBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  introBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
    lineHeight: 28,
  },
  introBody: {
    fontSize: 13,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },

  canvasWrap: {
    alignItems: "center",
    marginBottom: 12,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    marginBottom: 20,
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: GOLD_BORDER,
    marginVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  statLabel: {
    fontSize: 11,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },

  section: {
    marginBottom: 20,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2.5,
  },

  presetRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetChip: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  presetChipActive: {
    backgroundColor: GOLD_BG,
    borderColor: GOLD,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  presetLabelActive: { color: GOLD },
  presetSize: {
    fontSize: 9,
    color: MUTED,
    fontFamily: "Inter_400Regular",
  },
  presetSizeActive: { color: GOLD },

  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    overflow: "hidden",
  },
  stepBtn: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD_BG,
  },
  controlValue: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  controlValueNum: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  controlValueUnit: {
    fontSize: 14,
    color: MUTED,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },
  controlHints: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  hintChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  hintChipActive: {
    backgroundColor: GOLD_BG,
    borderColor: GOLD,
  },
  hintChipText: {
    fontSize: 12,
    color: MUTED,
    fontFamily: "Inter_400Regular",
  },
  hintChipTextActive: {
    color: GOLD,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },

  infoBox: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.2)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
  },
  infoBody: {
    fontSize: 12,
    color: "#C8BBAA",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },

  ctaBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 12,
  },
  ctaBtnText: { flex: 1, gap: 2 },
  ctaBtnPrimary: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  ctaBtnSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
});
