import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface ProductMockupProps {
  photoUri: string;
}

const PRODUCTS = [
  {
    id: "mug",
    label: "Photo Mug",
    price: "From £15.99",
    url: "https://onjjem.com/product/photo-mugs",
  },
  {
    id: "canvas",
    label: "Stretched Canvas",
    price: "From £27.00",
    url: "https://onjjem.com/product/stretched-canvas",
  },
  {
    id: "poster",
    label: "Glow Poster",
    price: "From £10.99",
    url: "https://onjjem.com/product/glow-poster",
  },
] as const;

// A mug rendered from plain shapes: a rounded body clipping the photo, plus
// a handle drawn as a border-only arc shape. No external template image —
// this is a stylised, not photorealistic, preview, which keeps it free to
// render for every single scan with zero ongoing cost.
function MugMockup({ photoUri }: { photoUri: string }) {
  return (
    <View style={mugStyles.wrap}>
      <View style={mugStyles.body}>
        <Image source={{ uri: photoUri }} style={mugStyles.photo} resizeMode="cover" />
      </View>
      <View style={mugStyles.handle} />
    </View>
  );
}

// A simple bordered rectangle with a drop shadow to suggest a canvas print
// stretched over a frame edge.
function CanvasMockup({ photoUri }: { photoUri: string }) {
  return (
    <View style={canvasStyles.wrap}>
      <Image source={{ uri: photoUri }} style={canvasStyles.photo} resizeMode="cover" />
    </View>
  );
}

// A thin frame with a subtle inner glow tint to suggest the glow-in-the-dark
// poster product.
function PosterMockup({ photoUri }: { photoUri: string }) {
  return (
    <View style={posterStyles.wrap}>
      <Image source={{ uri: photoUri }} style={posterStyles.photo} resizeMode="cover" />
      <View style={posterStyles.glowEdge} pointerEvents="none" />
    </View>
  );
}

export function ProductMockup({ photoUri }: ProductMockupProps) {
  const colors = useColors();

  const openProduct = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.foreground }]}>See it as a gift</Text>
      <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
        Tap to order this exact photo on a real product
      </Text>
      <View style={styles.row}>
        {PRODUCTS.map((product) => (
          <TouchableOpacity
            key={product.id}
            onPress={() => openProduct(product.url)}
            activeOpacity={0.85}
            style={styles.card}
          >
            {product.id === "mug" && <MugMockup photoUri={photoUri} />}
            {product.id === "canvas" && <CanvasMockup photoUri={photoUri} />}
            {product.id === "poster" && <PosterMockup photoUri={photoUri} />}
            <Text style={[styles.cardLabel, { color: colors.foreground }]}>{product.label}</Text>
            <Text style={[styles.cardPrice, { color: colors.gold }]}>{product.price}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingHorizontal: 4 },
  heading: { fontSize: 16, fontWeight: "800" },
  subheading: { fontSize: 12, marginTop: 2, marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  card: { flex: 1, alignItems: "center" },
  cardLabel: { fontSize: 12, fontWeight: "700", marginTop: 8, textAlign: "center" },
  cardPrice: { fontSize: 11, fontWeight: "600", marginTop: 1 },
});

const mugStyles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", height: 100, width: "100%" },
  body: {
    width: 88,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e5e5",
  },
  photo: { width: "100%", height: "100%" },
  handle: {
    position: "absolute",
    right: 4,
    top: 24,
    width: 22,
    height: 34,
    borderRadius: 12,
    borderWidth: 6,
    borderColor: "#e5e5e5",
    backgroundColor: "transparent",
  },
});

const canvasStyles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 100,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 6,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  photo: { width: "100%", height: "100%" },
});

const posterStyles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 100,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  photo: { width: "100%", height: "100%" },
  glowEdge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(120,220,255,0.35)",
    borderRadius: 6,
  },
});
