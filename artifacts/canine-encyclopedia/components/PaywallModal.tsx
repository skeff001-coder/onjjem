import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Linking,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Purchases from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useSubscription,
  IS_SANDBOX_MODE,
  PACKAGE_LINEAGE,
  PACKAGE_GROOMING,
  PACKAGE_BLUEPRINT,
  ENTITLEMENT_LINEAGE,
  ENTITLEMENT_GROOMING,
  ENTITLEMENT_BLUEPRINT,
} from "@/lib/revenuecat";
import { UnlockButton } from "@/components/UnlockButton";

export type PaywallFocus = "lineage" | "grooming" | "blueprint" | "all";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  breedName?: string;
  focus?: PaywallFocus;
}

const TIERS = [
  {
    key: PACKAGE_LINEAGE,
    entitlement: ENTITLEMENT_LINEAGE,
    label: "Ancient Lineage Report",
    price: "£0.99",
    icon: "git-branch-outline" as const,
    color: "#9b7dcf",
    features: [
      "Wolf ancestry & ancient lineage",
      "Origin country deep-dive",
      "Evolutionary timeline",
      "First recorded breed use",
    ],
  },
  {
    key: PACKAGE_GROOMING,
    entitlement: ENTITLEMENT_GROOMING,
    label: "Masterclass Grooming",
    price: "£0.99",
    icon: "cut-outline" as const,
    color: "#4a9eca",
    features: [
      "Safe nail trimming guide",
      "Nose leather care protocol",
      "Paw pad hygiene steps",
      "Parasite & worm identification",
      "Coat care masterclass",
    ],
  },
  {
    key: PACKAGE_BLUEPRINT,
    entitlement: ENTITLEMENT_BLUEPRINT,
    label: "Complete Breed Blueprint",
    price: "£1.49",
    icon: "trophy-outline" as const,
    color: "#c9a84c",
    badge: "BEST VALUE",
    features: [
      "Everything in Lineage Report",
      "Everything in Grooming Masterclass",
      "Health diagnostics & lifespan data",
      "Genetic predispositions & risks",
      "Exercise & nutrition guide",
      "Full breed blueprint — all data",
    ],
  },
];

