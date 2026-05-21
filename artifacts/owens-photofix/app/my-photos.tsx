import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
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
import { deleteFromHistory, loadHistory, updateHistoryLabel, type HistoryEntry } from "@/lib/photoHistory";
import { resetOnboardingHints, ONBOARDING_HINT_KEYS, ONBOARDING_HINT_LABELS, type OnboardingHintKey } from "@/lib/onboardingHints";
import { PinchZoomView } from "@/components/PinchZoomView";

const GOLD = "#C9960C";
const GOLD_BG = "#FDF6DC";
const GOLD_BORDER = "#E8D48B";
const DARK = "#1C1A14";
const CREAM = "#FAF7F2";
const MUTED = "#7A6E57";
const SCREEN_W = Dimensions.get("window").width;
const THUMB_SIZE = (SCREEN_W - 18 * 2 - 10) / 3;

const SORT_ORDER_KEY = "gallery_sort_order";
type SortOrder = "newest" | "oldest";

const ENHANCEMENT_LABELS: Record<string, string> = {
  sharpen: "Sharpen",
  brighten: "Brighten",
  denoise: "Denoise",
  restore: "Restore",
  vivid: "Vivid",
  colourize: "Colourize",
};

function buildModeLabel(modes: string[]): string {
  const names = modes.map((m) => ENHANCEMENT_LABELS[m] ?? m);
  return names.join(" + ") + " applied";
}

function formatDate(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Dual-URI before/after slider (for local file:// URIs) ──
function DualUriSlider({ beforeUri, afterUri }: { beforeUri: string; afterUri: string }) {
  const containerWidthRef = useRef(300);
  const [containerWidth, setContainerWidth] = useState(300);
  const startPositionRef = useRef(0.5);
  const positionRef = useRef(0.5);
  const [sliderPos, setSliderPos] = useState(0.5);

  // Start hidden; reveal only if the user has never dragged before.
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const hintHiddenRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenSliderDrag").then((val) => {
      if (val === null) {
        // First-time user — show the hint.
        hintOpacity.setValue(1);
      } else {
        // Already dragged before — keep hint hidden.
        hintHiddenRef.current = true;
      }
    }).catch(() => {
      // AsyncStorage unavailable — show the hint as a safe fallback.
      hintOpacity.setValue(1);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        startPositionRef.current = positionRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!hintHiddenRef.current && Math.abs(gestureState.dx) > 4) {
          hintHiddenRef.current = true;
          Animated.timing(hintOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
          AsyncStorage.setItem("hasSeenSliderDrag", "1").catch(() => {});
        }
        const newPos = Math.max(
          0.03,
          Math.min(0.97, startPositionRef.current + gestureState.dx / containerWidthRef.current),
        );
        positionRef.current = newPos;
        setSliderPos(newPos);
      },
    }),
  ).current;

  const clipWidth = sliderPos * containerWidth;

  return (
    <View
      style={sl.container}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      <Image source={{ uri: afterUri }} style={sl.image} resizeMode="cover" />
      <View style={[sl.beforeClip, { width: clipWidth }]}>
        <Image
          source={{ uri: beforeUri }}
          style={[sl.image, { width: containerWidthRef.current }]}
          resizeMode="cover"
        />
      </View>
      <View style={[sl.label, sl.labelLeft]}>
        <Text style={sl.labelText}>Before</Text>
      </View>
      <View style={[sl.label, sl.labelRight]}>
        <Text style={sl.labelText}>After</Text>
      </View>
      <View style={[sl.dividerWrapper, { left: clipWidth - 1 }]} {...panResponder.panHandlers}>
        <View style={sl.dividerLine} />
        <View style={sl.handle}>
          <Ionicons name="chevron-back" size={13} color="#111" />
          <Ionicons name="chevron-forward" size={13} color="#111" />
        </View>
        <Animated.View
          style={[sl.hintBubble, { opacity: hintOpacity }]}
          pointerEvents="none"
        >
          <Text style={sl.hintText}>DRAG</Text>
        </Animated.View>
        <View style={sl.dividerLine} />
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#111",
  },
  image: { position: "absolute", width: "100%", height: "100%" },
  beforeClip: { position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden" },
  label: {
    position: "absolute",
    top: 12,
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  labelLeft: { left: 12 },
  labelRight: { right: 12 },
  labelText: { color: "#fff", fontSize: 12, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  dividerWrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 42,
    marginLeft: -21,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerLine: { flex: 1, width: 2, backgroundColor: "rgba(255,255,255,0.9)" },
  handle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  hintBubble: {
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: -5,
  },
  hintText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800" as const,
    letterSpacing: 1.4,
  },
});

