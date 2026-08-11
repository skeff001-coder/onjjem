import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// BISECT STEP 3 — expo-image-picker added back
// If this crashes on opening: image picker module itself is the culprit.
// If this opens fine AND the button works: image picker is safe,
// move to step 4 (add fetch/API call).

type Phase = "idle" | "picked" | "error";

export default function CartoonScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMsg("Permission denied.");
      setPhase("error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPhotoUri(result.assets[0].uri);
    setPhase("picked");
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#C9960C" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <View style={s.hero}>
          <Ionicons name="color-wand-outline" size={48} color="#C9960C" />
          <Text style={s.title}>Cartoon-ify</Text>
          <Text style={s.subtitle}>
            Bisect step 3 — image picker added back. If you can read this
            without crashing, tap Choose Photo to test the picker too.
          </Text>
        </View>

        {phase === "idle" && (
          <TouchableOpacity onPress={pickPhoto} style={s.btn}>
            <Text style={s.btnText}>Choose Photo</Text>
          </TouchableOpacity>
        )}

        {phase === "picked" && photoUri && (
          <Text style={s.ok}>✅ Photo picked successfully — image picker is fine!</Text>
        )}

        {phase === "error" && (
          <Text style={s.err}>{errorMsg}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0D09" },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    gap: 4,
  },
  backText: { color: "#C9960C", fontSize: 16 },
  hero: { alignItems: "center", gap: 16, marginTop: 40, marginBottom: 32 },
  title: { fontSize: 32, color: "#F5EDD8", letterSpacing: 1, fontWeight: "700" },
  subtitle: {
    fontSize: 14,
    color: "rgba(245,237,216,0.65)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  btn: {
    backgroundColor: "#C9960C",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: "center",
  },
  btnText: { color: "#0F0D09", fontWeight: "700", fontSize: 15 },
  ok: { color: "#4ade80", fontSize: 15, textAlign: "center", marginTop: 20 },
  err: { color: "#e05252", fontSize: 14, textAlign: "center", marginTop: 20 },
});
