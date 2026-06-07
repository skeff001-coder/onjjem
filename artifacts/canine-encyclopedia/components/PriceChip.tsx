import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useSubscription } from "@/lib/revenuecat";

interface PriceChipProps {
  packageId: string;
  color: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small coloured chip that shows the live RevenueCat price for a package.
 * Shows a spinner while offerings are loading and no cached price exists yet.
 * Reads `isOfferingsFetching` directly so it reacts to region-change refetches,
 * not just the initial load.
 */
export function PriceChip({ packageId, color, style }: PriceChipProps) {
  const { packageFor, isOfferingsFetching } = useSubscription();
  const pkg = packageFor(packageId);
  const priceString = pkg?.product.priceString;

  return (
    <View style={[styles.chip, { backgroundColor: color + "22" }, style]}>
      {isOfferingsFetching && !priceString ? (
        <ActivityIndicator size="small" color={color} style={styles.spinner} />
      ) : (
        <Text style={[styles.priceText, { color }]}>{priceString ?? "..."}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  spinner: {
    width: 40,
    height: 18,
  },
  priceText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
});
