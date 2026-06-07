import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export interface Region {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
}

export const REGIONS: Region[] = [
  { code: "US", name: "United States",    currency: "USD", currencySymbol: "$",  flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom",   currency: "GBP", currencySymbol: "£",  flag: "🇬🇧" },
  { code: "DE", name: "Germany",          currency: "EUR", currencySymbol: "€",  flag: "🇩🇪" },
  { code: "FR", name: "France",           currency: "EUR", currencySymbol: "€",  flag: "🇫🇷" },
  { code: "IT", name: "Italy",            currency: "EUR", currencySymbol: "€",  flag: "🇮🇹" },
  { code: "ES", name: "Spain",            currency: "EUR", currencySymbol: "€",  flag: "🇪🇸" },
  { code: "CA", name: "Canada",           currency: "CAD", currencySymbol: "C$", flag: "🇨🇦" },
  { code: "AU", name: "Australia",        currency: "AUD", currencySymbol: "A$", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand",      currency: "NZD", currencySymbol: "NZ$",flag: "🇳🇿" },
  { code: "JP", name: "Japan",            currency: "JPY", currencySymbol: "¥",  flag: "🇯🇵" },
  { code: "KR", name: "South Korea",      currency: "KRW", currencySymbol: "₩",  flag: "🇰🇷" },
  { code: "CN", name: "China",            currency: "CNY", currencySymbol: "¥",  flag: "🇨🇳" },
  { code: "IN", name: "India",            currency: "INR", currencySymbol: "₹",  flag: "🇮🇳" },
  { code: "BR", name: "Brazil",           currency: "BRL", currencySymbol: "R$", flag: "🇧🇷" },
  { code: "MX", name: "Mexico",           currency: "MXN", currencySymbol: "MX$",flag: "🇲🇽" },
  { code: "SE", name: "Sweden",           currency: "SEK", currencySymbol: "kr", flag: "🇸🇪" },
  { code: "NO", name: "Norway",           currency: "NOK", currencySymbol: "kr", flag: "🇳🇴" },
  { code: "DK", name: "Denmark",          currency: "DKK", currencySymbol: "kr", flag: "🇩🇰" },
  { code: "CH", name: "Switzerland",      currency: "CHF", currencySymbol: "Fr", flag: "🇨🇭" },
  { code: "PL", name: "Poland",           currency: "PLN", currencySymbol: "zł", flag: "🇵🇱" },
  { code: "SG", name: "Singapore",        currency: "SGD", currencySymbol: "S$", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong",        currency: "HKD", currencySymbol: "HK$",flag: "🇭🇰" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "د.إ", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia",     currency: "SAR", currencySymbol: "ر.س",flag: "🇸🇦" },
  { code: "ZA", name: "South Africa",     currency: "ZAR", currencySymbol: "R",  flag: "🇿🇦" },
  { code: "NG", name: "Nigeria",          currency: "NGN", currencySymbol: "₦",  flag: "🇳🇬" },
  { code: "TR", name: "Turkey",           currency: "TRY", currencySymbol: "₺",  flag: "🇹🇷" },
  { code: "RU", name: "Russia",           currency: "RUB", currencySymbol: "₽",  flag: "🇷🇺" },
  { code: "NL", name: "Netherlands",      currency: "EUR", currencySymbol: "€",  flag: "🇳🇱" },
  { code: "BE", name: "Belgium",          currency: "EUR", currencySymbol: "€",  flag: "🇧🇪" },
];

interface RegionPickerModalProps {
  visible: boolean;
  currentCode: string | null;
  onSelect: (region: Region) => void;
  onClose: () => void;
  onReset?: () => void;
}

export default function RegionPickerModal({
  visible,
  currentCode,
  onSelect,
  onClose,
  onReset,
}: RegionPickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REGIONS;
    return REGIONS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.currency.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (region: Region) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(region);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ width: 60 }} />
          <Text style={[styles.title, { color: colors.foreground }]}>Region / Currency</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeTxt, { color: colors.gold }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search region or currency…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {currentCode && onReset && (
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onReset();
            }}
            style={[styles.resetRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.resetIcon, { backgroundColor: colors.mutedForeground + "22" }]}>
              <Ionicons name="locate-outline" size={18} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowName, { color: colors.foreground }]}>Use device region</Text>
              <Text style={[styles.rowCurrency, { color: colors.mutedForeground }]}>
                Reset to your default storefront
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => {
            const isSelected = item.code === currentCode;
            const isLast = index === filtered.length - 1;
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={[
                  styles.row,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  index === 0 && styles.rowFirst,
                  isLast && styles.rowLast,
                  !isLast && styles.rowBorder,
                ]}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.rowCurrency, { color: colors.mutedForeground }]}>
                    {item.currency} · {item.currencySymbol}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>No regions found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  closeBtn: { width: 60, alignItems: "flex-end" },
  closeTxt: { fontSize: 16, fontFamily: "Inter_500Medium" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  rowLast:  { borderBottomWidth: 1, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  flag: { fontSize: 24 },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowCurrency: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  resetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
