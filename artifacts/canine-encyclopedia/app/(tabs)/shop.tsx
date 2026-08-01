import React from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const ONJJEM_URL = "https://onjjem.com";

// Categories mirror the real shop sections on onjjem.com.
// Deliberately no prices here — prices live on the website only, so this
// screen can never drift out of date the way a hardcoded catalogue does.
const CATEGORIES = [
  {
    id: "canvas",
    label: "Canvas & Wall Art",
    blurb: "Gallery-wrapped canvas prints, ready to hang",
    icon: "image-outline" as const,
  },
  {
    id: "mugs",
    label: "Mugs",
    blurb: "Including the colour-changing Magic Mug",
    icon: "cafe-outline" as const,
  },
  {
    id: "gift-tags",
    label: "Pet Gift Tags",
    blurb: "Durable metal tags with their photo and your number",
    icon: "pricetag-outline" as const,
  },
  {
    id: "toys-games",
    label: "Toys & Games",
    blurb: "Photo jigsaws and playing cards",
    icon: "extension-puzzle-outline" as const,
  },
  {
    id: "frames-tiles",
    label: "Frames & Tiles",
    blurb: "Box frames and framed photo tiles",
    icon: "albums-outline" as const,
  },
  {
    id: "kitchen",
    label: "Kitchen",
    blurb: "Coasters, tea towels and more",
    icon: "restaurant-outline" as const,
  },
  {
    id: "magnets",
    label: "Magnets",
    blurb: "Fridge magnets in a range of sizes",
    icon: "magnet-outline" as const,
  },
];

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const openShop = async (path?: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = path ? `${ONJJEM_URL}/${path}` : ONJJEM_URL;
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Alert.alert("Visit onjjem.com in your browser.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isWeb ? 34 + insets.bottom : insets.bottom + 100,
        }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>That's My Dog!</Text>
            <Text style={[styles.subtitle, { color: colors.gold }]}>
              Personalised gifts from their photo
            </Text>
          </View>
          <View
            style={[
              styles.starBadge,
              { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" },
            ]}
          >
            <Ionicons name="paw" size={14} color={colors.gold} />
          </View>
        </View>

        {/* Hero — the single main call to action */}
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.navyMid, borderColor: colors.gold + "44" },
          ]}
        >
          <View style={[styles.officialChip, { backgroundColor: colors.gold }]}>
            <Ionicons name="star" size={12} color={colors.navy} />
            <Text style={[styles.officialChipText, { color: colors.navy }]}>
              FROM ONJJEM, OUR SISTER COMPANY
            </Text>
          </View>

          <Text style={[styles.heroHeading, { color: colors.foreground }]}>
            Turn their photo into something you'll keep
          </Text>
          <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
            ONJJEM is run by the same team behind What's Up Dog!. Upload any photo of your
            dog and they'll print it onto canvas, mugs, jigsaws, gift tags and more —
            made to order in the UK and delivered gift-wrapped.
          </Text>

          <TouchableOpacity
            onPress={() => openShop()}
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
          >
            <Ionicons name="globe-outline" size={18} color={colors.navy} />
            <Text style={[styles.primaryBtnText, { color: colors.navy }]}>
              BROWSE THE SHOP
            </Text>
            <Ionicons name="open-outline" size={15} color={colors.navy} />
          </TouchableOpacity>

          <Text style={[styles.heroNote, { color: colors.mutedForeground }]}>
            Opens onjjem.com · Live prices and sizes shown there
          </Text>
        </View>

        {/* Categories — text rows, no product imagery */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            What they make
          </Text>

          <View
            style={[
              styles.list,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => openShop()}
                activeOpacity={0.7}
                style={[
                  styles.row,
                  i < CATEGORIES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: colors.gold + "1a", borderColor: colors.gold + "33" },
                  ]}
                >
                  <Ionicons name={cat.icon} size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {cat.label}
                  </Text>
                  <Text style={[styles.rowBlurb, { color: colors.mutedForeground }]}>
                    {cat.blurb}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            How it works
          </Text>
          <View style={{ gap: 12 }}>
            {[
              {
                n: "1",
                title: "Pick a product",
                body: "Browse the shop and choose what you'd like their photo on.",
              },
              {
                n: "2",
                title: "Upload their photo",
                body: "Any clear photo works. You'll see it on the product before you pay.",
              },
              {
                n: "3",
                title: "Made and posted",
                body: "Printed to order in the UK and delivered in 3–5 working days.",
              },
            ].map((step) => (
              <View
                key={step.n}
                style={[
                  styles.stepCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.stepNum, { backgroundColor: colors.gold }]}>
                  <Text style={[styles.stepNumText, { color: colors.navy }]}>{step.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Trust strip */}
        <View
          style={[
            styles.trustStrip,
            { backgroundColor: colors.navyMid, borderColor: colors.border },
          ]}
        >
          {[
            { icon: "flag-outline" as const, label: "Made\nin the UK" },
            { icon: "car-outline" as const, label: "3–5 day\ndelivery" },
            { icon: "gift-outline" as const, label: "Gift-wrapped\nas standard" },
            { icon: "shield-checkmark-outline" as const, label: "Secure\ncheckout" },
          ].map((t) => (
            <View key={t.label} style={styles.trustItem}>
              <Ionicons name={t.icon} size={20} color={colors.gold} />
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>
                {t.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer link */}
        <TouchableOpacity
          onPress={() => openShop()}
          activeOpacity={0.7}
          style={styles.footerLink}
        >
          <Text style={[styles.footerLinkText, { color: colors.gold }]}>onjjem.com</Text>
          <Ionicons name="open-outline" size={14} color={colors.gold} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  starBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  hero: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  officialChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  officialChipText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.7 },
  heroHeading: { fontSize: 21, fontWeight: "800", marginTop: 14, lineHeight: 27 },
  heroBody: { fontSize: 13.5, lineHeight: 20, marginTop: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 16,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "800", letterSpacing: 0.6 },
  heroNote: { fontSize: 11, textAlign: "center", marginTop: 9 },

  section: { paddingHorizontal: 20, marginTop: 26 },
  sectionHeading: { fontSize: 17, fontWeight: "800", marginBottom: 12 },

  list: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontWeight: "700" },
  rowBlurb: { fontSize: 12.5, marginTop: 2, lineHeight: 17 },

  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 13, fontWeight: "800" },
  stepTitle: { fontSize: 14.5, fontWeight: "700" },
  stepBody: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },

  trustStrip: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginTop: 26,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  trustItem: { alignItems: "center", gap: 6, flex: 1 },
  trustLabel: { fontSize: 10.5, textAlign: "center", lineHeight: 14, fontWeight: "600" },

  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 22,
    paddingVertical: 10,
  },
  footerLinkText: { fontSize: 13, fontWeight: "700" },
});
