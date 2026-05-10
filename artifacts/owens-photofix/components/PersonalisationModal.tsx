import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const CREAM = "#FAF7F2";
const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const MUTED = "#7A6E57";

const FONT_STYLES = [
  {
    id: "elegant_script",
    label: "Elegant Script",
    sub: "Perfect for weddings and heritage portraits",
    preview: "The Smith Family",
    previewStyle: { fontStyle: "italic" as const, fontFamily: "Inter_400Regular" },
  },
  {
    id: "classic_serif",
    label: "Classic Serif",
    sub: "A timeless, professional book-style font",
    preview: "The Smith Family",
    previewStyle: { fontFamily: "Inter_600SemiBold" },
  },
  {
    id: "modern_bold",
    label: "Modern Bold",
    sub: "Clean and easy to read, great for T-shirts",
    preview: "THE SMITH FAMILY",
    previewStyle: { fontFamily: "Inter_700Bold", letterSpacing: 2 },
  },
] as const;

const PLACEMENTS = [
  { id: "bottom_centre", label: "Bottom Centre", sub: "Recommended", recommended: true },
  { id: "top_centre", label: "Top Centre", sub: "Classic headline position", recommended: false },
  { id: "discreet_corner", label: "Discreet Corner", sub: "Subtle & understated", recommended: false },
] as const;

export interface PersonalisationData {
  message: string;
  fontStyle: string;
  placement: string;
}

interface Props {
  visible: boolean;
  productTitle: string;
  productPrice: string;
  onClose: () => void;
  onConfirm: (data: PersonalisationData) => void;
}

