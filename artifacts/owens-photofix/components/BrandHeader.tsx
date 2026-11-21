// The ONJJEM header, styled to match onjjem.com: Jemzi the hedgehog,
// a shining gold "ONJJEM" in Playfair Display, and the same italic tagline.
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

const GOLD_STOPS = ["#8a6a1f", "#d4af37", "#fff4c4", "#e8c75a", "#a67c1e", "#f6e08f", "#b8902a"] as const;
const WORD_W = 300;

export function BrandHeader() {
  const shine = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shine, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [shine, bob]);

  const translateX = shine.interpolate({ inputRange: [0, 1], outputRange: [-WORD_W, 0] });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  return (
    <View style={st.wrap}>
      <Animated.View style={[st.jemziGlow, { transform: [{ translateY }] }]}>
        <Image source={require("@/assets/images/jemzi-badge.png")} style={st.jemzi} />
      </Animated.View>

      <MaskedView
        style={st.mask}
        maskElement={
          <View style={st.maskInner}>
            <Text style={st.word} numberOfLines={1} adjustsFontSizeToFit>ONJJEM</Text>
          </View>
        }
      >
        <Animated.View style={{ width: WORD_W * 2, height: "100%", transform: [{ translateX }] }}>
          <LinearGradient
            colors={[...GOLD_STOPS, ...GOLD_STOPS]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </MaskedView>

      <View style={st.rule}>
        <View style={st.ruleLine} />
        <Text style={st.ruleGem}>✦</Text>
        <View style={st.ruleLine} />
      </View>

      <Text style={st.tagline}>Personalised luxury for the moments that matter</Text>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 6, paddingBottom: 4 },
  jemziGlow: {
    width: 96, height: 96, borderRadius: 48, marginBottom: 6,
    shadowColor: "#d4af37", shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
  },
  jemzi: { width: 96, height: 96, borderRadius: 48 },
  mask: { width: WORD_W, height: 74 },
  maskInner: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  word: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 58,
    letterSpacing: 7,
    color: "#000",
    textAlign: "center",
    width: WORD_W,
  },
  rule: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2, marginBottom: 6 },
  ruleLine: { width: 56, height: 1, backgroundColor: "rgba(212,175,55,0.55)" },
  ruleGem: { color: "#d4af37", fontSize: 12 },
  tagline: {
    fontFamily: "PlayfairDisplay_400Regular_Italic",
    fontSize: 15,
    color: "#e8dcc0",
    letterSpacing: 0.5,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
