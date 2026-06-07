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
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getBreedKnowledge } from "@/lib/gemini";
import { KnowledgeSection, InfoRow, TagList } from "@/components/KnowledgeSection";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = width * 0.42;

function cap(s?: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}


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

async function trackShare(_platform: string, _breed: string) {
  // RevenueCat analytics removed from this screen; now handled in My Pack tab
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
  const {
    currentScan,
    currentKnowledge,
    currentDogName,
    gallery,
    setCurrentScan,
    setCurrentKnowledge,
    cacheKnowledge,
    setGalleryEntryKnowledge,
    correctGalleryEntryBreed,
    selectedGalleryEntry,
  } = useApp();
  const [breedPhotos, setBreedPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [correctModalVisible, setCorrectModalVisible] = useState(false);
  const [correctValue, setCorrectValue] = useState("");
  const [correcting, setCorrecting] = useState(false);

  // Prefer the stable id captured when the report was opened so refresh/correct
  // always target the exact saved dog — even when several dogs share a breed.
  const galleryEntry =
    (selectedGalleryEntry
      ? gallery.find((g) => g.id === selectedGalleryEntry.id)
      : undefined) ??
    (currentScan ? gallery.find((g) => g.breed === currentScan.breed) : undefined) ??
    null;

  const dogName = currentDogName || galleryEntry?.dogName || "";
  const displayName = dogName || currentScan?.breed || "your dog";
  const isPersonalised = !!dogName;

  const handleRefreshKnowledge = async () => {
    if (!currentScan?.breed || !galleryEntry || refreshing) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    try {
      const fresh = await getBreedKnowledge(currentScan.breed);
      setCurrentKnowledge(fresh);
      cacheKnowledge(currentScan.breed, fresh);
      await setGalleryEntryKnowledge(galleryEntry.id, fresh);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Couldn't refresh", e?.message ?? "Please check your connection and try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCorrectBreed = async () => {
    const newBreed = correctValue.trim();
    if (!newBreed || !galleryEntry || correcting) return;
    if (newBreed.toLowerCase() === currentScan?.breed.toLowerCase()) {
      setCorrectModalVisible(false);
      setCorrectValue("");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCorrecting(true);
    try {
      const fresh = await getBreedKnowledge(newBreed);
      setCurrentScan({
        ...currentScan!,
        breed: newBreed,
        isMix: false,
        mixBreeds: undefined,
        runnerUp: undefined,
        mixBreakdown: undefined,
      });
      setCurrentKnowledge(fresh);
      cacheKnowledge(newBreed, fresh);
      await correctGalleryEntryBreed(galleryEntry.id, newBreed, fresh);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectModalVisible(false);
      setCorrectValue("");
    } catch (e: any) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Couldn't update breed", e?.message ?? "Please check your connection and try again.");
    } finally {
      setCorrecting(false);
    }
  };

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
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + insets.bottom : insets.bottom + 100 }}
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

        {/* Manage / refresh saved report */}
        {galleryEntry ? (
          <View style={[manageStyles.wrap, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
            <View style={manageStyles.header}>
              <Ionicons name="refresh-circle-outline" size={15} color={colors.gold} />
              <Text style={[manageStyles.heading, { color: colors.foreground }]}>Keep this report up to date</Text>
            </View>
            <Text style={[manageStyles.sub, { color: colors.mutedForeground }]}>
              Refresh the breed knowledge, or fix the breed if we got it wrong.
            </Text>
            <View style={manageStyles.row}>
              <TouchableOpacity
                onPress={handleRefreshKnowledge}
                disabled={refreshing || correcting}
                activeOpacity={0.75}
                style={[manageStyles.btn, { backgroundColor: colors.gold, opacity: refreshing || correcting ? 0.6 : 1 }]}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <Ionicons name="refresh-outline" size={16} color={colors.navy} />
                )}
                <Text style={[manageStyles.btnLabel, { color: colors.navy }]}>
                  {refreshing ? "Refreshing…" : "Refresh knowledge"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (refreshing || correcting) return;
                  setCorrectValue(currentScan.breed);
                  setCorrectModalVisible(true);
                }}
                disabled={refreshing || correcting}
                activeOpacity={0.75}
                style={[manageStyles.btnOutline, { borderColor: colors.gold, opacity: refreshing || correcting ? 0.6 : 1 }]}
              >
                <Ionicons name="create-outline" size={16} color={colors.gold} />
                <Text style={[manageStyles.btnLabel, { color: colors.gold }]}>Correct breed</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Knowledge */}
        <View style={styles.content}>
          {/* Identification details — available immediately from the scan */}
          <KnowledgeSection title="How We Identified This" icon="sparkles-outline" defaultExpanded>
            {currentScan.confidence ? (
              <InfoRow label="Confidence" value={cap(currentScan.confidence)} />
            ) : null}
            {currentScan.runnerUp?.breed ? (
              <InfoRow
                label="Also Possibly"
                value={
                  currentScan.runnerUp.confidence
                    ? `${currentScan.runnerUp.breed} (${currentScan.runnerUp.confidence})`
                    : currentScan.runnerUp.breed
                }
              />
            ) : null}
            {currentScan.isMix && currentScan.mixBreakdown && currentScan.mixBreakdown.length > 0 ? (
              <>
                <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Heritage breakdown</Text>
                {currentScan.mixBreakdown.map((m, i) => (
                  <InfoRow
                    key={i}
                    label={m.breed}
                    value={m.percentage != null ? `${m.percentage}%` : "—"}
                  />
                ))}
              </>
            ) : null}
            {currentScan.reasoning ? (
              <Text style={[styles.prose, { color: colors.mutedForeground }]}>{currentScan.reasoning}</Text>
            ) : null}
          </KnowledgeSection>

          {k ? (
            <>
              <KnowledgeSection title="Habitat & Origin" icon="globe-outline" defaultExpanded>
                {k.habitat.countryOfOrigin ? <InfoRow label="Country of Origin" value={k.habitat.countryOfOrigin} /> : null}
                {k.habitat.climate ? <InfoRow label="Climate Adapted To" value={k.habitat.climate} /> : null}
                {k.habitat.coatAdaptation ? <InfoRow label="Coat Adaptation" value={k.habitat.coatAdaptation} /> : null}
                {k.habitat.geographicNotes ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.habitat.geographicNotes}</Text> : null}
              </KnowledgeSection>

              <KnowledgeSection title="Ancient Lineage" icon="git-branch-outline">
                {k.history.wolfPopulation ? <InfoRow label="Wolf Population Ancestry" value={k.history.wolfPopulation} /> : null}
                {k.history.firstRecordedUse ? <InfoRow label="First Recorded Use" value={k.history.firstRecordedUse} /> : null}
                {k.history.ancientLineage ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.history.ancientLineage}</Text> : null}
                {k.history.evolutionSummary ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.history.evolutionSummary}</Text> : null}
              </KnowledgeSection>

              {k.temperament &&
                (k.temperament.summary ||
                  (k.temperament.traits && k.temperament.traits.length > 0) ||
                  k.temperament.energyLevel ||
                  k.temperament.affectionLevel ||
                  k.temperament.barkingTendency ||
                  k.temperament.noteworthyBehaviours) ? (
                <KnowledgeSection title="Temperament & Behaviour" icon="happy-outline">
                  {k.temperament.energyLevel ? <InfoRow label="Energy Level" value={k.temperament.energyLevel} /> : null}
                  {k.temperament.affectionLevel ? <InfoRow label="Affection" value={k.temperament.affectionLevel} /> : null}
                  {k.temperament.barkingTendency ? <InfoRow label="Barking" value={k.temperament.barkingTendency} /> : null}
                  {k.temperament.traits && k.temperament.traits.length > 0 ? (
                    <>
                      <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Key traits</Text>
                      <TagList items={k.temperament.traits} />
                    </>
                  ) : null}
                  {k.temperament.summary ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.temperament.summary}</Text> : null}
                  {k.temperament.noteworthyBehaviours ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.temperament.noteworthyBehaviours}</Text> : null}
                </KnowledgeSection>
              ) : null}

              {k.training &&
                (k.training.intelligence ||
                  k.training.trainability ||
                  k.training.recommendedApproach ||
                  (k.training.commonChallenges && k.training.commonChallenges.length > 0) ||
                  k.training.socialisationNeeds) ? (
                <KnowledgeSection title="Training & Intelligence" icon="school-outline">
                  {k.training.intelligence ? <InfoRow label="Intelligence" value={k.training.intelligence} /> : null}
                  {k.training.trainability ? <InfoRow label="Trainability" value={k.training.trainability} /> : null}
                  {k.training.commonChallenges && k.training.commonChallenges.length > 0 ? (
                    <>
                      <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Common challenges</Text>
                      <TagList items={k.training.commonChallenges} color={colors.destructive} />
                    </>
                  ) : null}
                  {k.training.recommendedApproach ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.training.recommendedApproach}</Text> : null}
                  {k.training.socialisationNeeds ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.training.socialisationNeeds}</Text> : null}
                </KnowledgeSection>
              ) : null}

              {k.physical &&
                (k.physical.heightRange ||
                  k.physical.weightRange ||
                  k.physical.build ||
                  (k.physical.commonColours && k.physical.commonColours.length > 0) ||
                  k.physical.distinctiveFeatures) ? (
                <KnowledgeSection title="Size & Physical Traits" icon="resize-outline">
                  {k.physical.heightRange ? <InfoRow label="Height" value={k.physical.heightRange} /> : null}
                  {k.physical.weightRange ? <InfoRow label="Weight" value={k.physical.weightRange} /> : null}
                  {k.physical.build ? <InfoRow label="Build" value={k.physical.build} /> : null}
                  {k.physical.commonColours && k.physical.commonColours.length > 0 ? (
                    <>
                      <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Common colours</Text>
                      <TagList items={k.physical.commonColours} />
                    </>
                  ) : null}
                  {k.physical.distinctiveFeatures ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.physical.distinctiveFeatures}</Text> : null}
                </KnowledgeSection>
              ) : null}

              <KnowledgeSection title="Grooming Guide" icon="cut-outline">
                {k.grooming.coatType ? <InfoRow label="Coat Type" value={k.grooming.coatType} /> : null}
                {k.grooming.sheddingLevel ? <InfoRow label="Shedding" value={k.grooming.sheddingLevel} /> : null}
                {k.grooming.brushingFrequency ? <InfoRow label="Brushing" value={k.grooming.brushingFrequency} /> : null}
                {k.grooming.bathingFrequency ? <InfoRow label="Bathing" value={k.grooming.bathingFrequency} /> : null}
                {k.grooming.nailCare ? <InfoRow label="Nail Trimming" value={k.grooming.nailCare} /> : null}
                {k.grooming.earCare ? <InfoRow label="Ear Care" value={k.grooming.earCare} /> : null}
                {k.grooming.noseLearherCare ? <InfoRow label="Nose Leather Care" value={k.grooming.noseLearherCare} /> : null}
                {k.grooming.pawPadCare ? <InfoRow label="Paw Pad Care" value={k.grooming.pawPadCare} /> : null}
                {k.grooming.professionalGroomingFrequency ? <InfoRow label="Professional Grooming" value={k.grooming.professionalGroomingFrequency} /> : null}
              </KnowledgeSection>

              {k.nutrition &&
                (k.nutrition.dailyCalories ||
                  k.nutrition.dietType ||
                  k.nutrition.feedingFrequency ||
                  (k.nutrition.foodsToAvoid && k.nutrition.foodsToAvoid.length > 0) ||
                  k.nutrition.supplements) ? (
                <KnowledgeSection title="Nutrition & Diet" icon="nutrition-outline">
                  {k.nutrition.dailyCalories ? <InfoRow label="Daily Calories" value={k.nutrition.dailyCalories} /> : null}
                  {k.nutrition.dietType ? <InfoRow label="Diet Type" value={k.nutrition.dietType} /> : null}
                  {k.nutrition.feedingFrequency ? <InfoRow label="Feeding" value={k.nutrition.feedingFrequency} /> : null}
                  {k.nutrition.foodsToAvoid && k.nutrition.foodsToAvoid.length > 0 ? (
                    <>
                      <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Foods to avoid</Text>
                      <TagList items={k.nutrition.foodsToAvoid} color={colors.destructive} />
                    </>
                  ) : null}
                  {k.nutrition.supplements ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.nutrition.supplements}</Text> : null}
                </KnowledgeSection>
              ) : null}

              <KnowledgeSection title="Health & Lifespan" icon="heart-outline">
                {k.health.lifespan ? <InfoRow label="Lifespan" value={k.health.lifespan} /> : null}
                {k.health.exerciseNeeds ? <InfoRow label="Exercise Needs" value={k.health.exerciseNeeds} /> : null}
                {k.health.commonConditions && k.health.commonConditions.length > 0 ? (
                  <>
                    <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Common conditions</Text>
                    <TagList items={k.health.commonConditions} />
                  </>
                ) : null}
                {k.health.geneticPredispositions && k.health.geneticPredispositions.length > 0 ? (
                  <>
                    <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Genetic predispositions</Text>
                    <TagList items={k.health.geneticPredispositions} color={colors.destructive} />
                  </>
                ) : null}
                {k.health.parasiteRisks && k.health.parasiteRisks.length > 0 ? (
                  <>
                    <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Parasite risks</Text>
                    <TagList items={k.health.parasiteRisks} />
                  </>
                ) : null}
                {k.health.preventiveCare ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.health.preventiveCare}</Text> : null}
              </KnowledgeSection>

              {k.compatibility &&
                (k.compatibility.goodWithChildren ||
                  k.compatibility.goodWithOtherDogs ||
                  k.compatibility.goodWithOtherPets ||
                  k.compatibility.apartmentLiving ||
                  k.compatibility.noviceOwnerFriendly ||
                  k.compatibility.aloneTolerance) ? (
                <KnowledgeSection title="Compatibility & Lifestyle" icon="people-outline">
                  {k.compatibility.goodWithChildren ? <InfoRow label="With Children" value={k.compatibility.goodWithChildren} /> : null}
                  {k.compatibility.goodWithOtherDogs ? <InfoRow label="With Other Dogs" value={k.compatibility.goodWithOtherDogs} /> : null}
                  {k.compatibility.goodWithOtherPets ? <InfoRow label="With Other Pets" value={k.compatibility.goodWithOtherPets} /> : null}
                  {k.compatibility.apartmentLiving ? <InfoRow label="Apartment Living" value={k.compatibility.apartmentLiving} /> : null}
                  {k.compatibility.noviceOwnerFriendly ? <InfoRow label="First-time Owners" value={k.compatibility.noviceOwnerFriendly} /> : null}
                  {k.compatibility.aloneTolerance ? <InfoRow label="Time Alone" value={k.compatibility.aloneTolerance} /> : null}
                </KnowledgeSection>
              ) : null}

              <KnowledgeSection title="Purpose & Role" icon="ribbon-outline">
                {k.functionalGroup.historicalJob ? <InfoRow label="Historical Job" value={k.functionalGroup.historicalJob} /> : null}
                {k.functionalGroup.modernRole ? <InfoRow label="Modern Role" value={k.functionalGroup.modernRole} /> : null}
                {k.functionalGroup.groupDescription ? <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.functionalGroup.groupDescription}</Text> : null}
              </KnowledgeSection>

              {k.funFacts && k.funFacts.length > 0 ? (
                <KnowledgeSection title="Fun Facts" icon="star-outline" defaultExpanded>
                  {k.funFacts.map((fact, i) => (
                    <View key={i} style={[styles.factRow, { borderColor: colors.border }]}>
                      <Text style={[styles.factNum, { color: colors.gold }]}>{i + 1}</Text>
                      <Text style={[styles.factText, { color: colors.foreground }]}>{fact}</Text>
                    </View>
                  ))}
                </KnowledgeSection>
              ) : null}
            </>
          ) : (
            <View style={styles.loadingKnowledge}>
              <ActivityIndicator color={colors.gold} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading {isPersonalised ? `${dogName}'s` : "breed"} knowledge...
              </Text>
            </View>
          )}


        </View>
      </ScrollView>

      {/* Correct breed modal */}
      <Modal
        visible={correctModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!correcting) setCorrectModalVisible(false);
        }}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>Correct the breed</Text>
            <Text style={[modalStyles.sub, { color: colors.mutedForeground }]}>
              Enter the right breed and we'll fetch a fresh report for {dogName || "your dog"}.
            </Text>
            <TextInput
              value={correctValue}
              onChangeText={setCorrectValue}
              placeholder="e.g. Border Collie"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              editable={!correcting}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCorrectBreed}
              style={[modalStyles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.navy }]}
            />
            <View style={modalStyles.actions}>
              <TouchableOpacity
                onPress={() => {
                  if (!correcting) {
                    setCorrectModalVisible(false);
                    setCorrectValue("");
                  }
                }}
                disabled={correcting}
                activeOpacity={0.75}
                style={[modalStyles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[modalStyles.cancelLabel, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCorrectBreed}
                disabled={correcting || !correctValue.trim()}
                activeOpacity={0.75}
                style={[modalStyles.saveBtn, { backgroundColor: colors.gold, opacity: correcting || !correctValue.trim() ? 0.6 : 1 }]}
              >
                {correcting ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <Text style={[modalStyles.saveLabel, { color: colors.navy }]}>Update report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
});

const manageStyles = StyleSheet.create({
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
  row: { flexDirection: "row", gap: 8, marginTop: 4 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  btnLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,14,26,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
