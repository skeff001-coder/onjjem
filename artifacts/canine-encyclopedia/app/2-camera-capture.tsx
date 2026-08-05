import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { resolveCapture } from "@/lib/captureBridge";

const COUNTDOWN_SECONDS = 3;

export default function CameraCaptureScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Ask for camera permission as soon as this screen opens, if we don't
  // already have it.
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Once the camera is actually ready to shoot, start the countdown
  // automatically — no button tap needed, matching a passport-photo /
  // Face ID style "hold still" flow.
  useEffect(() => {
    if (!cameraReady) return;
    setCount(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cameraReady]);

  // Fire the actual capture the moment the countdown hits zero.
  useEffect(() => {
    if (count === 0 && !capturing) {
      void takePhoto();
    }
  }, [count]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.85,
      });
      if (!photo?.uri) {
        throw new Error("No photo returned");
      }
      resolveCapture({ uri: photo.uri, base64: photo.base64 ?? "" });
      router.back();
    } catch (err) {
      Alert.alert("Capture failed", "Could not take the photo. Please try again.");
      setCapturing(false);
      setCount(COUNTDOWN_SECONDS);
    }
  };

  const handleCancel = () => {
    resolveCapture(null);
    router.back();
  };

  if (!permission) {
    // Still loading the permission state.
    return <View style={[styles.container, { backgroundColor: "#000" }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: "#000" }]}>
        <Ionicons name="camera-outline" size={48} color="#fff" />
        <Text style={styles.permissionText}>Camera access is needed to scan your dog.</Text>
        <TouchableOpacity
          onPress={handleCancel}
          style={[styles.cancelBtn, { borderColor: colors.gold }]}
        >
          <Text style={[styles.cancelBtnText, { color: colors.gold }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Dimmed overlay with a cut-out guide frame */}
      <View style={styles.overlay} pointerEvents="none">
        <View
          style={[
            styles.guideFrame,
            { borderColor: count === 0 ? colors.gold : "rgba(255,255,255,0.85)" },
          ]}
        />
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.instructionText}>
          {capturing
            ? "Capturing..."
            : "Centre your dog in the frame and hold steady"}
        </Text>
        {count !== null && count > 0 && !capturing && (
          <View style={[styles.countdownCircle, { borderColor: colors.gold }]}>
            <Text style={[styles.countdownText, { color: colors.gold }]}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  guideFrame: {
    width: "78%",
    aspectRatio: 4 / 3,
    borderWidth: 3,
    borderRadius: 24,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  instructionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  countdownCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: { fontSize: 24, fontWeight: "800" },
  permissionText: { color: "#fff", fontSize: 15, textAlign: "center" },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700" },
});
