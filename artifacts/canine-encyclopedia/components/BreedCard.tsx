import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { GalleryEntry } from "@/context/AppContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface BreedCardProps {
  entry: GalleryEntry;
  onPress: () => void;
  onLongPress?: () => void;
}

export function BreedCard({ entry, onPress, onLongPress }: BreedCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Image source={{ uri: entry.uri }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay}>
        {entry.hasDeepKnowledge && (
          <View style={[styles.badge, { backgroundColor: colors.gold }]}>
            <Ionicons name="book" size={10} color={colors.navy} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        {entry.dogName ? (
          <Text style={[styles.dogName, { color: colors.gold }]} numberOfLines={1}>
            {entry.dogName}
          </Text>
        ) : null}
        <Text style={[styles.breed, { color: colors.foreground }]} numberOfLines={1}>
          {entry.breed}
        </Text>
        {entry.isMix && (
          <Text style={[styles.mix, { color: colors.mutedForeground }]} numberOfLines={1}>
            Mix
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: CARD_WIDTH * 1.1,
    backgroundColor: "#141927",
  },
  overlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 10,
  },
  dogName: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  breed: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  mix: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
