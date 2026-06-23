import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  ONBOARDING_HINT_KEYS,
  ONBOARDING_HINT_LABELS,
  resetOnboardingHints,
  type OnboardingHintKey,
} from "@/lib/onboardingHints";

type HintState = Record<OnboardingHintKey, boolean | null>;

export default function DevSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [hintState, setHintState] = useState<HintState | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadHintState = useCallback(async () => {
    const pairs = await AsyncStorage.multiGet([...ONBOARDING_HINT_KEYS]);
    const result = {} as HintState;
    for (const [key, value] of pairs) {
      result[key as OnboardingHintKey] = value !== null;
    }
    setHintState(result);
  }, []);

  useEffect(() => {
    void loadHintState();
  }, [loadHintState]);

  const handleResetAll = () => {
    Alert.alert(
      "Reset All Hints",
      "This will clear every onboarding hint flag. All hints will show again on the next relevant action.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All",
          style: "destructive",
          onPress: async () => {
            setResetting(true);
            await resetOnboardingHints();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await loadHintState();
            setResetting(false);
          },
        },
      ],
    );
  };

  const handleResetOne = (key: OnboardingHintKey) => {
    Alert.alert(
      `Reset "${ONBOARDING_HINT_LABELS[key]}"`,
      `This will clear the "${ONBOARDING_HINT_LABELS[key]}" hint so it shows again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetOnboardingHints([key]);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await loadHintState();
          },
        },
      ],
    );
  };

  const seenCount = hintState
    ? ONBOARDING_HINT_KEYS.filter((k) => hintState[k]).length
    : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={GOLD} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerBadgeRow}>
            <View style={styles.devBadge}>
              <Ionicons name="code-slash" size={11} color={GOLD} />
              <Text style={styles.devBadgeText}>DEVELOPER</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Dev Settings</Text>
          <Text style={styles.headerSub}>v{Constants.expoConfig?.version ?? "—"}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadHintState} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ONBOARDING HINTS SECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="bulb-outline" size={15} color={GOLD} />
            <Text style={styles.sectionTitle}>Onboarding Hints</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {hintState ? `${seenCount} / ${ONBOARDING_HINT_KEYS.length} seen` : "loading…"}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>
            These flags track which first-run tips the user has already seen. A green tick means the hint has been shown and dismissed. Resetting a flag makes that hint appear again.
          </Text>

          {hintState === null ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={styles.loadingText}>Reading storage…</Text>
            </View>
          ) : (
            <View style={styles.hintList}>
              {ONBOARDING_HINT_KEYS.map((key) => {
                const seen = hintState[key];
                return (
                  <View key={key} style={styles.hintRow}>
                    <View style={styles.hintLeft}>
                      <View style={[styles.hintDot, { backgroundColor: seen ? "#34C759" : "#9CA3AF" }]} />
                      <View>
                        <Text style={styles.hintLabel}>{ONBOARDING_HINT_LABELS[key]}</Text>
                        <Text style={styles.hintKey}>{key}</Text>
                      </View>
                    </View>
                    <View style={styles.hintRight}>
                      <View style={[styles.hintStatusBadge, { backgroundColor: seen ? "#D1FAE5" : "#F3F4F6" }]}>
                        <Text style={[styles.hintStatusText, { color: seen ? "#059669" : "#6B7280" }]}>
                          {seen ? "seen" : "unseen"}
                        </Text>
                      </View>
                      {seen && (
                        <TouchableOpacity
                          style={styles.resetOneBtn}
                          onPress={() => handleResetOne(key)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="refresh-outline" size={14} color="#FF9F0A" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Reset All button */}
          <TouchableOpacity
            style={[styles.resetAllBtn, resetting && styles.resetAllBtnDisabled]}
            onPress={handleResetAll}
            disabled={resetting}
            activeOpacity={0.82}
          >
            {resetting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={17} color="#fff" />
                <Text style={styles.resetAllBtnText}>Reset All Hints</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── HOW TO ACCESS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle-outline" size={15} color={MUTED} />
            <Text style={[styles.sectionTitle, { color: MUTED }]}>Access</Text>
          </View>
          <Text style={styles.sectionDesc}>
            This screen is hidden from normal users. Tap the version number at the bottom of the home screen 5 times in quick succession to open it.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const GOLD = "#C9960C";
const MUTED = "#7A6E57";
const CREAM = "#FAF7F2";
const BG = "#0F0D09";
const CARD = "#1C1814";
const BORDER = "#2E2A24";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerBadgeRow: {
    marginBottom: 2,
  },
  devBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(201,150,12,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.35)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  devBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: CREAM,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: 16,
    gap: 20,
  },

  section: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: GOLD,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: "rgba(201,150,12,0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: GOLD,
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    lineHeight: 18,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: MUTED,
  },

  hintList: {
    gap: 1,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#17140F",
  },
  hintLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  hintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hintLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: CREAM,
  },
  hintKey: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    marginTop: 1,
  },
  hintRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  hintStatusText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  resetOneBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,159,10,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,159,10,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  resetAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C0392B",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  resetAllBtnDisabled: {
    opacity: 0.5,
  },
  resetAllBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
