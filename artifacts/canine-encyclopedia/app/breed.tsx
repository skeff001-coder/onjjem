import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Share,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Purchases from "react-native-purchases";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { KnowledgeSection, InfoRow, TagList } from "@/components/KnowledgeSection";
import { MerchSheet } from "@/components/MerchSheet";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = width * 0.42;

function breedSlug(breedName: string): string[] {
  const lower = breedName.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const candidates: string[] = [];

  if (words.length >= 2) {
    // Try "lastword/restjoined" e.g. retriever/golden
    candidates.push(`${words[words.length - 1]}/${words.slice(0, -1).join("-")}`);
    // Try last word alone
    candidates.push(words[words.length - 1]);
    // Try first word alone
    candidates.push(words[0]);
    // Try all words joined
    candidates.push(words.join(""));
  } else {
    candidates.push(lower);
  }
  return candidates;
}

async function fetchBreedPhotos(breedName: string, count = 12): Promise<string[]> {
  const slugs = breedSlug(breedName);
  for (const slug of slugs) {
    try {
      const res = await fetch(`https://dog.ceo/api/breed/${slug}/images/random/${count}`);
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.message) && data.message.length > 0) {
        return data.message;
      }
    } catch {
      // try next slug
    }
  }
  // Fallback: random dog photos
  try {
    const res = await fetch(`https://dog.ceo/api/breeds/image/random/${count}`);
    const data = await res.json();
    if (Array.isArray(data.message)) return data.message;
  } catch {}
  return [];
}

const SOCIALS = [
  { id: "whatsapp",  label: "WhatsApp",  emoji: "💬", color: "#25D366", bg: "#25D36618" },
  { id: "facebook",  label: "Facebook",  emoji: "📘", color: "#1877F2", bg: "#1877F218" },
  { id: "tiktok",    label: "TikTok",    emoji: "🎵", color: "#ff0050",  bg: "#ff005018" },
  { id: "instagram", label: "Instagram", emoji: "📸", color: "#C13584", bg: "#C1358418" },
  { id: "more",      label: "More",      emoji: "↗️",  color: "#c9a84c", bg: "#c9a84c18" },
] as const;

async function trackShare(platform: string, breed: string) {
  try {
    await Purchases.setAttributes({
      last_share_platform: platform,
      last_share_breed: breed,
      shared_app: "true",
    });
  } catch {}
}

function buildShareText(breed: string, dogName: string) {
  const name = dogName ? `${dogName} the` : "my";
  return `🐾 Just found out ${name} ${breed} with What's Up Dog! — the ultimate dog encyclopedia.\n\nDiscover yours 👇\nhttps://onjjem.com\n\n#WhatsUpDog #DogEncyclopedia #${breed.replace(/\s+/g, "")}`;
}

interface ShareStripProps {
  breed: string;
  dogName: string;
}