// ── Detail Modal ──
function DetailModal({
  entry,
  visible,
  onClose,
  onDelete,
  onLabelChange,
}: {
  entry: HistoryEntry | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [labelText, setLabelText] = useState(entry?.label ?? "");

  useEffect(() => {
    setLabelText(entry?.label ?? "");
  }, [entry?.id, entry?.label]);

  const handleLabelBlur = async () => {
    if (!entry) return;
    await updateHistoryLabel(entry.id, labelText);
    onLabelChange(entry.id, labelText.trim());
  };

  const handleShare = async () => {
    if (!entry) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (Platform.OS === "web") {
        Alert.alert("Share", "Open WhatsApp and share the saved image.");
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Sharing unavailable", "Sharing is not supported on this device.");
        return;
      }
      await Sharing.shareAsync(entry.resultLocalUri, {
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
        dialogTitle: "Share your restored photo",
      });
    } catch {
      Alert.alert("Error", "Could not share the image. Please try again.");
    }
  };

  const handleSaveToPhotos = async () => {
    if (!entry) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (Platform.OS === "web") {
        Alert.alert("Save to Photos", "Saving to the Camera Roll is only available on iPhone.");
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please allow access to Photos in Settings to save images to your Camera Roll.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(entry.resultLocalUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Your restored photo has been saved to your Camera Roll.");
    } catch {
      Alert.alert("Error", "Could not save the image. Please try again.");
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    Alert.alert(
      "Delete Restoration",
      "This will permanently remove the photo from your history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onClose();
            onDelete(entry.id);
          },
        },
      ],
    );
  };

  if (!entry) return null;

  const modeLabel = buildModeLabel(entry.modes);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[dm.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dm.goldBar} />

        <View style={dm.header}>
          <TouchableOpacity style={dm.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={22} color={DARK} />
          </TouchableOpacity>
          <View style={dm.headerCenter}>
            <Text style={dm.headerEyebrow}>MY RESTORATIONS</Text>
            <Text style={dm.headerTitle}>{formatDate(entry.timestamp)}</Text>
          </View>
          <TouchableOpacity style={dm.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color="#C0392B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={dm.scroll}
          contentContainerStyle={[dm.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={dm.metaRow}>
            <View style={dm.modeBadge}>
              <Ionicons name="sparkles" size={11} color={GOLD} />
              <Text style={dm.modeBadgeText}>{modeLabel}</Text>
            </View>
            <Text style={dm.timeText}>{formatTime(entry.timestamp)}</Text>
          </View>

          <View style={dm.labelWrap}>
            <Ionicons name="pricetag-outline" size={14} color={GOLD} style={dm.labelIcon} />
            <TextInput
              style={dm.labelInput}
              value={labelText}
              onChangeText={setLabelText}
              onBlur={handleLabelBlur}
              placeholder="Add a name or note…"
              placeholderTextColor={MUTED}
              returnKeyType="done"
              onSubmitEditing={handleLabelBlur}
              maxLength={80}
            />
          </View>

          <View style={dm.sliderWrap}>
            <View style={dm.zoomWrapper}>
              <PinchZoomView style={{ width: "100%", height: "100%" }}>
                <DualUriSlider beforeUri={entry.originalLocalUri} afterUri={entry.resultLocalUri} />
              </PinchZoomView>
            </View>
            <View style={dm.dragHint}>
              <Ionicons name="swap-horizontal-outline" size={13} color={MUTED} />
              <Text style={dm.dragHintText}>Drag the handle to compare before &amp; after</Text>
            </View>
          </View>

          <TouchableOpacity style={dm.shareBtn} onPress={handleShare} activeOpacity={0.87}>
            <LinearGradient
              colors={["#128C7E", "#25D366", "#128C7E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={dm.shareBtnGradient}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              <Text style={dm.shareBtnText}>Share to WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={dm.savePhotosBtn} onPress={handleSaveToPhotos} activeOpacity={0.87}>
            <Ionicons name="download-outline" size={18} color={DARK} />
            <Text style={dm.savePhotosBtnText}>Save to Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={dm.shareAnyBtn} onPress={handleShare} activeOpacity={0.87}>
            <Ionicons name="share-outline" size={18} color={DARK} />
            <Text style={dm.shareAnyBtnText}>Share via…</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  goldBar: { height: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
    backgroundColor: CREAM,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 1 },
  headerEyebrow: { fontSize: 10, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: GOLD, letterSpacing: 3 },
  headerTitle: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: DARK },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5B7B1",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, gap: 16, paddingTop: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBadgeText: { fontSize: 11, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: GOLD, letterSpacing: 0.8 },
  timeText: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },
  sliderWrap: { gap: 8 },
  zoomWrapper: {
    width: "100%",
    aspectRatio: 1,
  },
  dragHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  dragHintText: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  shareBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#128C7E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  shareBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  shareBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  savePhotosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EBF5FB",
    borderWidth: 1,
    borderColor: "#AED6F1",
    borderRadius: 14,
    paddingVertical: 14,
  },
  savePhotosBtnText: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", color: "#1A5276" },
  shareAnyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareAnyBtnText: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", color: DARK },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GOLD_BG,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  labelIcon: { marginRight: 8 },
  labelInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: DARK,
    paddingVertical: 12,
  },
});

