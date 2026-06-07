import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useSubscription } from "@/lib/revenuecat";

export interface UnlockButtonProps {
  /**
   * RevenueCat package identifier used to look up the live price from the
   * current offering. Mutually exclusive with `productId`.
   */
  packageId?: string;
  /**
   * RevenueCat product identifier (e.g. "pupgrade_bark_translator"). Searched
   * across all offerings when a package identifier isn't available — used for
   * Pup-Grade products that aren't part of the main current offering.
   * Mutually exclusive with `packageId`.
   */
  productId?: string;
  /** Price label shown when no live RevenueCat price is available. */
  fallbackPrice?: string;
  onPress: () => void;
  color: string;
  /** True while the purchase transaction is in progress — shows a spinner. */
  loading?: boolean;
  /**
   * Disables interaction without triggering the loading spinner (e.g. while a
   * different item is being purchased). Dims the button to 0.5 opacity.
   */
  disabled?: boolean;
  /**
   * When false (default) the label reads "Unlock for {price}".
   * When true only the bare price string is shown — useful for compact inline buttons.
   */
  showPriceOnly?: boolean;
  /** Overrides applied to the TouchableOpacity container (e.g. borderRadius, borderColor). */
  style?: StyleProp<ViewStyle>;
  /** Overrides applied to the label text (e.g. color for outline-style buttons). */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Reusable unlock / purchase CTA.
 *
 * Reads the live price from the RevenueCat offerings cache when a `packageId` is
 * supplied, shows a spinner while the price is still loading (unless a
 * `fallbackPrice` is available), and shows another spinner while the purchase
 * transaction is in flight.
 */
export function UnlockButton({
  packageId,
  productId,
  fallbackPrice,
  onPress,
  color,
  loading = false,
  disabled = false,
  showPriceOnly = false,
  style,
  textStyle,
}: UnlockButtonProps) {
  const { packageFor, packageForProduct, isOfferingsFetching } = useSubscription();

  const pkg = productId
    ? packageForProduct(productId)
    : packageId
    ? packageFor(packageId)
    : undefined;
  const priceString = pkg?.product.priceString ?? fallbackPrice;

  // Single source of truth: showSpinner drives both rendered content and opacity.
  // Dim to 0.5 whenever disabled (for any reason) but not while a purchase is
  // actively in flight — the spinner already signals "busy" at full opacity.
  // Use isOfferingsFetching so the spinner also appears during region-change refetches,
  // not just the initial load (which is the only case isLoading covers).
  const showSpinner = loading || (isOfferingsFetching && !priceString);
  const isDisabled = disabled || showSpinner;
  const opacity = isDisabled && !loading ? 0.5 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.btn, { backgroundColor: color, opacity }, style]}
    >
      {showSpinner ? (
        <ActivityIndicator color="#0a0e1a" size="small" />
      ) : (
        <Text style={[styles.btnText, textStyle]}>
          {showPriceOnly
            ? (priceString ?? "…")
            : `Unlock for ${priceString ?? "…"}`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#0a0e1a",
  },
});
