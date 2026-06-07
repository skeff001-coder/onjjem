import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface MerchSheetProps {
  visible: boolean;
  onClose: () => void;
  imageUri?: string;
  breedName?: string;
  dogName?: string;
}

const PRODUCTS = [
  {
    id: "canvas",
    name: "Stretched Canvas",
    price: "£49.99",
    description: "Premium hand-stretched canvas. 38mm deep, 400gsm artist-grade.",
    icon: "image-outline" as const,
    prodigiType: "canvas",
  },
  {
    id: "eco_canvas",
    name: "Eco Canvas",
    price: "£39.99",
    description: "Sustainable satin canvas. Recycled plastic bottles frame.",
    icon: "leaf-outline" as const,
    prodigiType: "eco_canvas",
  },
  {
    id: "framed",
    name: "Classic Framed Print",
    price: "£44.99",
    description: "A4 in satin-laminated frame. 5 paper types, 8 frame colours.",
    icon: "albums-outline" as const,
    prodigiType: "framed_print",
  },
  {
    id: "mug",
    name: "Photo Mug",
    price: "£17.99",
    description: "11 oz ceramic. Dishwasher & microwave safe.",
    icon: "cafe-outline" as const,
    prodigiType: "mug",
  },
  {
    id: "cushion",
    name: "Canvas Cushion",
    price: "£32.99",
    description: "Handmade faux-canvas throw cushion. Zippered cover.",
    icon: "bed-outline" as const,
    prodigiType: "cushion",
  },
  {
    id: "jigsaw",
    name: "Photo Jigsaw Puzzle",
    price: "£28.99",
    description: "252 or 500 pieces. Full-colour puzzle from your photo.",
    icon: "extension-puzzle-outline" as const,
    prodigiType: "jigsaw",
  },
  {
    id: "coaster",
    name: "Wooden Coasters",
    price: "£24.99",
    description: "4 cork-backed wooden coasters. Gloss finish.",
    icon: "disc-outline" as const,
    prodigiType: "coaster",
  },
];

const ONJJEM_URL = "https://www.onjjem.com/shop/pets";

export function MerchSheet({ visible, onClose, imageUri, breedName, dogName }: MerchSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const openStore = async () => {
    const params = new URLSearchParams();
    params.set("source", "wud");
    if (dogName) params.set("dogName", dogName);
    if (breedName) params.set("breed", breedName);
    if (selectedProduct) params.set("product", selectedProduct);
    const url = `${ONJJEM_URL}?${params.toString()}`;

    const ok = await Linking.canOpenURL(url);
    if (ok) {
      await Linking.openURL(url);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } else {
      Alert.alert("Visit onjjem.com", "Open onjjem.com in your browser to browse the full store.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <View style={styles.handle} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {dogName ? `Print ${dogName} on merch` : "Print your dog on merch"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {dogName
                ? `Choose a product, upload ${dogName}'s photo, and onJJEM prints & ships.`
                : "Choose a product, upload your dog's photo, and onJJEM prints & ships."}
            </Text>
          </View>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={[styles.preview, { borderColor: colors.border }]} resizeMode="cover" />
          )}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE A PRODUCT</Text>
          <View style={styles.products}>
            {PRODUCTS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setSelectedProduct(p.id);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedProduct === p.id ? colors.gold : colors.border,
                    borderWidth: selectedProduct === p.id ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.productIcon, { backgroundColor: colors.navyMid }]}>
                  <Ionicons name={p.icon} size={22} color={selectedProduct === p.id ? colors.gold : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: colors.foreground }]}>{p.name}</Text>
                  <Text style={[styles.productDesc, { color: colors.mutedForeground }]}>{p.description}</Text>
                </View>
                <Text style={[styles.productPrice, { color: colors.gold }]}>{p.price}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={openStore}
            style={[styles.orderBtn, { backgroundColor: colors.gold }]}
          >
            <Ionicons name="open-outline" size={18} color={colors.navy} />
            <Text style={[styles.orderBtnText, { color: colors.navy }]}>
              {selectedProduct
                ? `Go to onJJEM Store ${PRODUCTS.find(p => p.id === selectedProduct)?.name ? `— ${PRODUCTS.find(p => p.id === selectedProduct)?.name}` : ""}`
                : "Go to onJJEM Store"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            You'll be taken to onJJEM.com to upload your photo and checkout.
          </Text>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Fulfilled by onJJEM. Delivery 3–5 business days.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a4558",
    marginBottom: 8,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 8,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  header: { gap: 4, paddingBottom: 8 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginTop: 8,
  },
  products: { gap: 10 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  form: { gap: 14 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  orderBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
