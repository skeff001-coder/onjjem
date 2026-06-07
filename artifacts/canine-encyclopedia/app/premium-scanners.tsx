import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { UnlockButton } from "@/components/UnlockButton";
import {
  useSubscription,
  PACKAGE_MIXED_BREED,
  PACKAGE_AGE_CALC,
  PACKAGE_PERSONALITY,
  IS_SANDBOX_MODE,
} from "@/lib/revenuecat";
import Purchases from "react-native-purchases";

const { width } = Dimensions.get("window");

/* Scan type mapping for the pending scan context */
const SCAN_TYPE_MAP: Record<string, string> = {
  mixed_dna: "mixed_dna",
  age_calc: "age_calc",
  personality: "personality",
};
const CARD_WIDTH = width - 32;

interface PremiumScannerDef {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  packageId: string;
  fallbackPrice: string;
  features: string[];
}

const PREMIUM_SCANNERS: PremiumScannerDef[] = [
  {
    id: "mixed_dna",
    title: "Mixed Breed DNA",
    subtitle: "Genetic heritage breakdown",
    description: "Discover your dog's ancestral breeds, genetic markers, and full heritage tree.",
    icon: "git-merge-outline",
    color: "#FF2D78",
    packageId: PACKAGE_MIXED_BREED,
    fallbackPrice: "99p",
    features: [
      "Ancestral breed breakdown",
      "Genetic marker analysis",
      "Full heritage tree",
      "Shareable results",
    ],
  },
  {
    id: "age_calc",
    title: "Age Calculator",
    subtitle: "Visual age estimation",
    description: "Our AI reads coat condition, eye clarity, and muscle tone to estimate your dog's age.",
    icon: "hourglass-outline",
    color: "#00F5FF",
    packageId: PACKAGE_AGE_CALC,
    fallbackPrice: "99p",
    features: [
      "Visual age estimation",
      "Life stage analysis",
      "Birthday prediction",
      "Health insights",
    ],
  },
  {
    id: "personality",
    title: "Personality Matcher",
    subtitle: "Shareable viral results",
    description: "Analyse your dog's expression and posture to reveal their dominant traits, social style, and energy level.",
    icon: "happy-outline",
    color: "#B24BF3",
    packageId: PACKAGE_PERSONALITY,
    fallbackPrice: "99p",
    features: [
      "Dominant trait analysis",
      "Social style profile",
      "Energy level scoring",
      "Viral shareable results",
    ],
  },
];