function ShareStrip({ breed, dogName }: ShareStripProps) {
  const colors = useColors();
  const text = buildShareText(breed, dogName);
  const encoded = encodeURIComponent(text);

  const handlePress = async (id: (typeof SOCIALS)[number]["id"]) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await trackShare(id, breed);

    try {
      if (id === "whatsapp") {
        const url = `whatsapp://send?text=${encoded}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) { await Linking.openURL(url); return; }
        await Linking.openURL(`https://wa.me/?text=${encoded}`);
      } else if (id === "facebook") {
        const url = `fb://facewebmodal/f?href=${encodeURIComponent("https://onjjem.com")}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) { await Linking.openURL(url); return; }
        await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://onjjem.com")}&quote=${encoded}`);
      } else if (id === "tiktok") {
        const canOpen = await Linking.canOpenURL("tiktok://");
        if (canOpen) {
          await Share.share({ message: text });
        } else {
          await Linking.openURL(`https://www.tiktok.com`);
        }
      } else if (id === "instagram") {
        const canOpen = await Linking.canOpenURL("instagram://");
        if (canOpen) {
          await Share.share({ message: text });
        } else {
          await Linking.openURL(`https://www.instagram.com`);
        }
      } else {
        await Share.share({ message: text, url: "https://onjjem.com" });
      }
    } catch (e: any) {
      if (!e?.message?.includes("cancel")) {
        Alert.alert("Couldn't share", "Please try again.");
      }
    }
  };

  return (
    <View style={[shareStyles.wrap, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
      <View style={shareStyles.header}>
        <Ionicons name="share-social-outline" size={15} color={colors.gold} />
        <Text style={[shareStyles.heading, { color: colors.foreground }]}>Share the breed</Text>
      </View>
      <Text style={[shareStyles.sub, { color: colors.mutedForeground }]}>
        Tell your followers what breed {dogName || "your dog"} is
      </Text>
      <View style={shareStyles.row}>
        {SOCIALS.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => handlePress(s.id)}
            style={[shareStyles.btn, { backgroundColor: s.bg, borderColor: s.color + "44" }]}
            activeOpacity={0.75}
          >
            <Text style={shareStyles.btnEmoji}>{s.emoji}</Text>
            <Text style={[shareStyles.btnLabel, { color: s.color }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const shareStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 7 },
  heading: { fontSize: 14, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  btn: {
    flex: 1,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  btnEmoji: { fontSize: 20 },
  btnLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
});

export default function BreedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentScan, currentKnowledge, currentDogName, gallery } = useApp();
  const [merchVisible, setMerchVisible] = useState(false);
  const [breedPhotos, setBreedPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);

  const isWeb = Platform.OS === "web";

  const galleryEntry = currentScan
    ? gallery.find((g) => g.breed === currentScan.breed)
    : null;

  const dogName = currentDogName || galleryEntry?.dogName || "";
  const displayName = dogName || currentScan?.breed || "your dog";
  const isPersonalised = !!dogName;

  useEffect(() => {
    if (!currentScan?.breed) return;
    setPhotosLoading(true);
    fetchBreedPhotos(currentScan.breed, 12)
      .then(setBreedPhotos)
      .finally(() => setPhotosLoading(false));
  }, [currentScan?.breed]);

  if (!currentScan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const k = currentKnowledge;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 + insets.bottom : insets.bottom + 100 }}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          {galleryEntry?.uri ? (
            <Image source={{ uri: galleryEntry.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navyMid, alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="paw-outline" size={60} color={colors.gold + "44"} />
            </View>
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,14,26,0.52)" }]} />

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: "rgba(10,14,26,0.7)" }]}
          >
            <Ionicons name="chevron-back" size={22} color="#f5f0e8" />
          </TouchableOpacity>

          <View style={styles.heroMeta}>
            {isPersonalised && (
              <View style={[styles.dogNameBadge, { backgroundColor: colors.gold }]}>
                <Ionicons name="heart" size={12} color={colors.navy} />
                <Text style={[styles.dogNameBadgeText, { color: colors.navy }]}>{dogName}</Text>
              </View>
            )}
            <Text style={styles.breedTitle}>{currentScan.breed}</Text>
            {currentScan.isMix && currentScan.mixBreeds && (
              <Text style={styles.breedMix}>Mix: {currentScan.mixBreeds.join(" · ")}</Text>
            )}
            {k && (
              <Text style={[styles.groupLabel, { color: "#c9a84c" }]}>
                {k.functionalGroup.group}
              </Text>
            )}
          </View>
        </View>

        {/* Breed Photo Gallery */}
        <View style={[styles.photoSection, { backgroundColor: colors.navyMid }]}>
          <View style={styles.photoHeader}>
            <Ionicons name="images-outline" size={16} color={colors.gold} />
            <Text style={[styles.photoHeading, { color: colors.foreground }]}>
              {currentScan.breed} Gallery
            </Text>
          </View>
          {photosLoading ? (
            <View style={styles.photosLoading}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={[styles.photosLoadingText, { color: colors.mutedForeground }]}>Loading photos…</Text>
            </View>
          ) : breedPhotos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScroll}
              decelerationRate="fast"
              snapToInterval={PHOTO_SIZE + 10}
            >
              {galleryEntry?.uri && (
                <View style={styles.photoWrap}>
                  <Image source={{ uri: galleryEntry.uri }} style={[styles.photoTile, { width: PHOTO_SIZE, height: PHOTO_SIZE }]} resizeMode="cover" />
                  <View style={[styles.yourDogBadge, { backgroundColor: colors.gold }]}>
                    <Text style={[styles.yourDogBadgeText, { color: colors.navy }]}>
                      {dogName || "Your dog"}
                    </Text>
                  </View>
                </View>
              )}
              {breedPhotos.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.photoTile, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Social Share */}
        <ShareStrip breed={currentScan.breed} dogName={dogName} />

        {/* Knowledge */}
        <View style={styles.content}>
          {k ? (
            <>
              <KnowledgeSection title="Habitat & Origin" icon="globe-outline" defaultExpanded>
                <InfoRow label="Country of Origin" value={k.habitat.countryOfOrigin} />
                <InfoRow label="Climate Adapted To" value={k.habitat.climate} />
                <InfoRow label="Coat Adaptation" value={k.habitat.coatAdaptation} />
                <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.habitat.geographicNotes}</Text>
              </KnowledgeSection>

              <KnowledgeSection title="Ancient Lineage" icon="git-branch-outline">
                <InfoRow label="Wolf Population Ancestry" value={k.history.wolfPopulation} />
                <InfoRow label="First Recorded Use" value={k.history.firstRecordedUse} />
                <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.history.ancientLineage}</Text>
                <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.history.evolutionSummary}</Text>
              </KnowledgeSection>

              <KnowledgeSection title="Grooming Guide" icon="cut-outline">
                <InfoRow label="Coat Type" value={k.grooming.coatType} />
                <InfoRow label="Brushing" value={k.grooming.brushingFrequency} />
                <InfoRow label="Bathing" value={k.grooming.bathingFrequency} />
                <InfoRow label="Nail Trimming" value={k.grooming.nailCare} />
                <InfoRow label="Ear Care" value={k.grooming.earCare} />
                <InfoRow label="Nose Leather Care" value={k.grooming.noseLearherCare} />
                <InfoRow label="Paw Pad Care" value={k.grooming.pawPadCare} />
                <InfoRow label="Professional Grooming" value={k.grooming.professionalGroomingFrequency} />
              </KnowledgeSection>

              <KnowledgeSection title="Health & Lifespan" icon="heart-outline">
                <InfoRow label="Lifespan" value={k.health.lifespan} />
                <InfoRow label="Exercise Needs" value={k.health.exerciseNeeds} />
                <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Common conditions</Text>
                <TagList items={k.health.commonConditions} />
                <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Genetic predispositions</Text>
                <TagList items={k.health.geneticPredispositions} color={colors.destructive} />
                <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Parasite risks</Text>
                <TagList items={k.health.parasiteRisks} />
              </KnowledgeSection>

              <KnowledgeSection title="Purpose & Role" icon="ribbon-outline">
                <InfoRow label="Historical Job" value={k.functionalGroup.historicalJob} />
                <InfoRow label="Modern Role" value={k.functionalGroup.modernRole} />
              </KnowledgeSection>

              <KnowledgeSection title="Fun Facts" icon="star-outline" defaultExpanded>
                {k.funFacts.map((fact, i) => (
                  <View key={i} style={[styles.factRow, { borderColor: colors.border }]}>
                    <Text style={[styles.factNum, { color: colors.gold }]}>{i + 1}</Text>
                    <Text style={[styles.factText, { color: colors.foreground }]}>{fact}</Text>
                  </View>
                ))}
              </KnowledgeSection>
            </>
          ) : (
            <View style={styles.loadingKnowledge}>
              <ActivityIndicator color={colors.gold} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading {isPersonalised ? `${dogName}'s` : "breed"} knowledge...
              </Text>
            </View>
          )}

          {/* onjjem CTA */}
          {galleryEntry && (
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMerchVisible(true);
              }}
              style={[styles.merchCTA, { backgroundColor: colors.navyMid, borderColor: colors.gold + "33" }]}
              activeOpacity={0.85}
            >
              <Image source={{ uri: galleryEntry.uri }} style={styles.merchThumb} resizeMode="cover" />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.merchCTATitle, { color: colors.foreground }]}>
                  {isPersonalised
                    ? `Create something for ${dogName} 🐾`
                    : "Create personalised keepsakes"}
                </Text>
                <Text style={[styles.merchCTASub, { color: colors.mutedForeground }]}>
                  {isPersonalised
                    ? `A personalised ball, canvas print or tote — just for ${dogName}`
                    : "Dog ball · Canvas print · Tote bag · and more"}
                </Text>
                <Text style={[styles.merchPowered, { color: colors.gold + "aa" }]}>
                  Powered by ONJJEM.com
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.gold} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <MerchSheet
        visible={merchVisible}
        onClose={() => setMerchVisible(false)}
        imageUri={galleryEntry?.uri}
        breedName={currentScan.breed}
        dogName={dogName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { height: 300, position: "relative", justifyContent: "flex-end" },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heroMeta: { padding: 20, gap: 5 },
  dogNameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  dogNameBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  breedTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#f5f0e8", letterSpacing: -0.3 },
  breedMix: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#c9a84c" },
  groupLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },

  photoSection: {
    paddingVertical: 14,
    gap: 10,
  },
  photoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
  },
  photoHeading: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  photosLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  photosLoadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  photosScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  photoWrap: {
    position: "relative",
  },
  photoTile: {
    borderRadius: 12,
    overflow: "hidden",
  },
  yourDogBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  yourDogBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },

  content: { padding: 16, gap: 0 },
  prose: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 4 },
  tagLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 8, marginBottom: 4 },
  factRow: { flexDirection: "row", gap: 12, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  factNum: { fontSize: 15, fontFamily: "Inter_700Bold", width: 20 },
  factText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },
  loadingKnowledge: { alignItems: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  merchCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
  },
  merchThumb: { width: 60, height: 60, borderRadius: 12 },
  merchCTATitle: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: -0.1 },
  merchCTASub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  merchPowered: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.3, marginTop: 2 },
});