export function PersonalisationModal({
  visible,
  productTitle,
  productPrice,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [fontStyle, setFontStyle] = useState<string>("elegant_script");
  const [placement, setPlacement] = useState<string>("bottom_centre");

  const handleConfirm = () => {
    onConfirm({ message, fontStyle, placement });
    setMessage("");
    setFontStyle("elegant_script");
    setPlacement("bottom_centre");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerEyebrow}>ONJJEM</Text>
              <Text style={styles.headerTitle}>Personalise Your Masterpiece</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={DARK} />
            </TouchableOpacity>
          </View>

          {/* Product context */}
          <View style={styles.productTag}>
            <Ionicons name="cube-outline" size={13} color={MUTED} />
            <Text style={styles.productTagText} numberOfLines={1}>{productTitle} · {productPrice}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Complimentary gold badge */}
            <LinearGradient
              colors={["#1C1A14", "#2E2A1E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.complimentaryBadge}
            >
              <LinearGradient
                colors={[GOLD, "#F5D78E", GOLD]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.complimentaryTopBar}
              />
              <View style={styles.complimentaryInner}>
                <View style={styles.complimentaryIconWrap}>
                  <Ionicons name="ribbon" size={18} color={GOLD} />
                </View>
                <View style={styles.complimentaryText}>
                  <Text style={styles.complimentaryLabel}>COMPLIMENTARY</Text>
                  <Text style={styles.complimentaryValue}>Expert Personalisation Included</Text>
                  <Text style={styles.complimentarySub}>No extra charge · Included with every order</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Text message input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Personalisation Text</Text>
              <Text style={styles.sectionHint}>e.g. "The Smith Family" or "Our Wedding Day 1954"</Text>
              <TextInput
                style={styles.textInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Type your message here…"
                placeholderTextColor="#B0A898"
                maxLength={60}
                returnKeyType="done"
                multiline={false}
              />
              <Text style={styles.charCount}>{message.length}/60 characters</Text>
            </View>

            {/* Font style picker */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Choose Your Font Style</Text>
              <View style={styles.optionList}>
                {FONT_STYLES.map((f) => {
                  const active = fontStyle === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => setFontStyle(f.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionRadio, active && styles.optionRadioActive]}>
                        {active && <View style={styles.optionRadioDot} />}
                      </View>
                      <View style={styles.optionBody}>
                        <View style={styles.optionRow}>
                          <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                            {f.label}
                          </Text>
                        </View>
                        <Text style={styles.optionSub}>{f.sub}</Text>
                        {/* Live preview */}
                        <View style={[styles.previewPill, active && styles.previewPillActive]}>
                          <Text style={[styles.previewText, f.previewStyle, active && styles.previewTextActive]}>
                            {message.trim() || f.preview}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Placement picker */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Text Placement</Text>
              <View style={styles.optionList}>
                {PLACEMENTS.map((p) => {
                  const active = placement === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => setPlacement(p.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionRadio, active && styles.optionRadioActive]}>
                        {active && <View style={styles.optionRadioDot} />}
                      </View>
                      <View style={styles.optionBody}>
                        <View style={styles.optionRow}>
                          <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                            {p.label}
                          </Text>
                          {p.recommended && (
                            <View style={styles.recommendedPill}>
                              <Text style={styles.recommendedText}>Recommended</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.optionSub}>{p.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Expert note */}
            <View style={styles.expertNote}>
              <Ionicons name="information-circle-outline" size={16} color={GOLD} />
              <Text style={styles.expertNoteText}>
                Our master restorers will professionally size and typeset your text to perfectly complement your photo.
              </Text>
            </View>
          </ScrollView>

          {/* Add to Basket button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleConfirm}
              activeOpacity={0.87}
            >
              <LinearGradient
                colors={[GOLD, "#A67C00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtnGradient}
              >
                <Ionicons name="basket-outline" size={20} color="#fff" />
                <View>
                  <Text style={styles.addBtnText}>Add to Basket</Text>
                  {message.trim() ? (
                    <Text style={styles.addBtnSub}>With personalisation: "{message.trim()}"</Text>
                  ) : (
                    <Text style={styles.addBtnSub}>No personalisation text — add above to include it</Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleConfirm} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>Skip personalisation &amp; add to basket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1C9BE",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
    gap: 12,
  },
  headerText: { flex: 1, gap: 1 },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Product tag */
  productTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: GOLD_BG,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
  },
  productTagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: MUTED,
    flex: 1,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 20,
  },

  /* Complimentary badge */
  complimentaryBadge: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.3)",
  },
  complimentaryTopBar: {
    height: 2,
  },
  complimentaryInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  complimentaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(201,150,12,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,150,12,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  complimentaryText: { flex: 1, gap: 2 },
  complimentaryLabel: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 3,
  },
  complimentaryValue: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#F5EDD8",
  },
  complimentarySub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(245,237,216,0.55)",
  },

  /* Sections */
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: DARK,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    marginTop: -4,
  },

  /* Text input */
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: DARK,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    textAlign: "right",
    marginTop: -4,
  },

  /* Option cards */
  optionList: { gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E0D8CF",
    borderRadius: 12,
    padding: 14,
  },
  optionCardActive: {
    borderColor: GOLD,
    backgroundColor: GOLD_BG,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C4BAB0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  optionRadioActive: {
    borderColor: GOLD,
  },
  optionRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: GOLD,
  },
  optionBody: { flex: 1, gap: 3 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: DARK,
  },
  optionLabelActive: {
    color: "#8B6200",
  },
  optionSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: MUTED,
  },

  /* Font preview pill */
  previewPill: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F5F2EE",
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E0D8CF",
  },
  previewPillActive: {
    backgroundColor: "#FAF7F2",
    borderColor: GOLD_BORDER,
  },
  previewText: {
    fontSize: 13,
    color: DARK,
  },
  previewTextActive: {
    color: "#8B6200",
  },

  /* Recommended pill */
  recommendedPill: {
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 0.5,
  },

  /* Expert note */
  expertNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 10,
    padding: 12,
  },
  expertNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#7A5C00",
    lineHeight: 18,
    fontStyle: "italic",
  },

  /* Footer */
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    backgroundColor: CREAM,
  },
  addBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  addBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  addBtnText: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  addBtnSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  skipBtnText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    textDecorationLine: "underline",
  },
});
