import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BARK_BIG = require("@/assets/sounds/bark_big.mp3");
const BARK_SMALL = require("@/assets/sounds/bark_small.mp3");
const BARK_PLAYFUL = require("@/assets/sounds/bark_playful.mp3");

const STORAGE_KEY = "ambient_barks_enabled";

export default function AmbientBarks() {
  const insets = useSafeAreaInsets();

  const big = useAudioPlayer(BARK_BIG);
  const small = useAudioPlayer(BARK_SMALL);
  const playful = useAudioPlayer(BARK_PLAYFUL);

  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);
  const hydratedRef = useRef(false);
  const lastIndex = useRef(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Respect the device silent switch — no surprise barks when the phone is muted.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
  }, []);

  // Restore the user's saved preference before any barking can start.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "false") {
          setEnabled(false);
          enabledRef.current = false;
        }
      })
      .catch(() => {})
      .finally(() => {
        hydratedRef.current = true;
        if (enabledRef.current && !timeoutRef.current) scheduleNext();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playRandomBark = useCallback(() => {
    if (!enabledRef.current) return;
    const players = [big, small, playful];
    let idx = Math.floor(Math.random() * players.length);
    if (idx === lastIndex.current) idx = (idx + 1) % players.length;
    lastIndex.current = idx;
    const p = players[idx];
    try {
      p.seekTo(0);
      p.play();
    } catch {
      // ignore playback hiccups
    }
  }, [big, small, playful]);

  const scheduleNext = useCallback(() => {
    const delay = 3000 + Math.random() * 1000; // one bark every 3–4 seconds
    timeoutRef.current = setTimeout(() => {
      if (!enabledRef.current) return;
      playRandomBark();
      scheduleNext();
    }, delay);
  }, [playRandomBark]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Silence any bark already mid-play when leaving the screen.
    for (const p of [big, small, playful]) {
      try {
        p.pause();
      } catch {
        // ignore
      }
    }
  }, [big, small, playful]);

  // Only bark while the home screen is focused (and after the saved preference loads).
  useFocusEffect(
    useCallback(() => {
      if (enabledRef.current && hydratedRef.current) scheduleNext();
      return stop;
    }, [scheduleNext, stop]),
  );

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    enabledRef.current = next;
    AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
    if (next) {
      playRandomBark();
      if (!timeoutRef.current) scheduleNext();
    } else {
      stop();
    }
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={12}
      style={[styles.button, { top: insets.top + 8 }]}
      accessibilityLabel={enabled ? "Mute dog barks" : "Unmute dog barks"}
      accessibilityRole="button"
    >
      <Ionicons
        name={enabled ? "volume-high" : "volume-mute"}
        size={20}
        color="#c9a84c"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 14,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,14,26,0.7)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
  },
});
