import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  TextInput,
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
    id: "dog_ball",
    name: "Custom Dog Ball",
    price: "£19.99",
    description: "Premium rubber ball printed with your dog's photo",
    icon: "football-outline" as const,
  },
  {
    id: "canvas_print",
    name: "Canvas Print",
    price: "£34.99",
    description: "Gallery-quality canvas featuring your dog's portrait",
    icon: "image-outline" as const,
  },
  {
    id: "tote_bag",
    name: "Tote Bag",
    price: "£14.99",
    description: "Eco-friendly tote with your dog's image",
    icon: "bag-outline" as const,
  },
];

export function MerchSheet({ visible, onClose, imageUri, breedName, dogName }: MerchSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [ordering, setOrdering] = useState(false);

  const handleOrder = async () => {
    if (!selectedProduct) {
      Alert.alert("Select a product", "Please choose a product first.");
      return;
    }
    if (!name || !email || !address) {
      Alert.alert("Fill in details", "Please complete all shipping fields.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setOrdering(true);
    await new Promise((r) => setTimeout(r, 1500));
    setOrdering(false);

    Alert.alert(
      "Order Submitted",
      "Your personalised merchandise has been ordered via ONJJEM. You'll receive a confirmation email shortly.",
      [{ text: "Done", onPress: onClose }],
    );
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
              {dogName ? `Something special for ${dogName}` : "That's My Dog! Shop"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {dogName
                ? `Personalised keepsakes for ${dogName} — your ${breedName ?? "dog"}`
                : `Custom merchandise with ${breedName ? `your ${breedName}` : "your dog"}'s photo`}
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

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SHIPPING DETAILS</Text>
          <View style={styles.form}>
            {([
              { key: "name", label: "Full name", value: name, setter: setName, placeholder: "Jane Smith" },
              { key: "email", label: "Email", value: email, setter: setEmail, placeholder: "jane@example.com", keyboard: "email-address" as const },
              { key: "address", label: "Shipping address", value: address, setter: setAddress, placeholder: "123 Dog Lane, London, UK", multiline: true },
            ] as const).map((field) => (
              <View key={field.key} style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground + "66"}
                  keyboardType={"keyboard" in field ? field.keyboard : "default"}
                  multiline={"multiline" in field ? field.multiline : false}
                  style={[
                    styles.input,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.navyMid,
                      borderColor: colors.border,
                      minHeight: "multiline" in field && field.multiline ? 72 : 48,
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleOrder}
            disabled={ordering}
            style={[styles.orderBtn, { backgroundColor: colors.gold, opacity: ordering ? 0.7 : 1 }]}
          >
            <Ionicons name="bag-add" size={18} color={colors.navy} />
            <Text style={[styles.orderBtnText, { color: colors.navy }]}>
              {ordering ? "Placing order..." : "Order via ONJJEM"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Fulfilled by ONJJEM.com · Bags of Love. Delivery 3–5 business days.
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