function PremiumScannerCard({
  def,
  index,
  owned,
  priceString,
  priceLoading,
  onPurchase,
  onStartScan,
}: {
  def: PremiumScannerDef;
  index: number;
  owned: boolean;
  priceString?: string;
  priceLoading?: boolean;
  onPurchase: () => void;
  onStartScan: () => void;
}) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [anim, index]);

  const nativeDriver = Platform.OS !== "web";
  const handleHoverIn = () => {
    setHovered(true);
    Animated.spring(scale, { toValue: 1.02, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handleHoverOut = () => {
    setHovered(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 30, bounciness: 4 }).start();
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const handlePress = () => {
    if (owned) {
      onStartScan();
    } else {
      onPurchase();
    }
  };

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity, width: CARD_WIDTH }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.card,
          {
            borderColor: hovered ? def.color : "rgba(255,255,255,0.08)",
            borderWidth: hovered ? 1.5 : 1,
            shadowColor: def.color,
            shadowOpacity: hovered ? 0.2 : 0.06,
            shadowRadius: hovered ? 16 : 6,
          },
        ]}
        {...(Platform.OS === "web" ? {
          onPointerEnter: handleHoverIn,
          onPointerLeave: handleHoverOut,
        } as any : {})}
      >
        {/* Status badge */}
        {owned ? (
          <View style={[styles.ownedBadge, { backgroundColor: def.color + "22", borderColor: def.color + "44" }]}>
            <Ionicons name="checkmark-circle" size={12} color={def.color} />
            <Text style={[styles.ownedBadgeText, { color: def.color }]}>Unlocked</Text>
          </View>
        ) : (
          <View style={[styles.premiumBadge, { backgroundColor: def.color }]}>
            {priceLoading && !priceString ? (
              <ActivityIndicator size="small" color="#0a0e1a" style={{ width: 40, height: 16 }} />
            ) : (
              <Text style={styles.premiumBadgeText}>{priceString ?? def.fallbackPrice}</Text>
            )}
          </View>
        )}

        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: def.color + "18" }]}>
            <Ionicons name={def.icon as any} size={28} color={def.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{def.title}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>{def.subtitle}</Text>
          </View>
        </View>

        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{def.description}</Text>

        <View style={styles.featuresList}>
          {def.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={14} color={def.color} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
            </View>
          ))}
        </View>

        {owned ? (
          <View style={[styles.ownedBtn, { backgroundColor: def.color + "22", borderColor: def.color + "44" }]}>
            <Ionicons name="scan-outline" size={16} color={def.color} />
            <Text style={[styles.ownedBtnText, { color: def.color }]}>Start Scan</Text>
          </View>
        ) : (
          <UnlockButton
            packageId={def.packageId}
            onPress={onPurchase}
            color={def.color}
            fallbackPrice={def.fallbackPrice}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PremiumScannersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setPendingScanType } = useApp();
  const { hasMixedBreed, hasAgeCalc, hasPersonality, packageFor, purchase, restore, isPurchasing, isRestoring, isLoading: isPriceLoading } = useSubscription();

  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<PremiumScannerDef | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const purchasePriceFor = (def: PremiumScannerDef) => {
    const rcPrice = packageFor(def.packageId)?.product.priceString;
    return rcPrice ?? def.fallbackPrice;
  };

  const isOwned = (def: PremiumScannerDef) => {
    if (def.id === "mixed_dna") return hasMixedBreed;
    if (def.id === "age_calc") return hasAgeCalc;
    if (def.id === "personality") return hasPersonality;
    return false;
  };

  const handlePurchaseTap = (def: PremiumScannerDef) => {
    setPurchaseTarget(def);
    setPurchaseModalVisible(true);
  };

  const handleStartScan = (def: PremiumScannerDef) => {
    // Set pending scan type so the Scanner tab auto-starts it
    const scanType = SCAN_TYPE_MAP[def.id];
    if (scanType) {
      setPendingScanType(scanType);
    }
    router.back();
  };

  const handlePurchase = async () => {
    if (!purchaseTarget?.packageId) return;

    let pkg = packageFor(purchaseTarget.packageId);

    if (!pkg) {
      try {
        const freshOfferings = await Purchases.getOfferings();
        pkg = freshOfferings.current?.availablePackages.find(
          (p: any) => p.identifier === purchaseTarget.packageId
        );
      } catch {
        // Re-fetch failed
      }
    }

    if (!pkg) {
      Alert.alert("Product Unavailable", "This product is loading. Please check your internet connection and try again.");
      return;
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBuying(true);
    try {
      await purchase(pkg);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPurchaseModalVisible(false);
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert("Purchase failed", e?.message ?? "Please try again.");
    } finally {
      setIsBuying(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Premium Scanners</Text>
          <Text style={[styles.headerSub, { color: colors.gold }]}>One-time unlocks</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {IS_SANDBOX_MODE && (
        <View style={styles.sandboxBanner}>
          <Ionicons name="flask-outline" size={13} color="#e8a838" />
          <Text style={styles.sandboxText}>Sandbox mode — no real charges</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 16, paddingHorizontal: 16, paddingTop: 8 }}
      >
        {PREMIUM_SCANNERS.map((def, i) => (
          <PremiumScannerCard
            key={def.id}
            def={def}
            index={i}
            owned={isOwned(def)}
            priceString={purchasePriceFor(def)}
            priceLoading={isPriceLoading}
            onPurchase={() => handlePurchaseTap(def)}
            onStartScan={() => handleStartScan(def)}
          />
        ))}

        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>Restore purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          One-time purchases. No recurring charges. Payments processed securely via Apple.
        </Text>
      </ScrollView>

      {/* Purchase Modal */}
      <Modal visible={purchaseModalVisible} animationType="fade" transparent onRequestClose={() => setPurchaseModalVisible(false)}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }]}>
          <View style={[styles.purchaseCard, { backgroundColor: colors.card, borderColor: colors.gold + "44" }]}>
            {IS_SANDBOX_MODE && (
              <View style={styles.sandboxBanner}>
                <Ionicons name="flask-outline" size={13} color="#e8a838" />
                <Text style={styles.sandboxText}>Sandbox — no real charges</Text>
              </View>
            )}
            {purchaseTarget && (
              <>
                <View style={[styles.purchaseIcon, { backgroundColor: purchaseTarget.color + "22" }]}>
                  <Ionicons name={purchaseTarget.icon as any} size={32} color={purchaseTarget.color} />
                </View>
                <Text style={[styles.purchaseTitle, { color: colors.foreground }]}>{purchaseTarget.title}</Text>
                <Text style={[styles.purchaseDesc, { color: colors.mutedForeground }]}>{purchaseTarget.description}</Text>
                <Text style={[styles.purchaseSub, { color: colors.mutedForeground }]}>One-time purchase. No subscription.</Text>
                <UnlockButton
                  packageId={purchaseTarget.packageId}
                  onPress={handlePurchase}
                  color={purchaseTarget.color}
                  loading={isBuying}
                  fallbackPrice={purchaseTarget.fallbackPrice}
                  style={styles.purchaseBtn}
                />
                <TouchableOpacity onPress={() => setPurchaseModalVisible(false)} style={{ paddingVertical: 8 }}>
                  <Text style={[styles.purchaseCancel, { color: colors.mutedForeground }]}>Not now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
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
  card: {
    backgroundColor: "#0e1322",
    borderRadius: 18,
    padding: 18,
    gap: 12,
    position: "relative",
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  premiumBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#0a0e1a",
    letterSpacing: 0.5,
  },
  ownedBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  ownedBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  featuresList: {
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  ownedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  ownedBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  legal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  purchaseCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    gap: 14,
    alignItems: "center",
    overflow: "hidden",
  },
  purchaseIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  purchaseDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
  purchaseSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  purchaseBtn: {
    width: "100%",
    marginTop: 4,
  },
  purchaseCancel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
