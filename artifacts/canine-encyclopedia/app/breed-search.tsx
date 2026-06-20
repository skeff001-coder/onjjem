import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getBreedKnowledge } from "@/lib/gemini";
import { KnowledgeSection, InfoRow, TagList } from "@/components/KnowledgeSection";
import { Platform } from "react-native";

export default function BreedSearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { breed } = useLocalSearchParams<{ breed: string }>();
  const { knowledgeCache, cacheKnowledge } = useApp();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { data: k, isLoading, isError, refetch } = useQuery({
    queryKey: ["breedKnowledge", breed],
    queryFn: async () => {
      if (breed && knowledgeCache[breed]) return knowledgeCache[breed];
      const result = await getBreedKnowledge(breed ?? "");
      if (breed) cacheKnowledge(breed, result);
      return result;
    },
    enabled: !!breed,
    staleTime: Infinity,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{breed}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Loading knowledge...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centred}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={[styles.statusText, { color: colors.foreground }]}>Failed to load</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.navyMid, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : k ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: isWeb ? 34 + insets.bottom : insets.bottom + 100 },
          ]}
        >
          <View style={[styles.groupBanner, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>FUNCTIONAL GROUP</Text>
            <Text style={[styles.groupName, { color: colors.gold }]}>{k.functionalGroup.group}</Text>
            <Text style={[styles.groupDesc, { color: colors.foreground }]}>{k.functionalGroup.historicalJob}</Text>
          </View>

          <KnowledgeSection title="Habitat & Origin" icon="globe-outline" defaultExpanded>
            <InfoRow label="Country of Origin" value={k.habitat.countryOfOrigin} />
            <InfoRow label="Climate Adapted To" value={k.habitat.climate} />
            <InfoRow label="Coat Adaptation" value={k.habitat.coatAdaptation} />
            <Text style={[styles.prose, { color: colors.mutedForeground }]}>{k.habitat.geographicNotes}</Text>
          </KnowledgeSection>

          <KnowledgeSection title="Ancient Lineage" icon="git-branch-outline">
            <InfoRow label="Wolf Ancestry" value={k.history.wolfPopulation} />
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
            <InfoRow label="Nose Leather" value={k.grooming.noseLearherCare} />
            <InfoRow label="Paw Pads" value={k.grooming.pawPadCare} />
            <InfoRow label="Professional Grooming" value={k.grooming.professionalGroomingFrequency} />
          </KnowledgeSection>

          <KnowledgeSection title="Health & Lifespan" icon="heart-outline">
            <InfoRow label="Lifespan" value={k.health.lifespan} />
            <InfoRow label="Exercise Needs" value={k.health.exerciseNeeds} />
            <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Common conditions</Text>
            <TagList items={k.health.commonConditions} />
            <Text style={[styles.tagLabel, { color: colors.mutedForeground }]}>Genetic predispositions</Text>
            <TagList items={k.health.geneticPredispositions} color={colors.destructive} />
          </KnowledgeSection>

          <KnowledgeSection title="Purpose & Role" icon="ribbon-outline">
            <InfoRow label="Historical Job" value={k.functionalGroup.historicalJob} />
            <InfoRow label="Modern Role" value={k.functionalGroup.modernRole} />
          </KnowledgeSection>

          <KnowledgeSection title="Fun Facts" icon="star-outline" defaultExpanded>
            {k.funFacts.map((f, i) => (
              <View key={i} style={[styles.factRow, { borderColor: colors.border }]}>
                <Text style={[styles.factNum, { color: colors.gold }]}>{i + 1}</Text>
                <Text style={[styles.factText, { color: colors.foreground }]}>{f}</Text>
              </View>
            ))}
          </KnowledgeSection>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3, flex: 1 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  statusText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  retryBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  scroll: { paddingHorizontal: 16 },
  groupBanner: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4, marginBottom: 12 },
  groupLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  groupName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  groupDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  prose: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 4 },
  tagLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 8, marginBottom: 4 },
  factRow: { flexDirection: "row", gap: 12, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  factNum: { fontSize: 15, fontFamily: "Inter_700Bold", width: 20 },
  factText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },
});
