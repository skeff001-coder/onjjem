import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface KnowledgeSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  locked?: boolean;
  onUnlock?: () => void;
  defaultExpanded?: boolean;
}

export function KnowledgeSection({
  title,
  icon,
  children,
  locked = false,
  onUnlock,
  defaultExpanded = false,
}: KnowledgeSectionProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    if (locked) {
      onUnlock?.();
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <TouchableOpacity onPress={toggle} style={styles.header} activeOpacity={0.75}>
        <View style={[styles.iconWrap, { backgroundColor: locked ? colors.navyMid : colors.navyMid }]}>
          <Ionicons name={icon} size={18} color={locked ? colors.mutedForeground : colors.gold} />
        </View>
        <Text style={[styles.title, { color: locked ? colors.mutedForeground : colors.foreground }]}>
          {title}
        </Text>
        <View style={styles.right}>
          {locked ? (
            <View style={[styles.lockBadge, { backgroundColor: colors.gold }]}>
              <Ionicons name="lock-closed" size={11} color={colors.navy} />
            </View>
          ) : (
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.mutedForeground}
            />
          )}
        </View>
      </TouchableOpacity>

      {!locked && expanded && (
        <View style={[styles.content, { borderTopColor: colors.border }]}>{children}</View>
      )}

      {locked && (
        <View style={[styles.lockedContent, { borderTopColor: colors.border }]}>
          <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
            Unlock Deep Knowledge to access this section
          </Text>
          <TouchableOpacity
            onPress={onUnlock}
            style={[styles.unlockBtn, { backgroundColor: colors.gold }]}
          >
            <Ionicons name="lock-open" size={14} color={colors.navy} />
            <Text style={[styles.unlockText, { color: colors.navy }]}>Unlock</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  const colors = useColors();
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

interface TagListProps {
  items: string[];
  color?: string;
}

export function TagList({ items, color }: TagListProps) {
  const colors = useColors();
  const tagColor = color ?? colors.gold;
  return (
    <View style={tagStyles.container}>
      {items.map((item, i) => (
        <View key={i} style={[tagStyles.tag, { borderColor: tagColor + "44", backgroundColor: tagColor + "11" }]}>
          <Text style={[tagStyles.text, { color: tagColor }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  right: {
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 8,
  },
  lockedContent: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: "flex-start",
  },
  lockedText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unlockText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 2,
    textAlign: "right",
  },
});

const tagStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