// ── Gallery Hint Toast ──
function GalleryHint({ opacity, onDismiss }: { opacity: Animated.Value; onDismiss: () => void }) {
  return (
    <Animated.View style={[gh.wrap, { opacity }]} pointerEvents="box-none">
      {/* Scrim — dims the bottom of the photo grid so the pill always pops.
          pointerEvents="none" keeps all thumbnail taps working beneath it. */}
      <View style={gh.scrim} pointerEvents="none">
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.48)"]}
          style={gh.scrimGradient}
        />
      </View>

      <TouchableOpacity onPress={onDismiss} activeOpacity={0.8}>
        <View style={gh.pill}>
          <Ionicons name="hand-left-outline" size={15} color={GOLD} />
          <Text style={gh.text}>Tap any photo to compare before &amp; after</Text>
          <View style={gh.divider} />
          <Ionicons name="close" size={15} color="rgba(255,255,255,0.55)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const gh = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 28,
    zIndex: 10,
  },
  scrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  scrimGradient: {
    flex: 1,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: DARK,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginHorizontal: 4,
  },
});

// ── Filter Chips ──
const ALL_FILTER = "all";

function FilterChips({
  modes,
  active,
  onSelect,
}: {
  modes: string[];
  active: string;
  onSelect: (mode: string) => void;
}) {
  const chips = [ALL_FILTER, ...modes];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={fc.row}
      style={fc.strip}
    >
      {chips.map((chip) => {
        const isActive = chip === active;
        const label = chip === ALL_FILTER ? "All" : (ENHANCEMENT_LABELS[chip] ?? chip);
        return (
          <TouchableOpacity
            key={chip}
            style={[fc.chip, isActive && fc.chipActive]}
            onPress={() => onSelect(chip)}
            activeOpacity={0.75}
          >
            <Text style={[fc.chipText, isActive && fc.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const fc = StyleSheet.create({
  strip: {
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
    backgroundColor: CREAM,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    backgroundColor: CREAM,
  },
  chipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: MUTED,
  },
  chipTextActive: {
    color: "#fff",
  },
});

// ── Hint Reset Modal ──
function HintResetModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (keys: OnboardingHintKey[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<OnboardingHintKey>>(
    () => new Set(ONBOARDING_HINT_KEYS),
  );

  useEffect(() => {
    if (visible) {
      setSelected(new Set(ONBOARDING_HINT_KEYS));
    }
  }, [visible]);

  const toggleKey = (key: OnboardingHintKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const allSelected = selected.size === ONBOARDING_HINT_KEYS.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ONBOARDING_HINT_KEYS));
    }
  };

  const handleConfirm = () => {
    const keys = ONBOARDING_HINT_KEYS.filter((k) => selected.has(k));
    onConfirm(keys);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={hr.overlay}>
        <View style={[hr.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={hr.goldBar} />

          <View style={hr.headerRow}>
            <Ionicons name="refresh-circle-outline" size={20} color={GOLD} />
            <Text style={hr.title}>Reset Hints</Text>
          </View>
          <Text style={hr.subtitle}>Choose which hints to clear. They will reappear the next time each flow is triggered.</Text>

          <View style={hr.divider} />

          <TouchableOpacity style={hr.selectAllRow} onPress={toggleAll} activeOpacity={0.7}>
            <View style={[hr.checkbox, allSelected && hr.checkboxChecked]}>
              {allSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={hr.selectAllText}>Select all</Text>
          </TouchableOpacity>

          {ONBOARDING_HINT_KEYS.map((key) => {
            const isChecked = selected.has(key);
            return (
              <TouchableOpacity
                key={key}
                style={hr.row}
                onPress={() => toggleKey(key)}
                activeOpacity={0.7}
              >
                <View style={[hr.checkbox, isChecked && hr.checkboxChecked]}>
                  {isChecked && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={hr.rowLabel}>{ONBOARDING_HINT_LABELS[key]}</Text>
                <Text style={hr.rowKey}>{key}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={hr.divider} />

          <View style={hr.btnRow}>
            <TouchableOpacity style={hr.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={hr.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[hr.confirmBtn, selected.size === 0 && hr.confirmBtnDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={selected.size === 0}
            >
              <Ionicons name="refresh" size={15} color={selected.size === 0 ? MUTED : "#fff"} />
              <Text style={[hr.confirmBtnText, selected.size === 0 && hr.confirmBtnTextDisabled]}>
                Reset {selected.size === ONBOARDING_HINT_KEYS.length ? "All" : selected.size > 0 ? `${selected.size}` : "None"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const hr = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.52)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    paddingHorizontal: 20,
  },
  goldBar: { height: 3, marginHorizontal: -20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 6,
  },
  title: { fontSize: 17, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: DARK },
  subtitle: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 18, paddingBottom: 14 },
  divider: { height: 1, backgroundColor: GOLD_BORDER, marginVertical: 4 },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  selectAllText: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", color: DARK },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,150,12,0.12)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GOLD_BORDER,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  rowLabel: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", color: DARK, flex: 1 },
  rowKey: { fontSize: 10, color: MUTED, fontFamily: "Inter_400Regular", letterSpacing: 0.2 },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    backgroundColor: GOLD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", color: DARK },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: GOLD,
  },
  confirmBtnDisabled: { backgroundColor: GOLD_BG, borderWidth: 1.5, borderColor: GOLD_BORDER },
  confirmBtnText: { fontSize: 14, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: "#fff" },
  confirmBtnTextDisabled: { color: MUTED },
});

// ── Main Screen ──
export default function MyPhotosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 72) : insets.top;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintResetModalVisible, setHintResetModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const hintAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load persisted sort order on mount
  useEffect(() => {
    void AsyncStorage.getItem(SORT_ORDER_KEY).then((saved) => {
      if (saved === "oldest" || saved === "newest") setSortOrder(saved);
    });
  }, []);

  const toggleSortOrder = useCallback(async () => {
    await Haptics.selectionAsync();
    setSortOrder((prev) => {
      const next: SortOrder = prev === "newest" ? "oldest" : "newest";
      void AsyncStorage.setItem(SORT_ORDER_KEY, next);
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const entries = await loadHistory();
    // Filter out entries whose files no longer exist
    const valid: HistoryEntry[] = [];
    for (const e of entries) {
      try {
        if (Platform.OS !== "web") {
          const info = await FileSystem.getInfoAsync(e.resultLocalUri);
          if (info.exists) valid.push(e);
        } else {
          valid.push(e);
        }
      } catch {
        // skip corrupt entries
      }
    }
    setHistory(valid);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Show the one-time gallery hint after photos have loaded
  useEffect(() => {
    if (loading || history.length === 0) return;
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem("hasSeenGalleryHint");
        if (seen) return;
        await AsyncStorage.setItem("hasSeenGalleryHint", "1");
        setShowHint(true);
        const anim = Animated.sequence([
          Animated.timing(hintOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(hintOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]);
        hintAnimRef.current = anim;
        anim.start(({ finished }) => {
          hintAnimRef.current = null;
          if (finished) setShowHint(false);
        });
      } catch {
        // AsyncStorage unavailable — skip hint silently
      }
    })();
  }, [loading, history.length, hintOpacity]);

  const dismissHint = useCallback(() => {
    if (hintAnimRef.current) {
      hintAnimRef.current.stop();
      hintAnimRef.current = null;
    }
    Animated.timing(hintOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
      setShowHint(false),
    );
  }, [hintOpacity]);

  const openEntry = async (entry: HistoryEntry) => {
    await Haptics.selectionAsync();
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFromHistory(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
  };

  // Derive the set of modes that actually appear in history (preserving ENHANCEMENT_LABELS order)
  const availableModes = Object.keys(ENHANCEMENT_LABELS).filter((m) =>
    history.some((e) => e.modes.includes(m)),
  );

  // If the active filter mode was removed from history (e.g. all matching items deleted),
  // reset back to "All" so the user is never left with an empty gallery and no way to recover.
  useEffect(() => {
    if (activeFilter !== ALL_FILTER && !availableModes.includes(activeFilter)) {
      setActiveFilter(ALL_FILTER);
    }
  }, [availableModes, activeFilter]);

  const filteredHistory = React.useMemo(() => {
    const base =
      activeFilter === ALL_FILTER
        ? history
        : history.filter((e) => e.modes.includes(activeFilter));
    if (sortOrder === "oldest") {
      return [...base].sort((a, b) => a.timestamp - b.timestamp);
    }
    return [...base].sort((a, b) => b.timestamp - a.timestamp);
  }, [history, activeFilter, sortOrder]);

  const handleLabelChange = useCallback((id: string, label: string) => {
    setHistory((prev) =>
      prev.map((e) => (e.id === id ? { ...e, label: label || undefined } : e)),
    );
    setSelectedEntry((prev) => (prev?.id === id ? { ...prev, label: label || undefined } : prev));
  }, []);

  const renderThumb = ({ item }: { item: HistoryEntry }) => (
    <Pressable style={s.thumb} onPress={() => openEntry(item)}>
      <Image source={{ uri: item.resultLocalUri }} style={s.thumbImage} resizeMode="cover" />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.62)"]} style={s.thumbGradient} />
      <View style={s.thumbMeta}>
        <Text style={s.thumbMode} numberOfLines={1}>
          {item.label ? item.label : buildModeLabel(item.modes)}
        </Text>
        <Text style={s.thumbDate}>{formatDate(item.timestamp)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {showHint && <GalleryHint opacity={hintOpacity} onDismiss={dismissHint} />}
      <LinearGradient colors={[GOLD, "#F5D78E", GOLD, "#A67C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.goldBar} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.headerCenter}
          activeOpacity={1}
          onLongPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setHintResetModalVisible(true);
          }}
          delayLongPress={1500}
        >
          <Text style={s.headerEyebrow}>ONJJEM</Text>
          <Text style={s.headerTitle}>My Restorations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.sortBtn} onPress={toggleSortOrder} activeOpacity={0.7}>
          <Ionicons
            name={sortOrder === "newest" ? "arrow-down" : "arrow-up"}
            size={14}
            color={GOLD}
          />
          <Text style={s.sortBtnText}>{sortOrder === "newest" ? "New" : "Old"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>Loading…</Text>
        </View>
      ) : history.length === 0 ? (
        <ScrollView contentContainerStyle={[s.emptyWrap, { paddingBottom: insets.bottom + 32 }]}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="images-outline" size={52} color={GOLD_BORDER} />
          </View>
          <Text style={s.emptyTitle}>No restorations yet</Text>
          <Text style={s.emptySub}>
            Photos you enhance will appear here so you can review and share them any time.
          </Text>
          <TouchableOpacity
            style={s.emptyCtaBtn}
            onPress={() => router.replace("/")}
            activeOpacity={0.87}
          >
            <LinearGradient
              colors={["#A67C00", GOLD, "#E8B422", GOLD]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.emptyCtaGradient}
            >
              <Ionicons name="color-wand" size={20} color="#fff" />
              <Text style={s.emptyCtaText}>Restore Your First Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {availableModes.length >= 1 && (
            <FilterChips
              modes={availableModes}
              active={activeFilter}
              onSelect={setActiveFilter}
            />
          )}
          {filteredHistory.length === 0 ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="filter-outline" size={40} color={GOLD_BORDER} />
              </View>
              <Text style={s.emptyTitle}>No {ENHANCEMENT_LABELS[activeFilter] ?? activeFilter} photos</Text>
              <Text style={s.emptySub}>Try selecting a different filter above.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredHistory}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={renderThumb}
              contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 32 }]}
              columnWrapperStyle={s.gridRow}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={s.listHeader}>
                  <Text style={s.listHeaderText}>
                    {filteredHistory.length} {filteredHistory.length === 1 ? "restoration" : "restorations"}{activeFilter !== ALL_FILTER ? ` · ${ENHANCEMENT_LABELS[activeFilter] ?? activeFilter}` : " saved"}
                  </Text>
                  <Text style={s.listHeaderSub}>Tap any photo to compare before &amp; after</Text>
                </View>
              }
            />
          )}
        </>
      )}

      <DetailModal
        entry={selectedEntry}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDelete={handleDelete}
        onLabelChange={handleLabelChange}
      />

      <HintResetModal
        visible={hintResetModalVisible}
        onClose={() => setHintResetModalVisible(false)}
        onConfirm={async (keys) => {
          setHintResetModalVisible(false);
          try {
            await resetOnboardingHints(keys);
            const label =
              keys.length === ONBOARDING_HINT_KEYS.length
                ? "All hints"
                : keys.length === 1
                  ? `"${ONBOARDING_HINT_LABELS[keys[0]]}"`
                  : `${keys.length} hints`;
            Alert.alert("Hints Reset", `${label} cleared. ${keys.length === 1 ? "It" : "They"} will reappear the next time each flow is triggered.`);
          } catch {
            Alert.alert("Reset Failed", "Could not clear hints. Please try again.");
          }
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  goldBar: { height: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_BORDER,
    backgroundColor: CREAM,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 1 },
  headerEyebrow: { fontSize: 10, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: GOLD, letterSpacing: 3 },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: DARK, letterSpacing: 0.2 },
  sortBtn: {
    width: 52,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_BG,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 3,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 0.3,
  },

  grid: { paddingHorizontal: 18, paddingTop: 14 },
  gridRow: { gap: 5 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 5,
    backgroundColor: "#E8DBC0",
  },
  thumbImage: { width: "100%", height: "100%" },
  thumbGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" },
  thumbMeta: { position: "absolute", bottom: 6, left: 6, right: 6 },
  thumbMode: { fontSize: 9, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.6 },
  thumbDate: { fontSize: 8, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 1 },

  listHeader: { marginBottom: 12, gap: 3 },
  listHeaderText: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: DARK },
  listHeaderSub: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 12,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GOLD_BG,
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" as const, fontFamily: "Inter_700Bold", color: DARK, textAlign: "center" },
  emptySub: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyCtaBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 7,
  },
  emptyCtaGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyCtaText: { color: "#fff", fontSize: 15, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular" },
});
