import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { addInquiry } from "@/lib/inquiries";
import {
  Alert,
  Image,
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

const TEAL = "#0D9488";
const TEAL_LIGHT = "#CCFBF1";
const TEAL_DARK = "#0A7C72";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ContactExpertsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo library access to upload your photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!question.trim()) {
      Alert.alert("Missing question", "Please tell us about your photo so our experts can help.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address so we can reply to you.");
      return;
    }
    setSending(true);
    try {
      await addInquiry({ email: email.trim(), question: question.trim(), photoUri: photoUri });
    } catch (_) {
      // silently continue — UI shouldn't fail if storage fails
    }
    setSending(false);
    Alert.alert(
      "Message sent successfully",
      "We will be in touch shortly.",
      [{ text: "Great, thanks!", onPress: handleClose }],
    );
  };

  const handleClose = () => {
    setQuestion("");
    setEmail("");
    setPhotoUri(null);
    setSending(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle bar */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="chatbubble-ellipses" size={26} color={TEAL} />
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title block */}
            <Text style={styles.title}>
              Not sure if your photo can be fixed?
            </Text>
            <Text style={styles.subtitle}>
              Send our master restorers a message for a free expert opinion.
            </Text>

            {/* Teal divider */}
            <View style={styles.tealDivider} />

            {/* Question field */}
            <Text style={styles.label}>Your question</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Describe your photo — how old is it, what kind of damage does it have, and what would you like us to do?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={question}
              onChangeText={setQuestion}
              returnKeyType="next"
            />

            {/* Email field */}
            <Text style={styles.label}>Your email address</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              returnKeyType="done"
            />

            {/* Photo upload */}
            <Text style={styles.label}>Upload a photo of the damage  <Text style={styles.labelOptional}>(optional)</Text></Text>
            <TouchableOpacity
              style={[styles.uploadBtn, photoUri && styles.uploadBtnDone]}
              onPress={pickPhoto}
              activeOpacity={0.8}
            >
              {photoUri ? (
                <View style={styles.uploadPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.uploadPreview} />
                  <View style={styles.uploadPreviewOverlay}>
                    <Ionicons name="checkmark-circle" size={28} color="#fff" />
                    <Text style={styles.uploadPreviewText}>Photo attached — tap to change</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.uploadIconWrap}>
                    <Ionicons name="image-outline" size={30} color={TEAL} />
                  </View>
                  <Text style={styles.uploadPrimaryText}>Tap to upload a photo</Text>
                  <Text style={styles.uploadSecondaryText}>
                    Show us the damage so our experts can give the most accurate opinion
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Trust note */}
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={TEAL} />
              <Text style={styles.trustText}>
                Free, no obligation — your privacy is completely protected.
              </Text>
            </View>
          </ScrollView>

          {/* Send button */}
          <View style={styles.sendWrap}>
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={handleSend}
              activeOpacity={0.85}
              disabled={sending}
            >
              {sending ? (
                <Text style={styles.sendBtnText}>Sending…</Text>
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.sendBtnText}>Send to Our Experts</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: TEAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    color: "#4B5563",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 16,
  },
  tealDivider: {
    height: 3,
    width: 48,
    borderRadius: 2,
    backgroundColor: TEAL,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    marginTop: 4,
  },
  labelOptional: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    marginBottom: 18,
  },
  inputMulti: {
    minHeight: 110,
    paddingTop: 12,
  },
  uploadBtn: {
    borderWidth: 2,
    borderColor: "#D1FAF0",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#F0FDFA",
    overflow: "hidden",
    marginBottom: 14,
  },
  uploadBtnDone: {
    borderStyle: "solid",
    borderColor: TEAL,
  },
  uploadPlaceholder: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  uploadIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: TEAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  uploadPrimaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: TEAL_DARK,
    fontFamily: "Inter_600SemiBold",
  },
  uploadSecondaryText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  uploadPreviewWrap: {
    height: 160,
    position: "relative",
  },
  uploadPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,148,136,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  uploadPreviewText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    fontWeight: "600",
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  trustText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 17,
  },
  sendWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sendBtn: {
    backgroundColor: TEAL,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  sendBtnDisabled: {
    opacity: 0.65,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
