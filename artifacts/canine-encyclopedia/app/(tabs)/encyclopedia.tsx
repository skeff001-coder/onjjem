import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const BREED_GROUPS = [
  {
    id: "hound",
    name: "Hounds",
    icon: "walk-outline" as const,
    description: "Swift hunters using sight or scent",
    breeds: ["Greyhound", "Beagle", "Bloodhound", "Whippet", "Basset Hound", "Afghan Hound"],
  },
  {
    id: "gundog",
    name: "Gundogs",
    icon: "leaf-outline" as const,
    description: "Retrievers, spaniels and pointers bred for the hunt",
    breeds: ["Labrador Retriever", "Golden Retriever", "Cocker Spaniel", "Springer Spaniel"],
  },
  {
    id: "terrier",
    name: "Terriers",
    icon: "flash-outline" as const,
    description: "Tenacious earth dogs bred to hunt vermin",
    breeds: ["Jack Russell", "Staffordshire Bull Terrier", "Scottish Terrier", "Border Terrier"],
  },
  {
    id: "working",
    name: "Working",
    icon: "shield-outline" as const,
    description: "Guard, sledge and rescue dogs of great strength",
    breeds: ["Rottweiler", "Dobermann", "Siberian Husky", "Boxer", "Great Dane"],
  },
  {
    id: "pastoral",
    name: "Pastoral",
    icon: "sunny-outline" as const,
    description: "Herding dogs of fields and mountains",
    breeds: ["German Shepherd", "Border Collie", "Welsh Corgi", "Old English Sheepdog"],
  },
  {
    id: "toy",
    name: "Toy",
    icon: "heart-outline" as const,
    description: "Companion breeds bred for affection",
    breeds: ["Chihuahua", "Pomeranian", "Cavalier King Charles", "Pug", "Maltese"],
  },
];

const FUN_FACTS = [
  "Dogs have about 300 million olfactory receptors — humans have 6 million.",
  "The Basenji is the only breed that doesn't bark — it yodels.",
  "All domestic dogs share 99.9% of their DNA with the grey wolf.",
  "A dog's nose print is as unique as a human fingerprint.",
  "The Irish Wolfhound can reach speeds of 35 mph (56 km/h).",
  "Dalmatians are born completely white — spots appear as they age.",
];

export default function EncyclopediaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: topPad + 12, paddingBottom: isWeb ? 34 + insets.bottom : insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Encyclopedia</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Explore all seven functional groups
      </Text>

      <View style={styles.groups}>
        {BREED_GROUPS.map((group) => {
          const expanded = expandedGroup === group.id;
          return (
            <View key={group.id} style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setExpandedGroup(expanded ? null : group.id)}
                style={styles.groupHeader}
                activeOpacity={0.75}
              >
                <View style={[styles.groupIcon, { backgroundColor: colors.navyMid }]}>
                  <Ionicons name={group.icon} size={20} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>
                  <Text style={[styles.groupDesc, { color: colors.mutedForeground }]}>{group.description}</Text>
                </View>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>

              {expanded && (
                <View style={[styles.breedList, { borderTopColor: colors.border }]}>
                  {group.breeds.map((breed) => (
                    <TouchableOpacity
                      key={breed}
                      onPress={() => router.push({ pathname: "/breed-search", params: { breed } } as any)}
                      style={styles.breedItem}
                    >
                      <Text style={[styles.breedName, { color: colors.foreground }]}>{breed}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.gold} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Canine Curiosities</Text>
      <View style={styles.facts}>
        {FUN_FACTS.map((fact, i) => (
          <View key={i} style={[styles.factCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.factNum, { color: colors.gold }]}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={[styles.factText, { color: colors.foreground }]}>{fact}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 0 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  groups: { gap: 10, marginBottom: 32 },
  groupCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  groupHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  groupIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  groupName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  groupDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  breedList: { borderTopWidth: 1 },
  breedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#232e42",
  },
  breedName: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 14 },
  facts: { gap: 10, marginBottom: 16 },
  factCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  factNum: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5, lineHeight: 28 },
  factText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, flex: 1 },
});