export function PaywallModal({ visible, onClose, breedName, focus = "all" }: PaywallModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    packageFor,
    purchase,
    restore,
    isPurchasing,
    isRestoring,
    isOfferingsFetching,
    hasLineage,
    hasGrooming,
    hasBlueprint,
  } = useSubscription();

  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);

  const isOwned = (tier: typeof TIERS[0]) => {
    if (tier.entitlement === ENTITLEMENT_LINEAGE) return hasLineage;
    if (tier.entitlement === ENTITLEMENT_GROOMING) return hasGrooming;
    if (tier.entitlement === ENTITLEMENT_BLUEPRINT) return hasBlueprint;
    return false;
  };

  const [webPromptVisible, setWebPromptVisible] = useState(false);

  const handlePurchase = async (tierKey: string) => {
    if (Platform.OS === "web") {
      setWebPromptVisible(true);
      return;
    }

    let pkg = packageFor(tierKey);

    // If package not found, try re-fetching offerings directly from the SDK
    if (!pkg) {
      try {
        const freshOfferings = await Purchases.getOfferings();
        pkg = freshOfferings.current?.availablePackages.find(
          (p) => p.identifier === tierKey
        );
      } catch {
        // Re-fetch failed
      }
    }

    if (!pkg) {
      Alert.alert(
        "Product Unavailable",
        "This product is loading. Please check your internet connection and try again in a few moments."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasingKey(tierKey);
    try {
      await purchase(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (e: any) {
      if (!e?.userCancelled) {
        Alert.alert("Purchase failed", e?.message ?? "Please try again.");
      }
    } finally {
      setPurchasingKey(null);
    }
  };

  const handleRestore = async () => {
    if (Platform.OS === "web") {
      setWebPromptVisible(true);
      return;
    }
    try {
      await restore();
      onClose();
    } catch {}
  };

  const visibleTiers = focus === "all"
    ? TIERS
    : focus === "lineage"
    ? [TIERS[0], TIERS[2]]
    : focus === "grooming"
    ? [TIERS[1], TIERS[2]]
    : TIERS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.topBar}>
          <View style={styles.handle} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {IS_SANDBOX_MODE && (
          <View style={styles.sandboxBanner}>
            <Ionicons name="flask-outline" size={13} color="#e8a838" />
            <Text style={styles.sandboxText}>Sandbox mode — no real charges</Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={[styles.iconRing, { borderColor: colors.gold }]}>
              <Ionicons name="lock-open-outline" size={28} color={colors.gold} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Unlock Knowledge</Text>
            {breedName && (
              <Text style={[styles.subtitle, { color: colors.gold }]}>{breedName}</Text>
            )}
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>
              One-time unlocks. No subscription.{"\n"}Own it forever.
            </Text>
          </View>

          <View style={styles.tiers}>
            {visibleTiers.map((tier) => {
              const owned = isOwned(tier);
              const loading = purchasingKey === tier.key && isPurchasing;
              return (
                <View
                  key={tier.key}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: owned ? tier.color : colors.border,
                      borderWidth: owned ? 2 : 1,
                    },
                  ]}
                >
                  {"badge" in tier && tier.badge && (
                    <View style={[styles.badgeWrap, { backgroundColor: tier.color }]}>
                      <Text style={[styles.badgeText, { color: colors.navy }]}>{tier.badge}</Text>
                    </View>
                  )}
                  <View style={styles.tierTop}>
                    <View style={[styles.tierIcon, { backgroundColor: tier.color + "22" }]}>
                      <Ionicons name={tier.icon} size={22} color={tier.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tierLabel, { color: colors.foreground }]}>{tier.label}</Text>
                    </View>
                    {isOfferingsFetching && !packageFor(tier.key) ? (
                      <ActivityIndicator size="small" color={tier.color} style={styles.tierPriceSpinner} />
                    ) : (
                      <Text style={[styles.tierPrice, { color: tier.color }]}>
                        {packageFor(tier.key)?.product.priceString ?? tier.price}
                      </Text>
                    )}
                  </View>

                  <View style={styles.tierFeatures}>
                    {tier.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Ionicons
                          name={owned ? "checkmark-circle" : "checkmark-circle-outline"}
                          size={14}
                          color={owned ? tier.color : colors.mutedForeground}
                        />
                        <Text style={[styles.featureText, { color: owned ? colors.foreground : colors.mutedForeground }]}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {owned ? (
                    <View style={[styles.ownedBadge, { backgroundColor: tier.color + "22", borderColor: tier.color + "44" }]}>
                      <Ionicons name="checkmark-circle" size={14} color={tier.color} />
                      <Text style={[styles.ownedText, { color: tier.color }]}>Unlocked</Text>
                    </View>
                  ) : (
                    <UnlockButton
                      packageId={tier.key}
                      onPress={() => handlePurchase(tier.key)}
                      color={tier.color}
                      loading={loading}
                      disabled={isPurchasing && purchasingKey !== tier.key || isRestoring}
                      style={styles.buyBtn}
                    />
                  )}
                </View>
              );
            })}
          </View>

          <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>Restore purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.legal, { color: colors.mutedForeground }]}>
            One-time purchases. No recurring charges. Payments processed securely via Apple / Google.
          </Text>
        </ScrollView>
      </View>

      {/* Web — inline prompt instead of Alert.alert */}
      {webPromptVisible && (
        <View style={[styles.webPromptOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <View style={[styles.webPromptCard, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}>
            <Ionicons name="phone-portrait-outline" size={36} color={colors.gold} />
            <Text style={[styles.webPromptTitle, { color: colors.foreground }]}>Get the App</Text>
            <Text style={[styles.webPromptBody, { color: colors.mutedForeground }]}>
              Purchases unlock inside the What's Up Dog! iOS app.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://apps.apple.com/app/id6771118261")}
              style={[styles.webPromptBtn, { backgroundColor: colors.gold }]}
            >
              <Text style={[styles.webPromptBtnText, { color: colors.navy }]}>Download from App Store</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWebPromptVisible(false)} style={styles.webPromptClose}>
              <Text style={[styles.webPromptCloseText, { color: colors.mutedForeground }]}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    alignItems: "center",
    paddingTop: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a4558",
    marginBottom: 4,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 14,
    padding: 8,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  header: { alignItems: "center", gap: 8, paddingBottom: 20 },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  subtitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  desc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  tiers: { gap: 14 },
  tierCard: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
    gap: 12,
    position: "relative",
  },
  badgeWrap: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tierTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tierLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  tierPrice: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  tierPriceSpinner: { width: 36, height: 22 },
  tierFeatures: { gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  ownedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
  },
  ownedText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  buyBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  restoreBtn: { alignItems: "center", paddingVertical: 16 },
  restoreText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  legal: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
  webPromptOverlay: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  webPromptCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    gap: 14,
    alignItems: "center",
  },
  webPromptTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  webPromptBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  webPromptBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  webPromptBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  webPromptClose: { paddingVertical: 6 },
  webPromptCloseText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sandboxBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: "rgba(232,168,56,0.12)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(232,168,56,0.3)",
  },
  sandboxText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#e8a838",
    letterSpacing: 0.2,
  },
});
