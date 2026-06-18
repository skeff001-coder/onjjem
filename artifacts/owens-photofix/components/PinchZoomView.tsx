import React, { useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
  onPinchStart?: () => void;
}

export function PinchZoomView({
  children,
  style,
  minScale = 1,
  maxScale = 4,
  onPinchStart,
}: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // Stored as shared values so the pan/pinch worklets can read them.
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  // Pan is only enabled while scale > 1 so it never swallows touches that
  // belong to the inner BeforeAfterSlider PanResponder at 1×.
  const [panEnabled, setPanEnabled] = useState(false);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      "worklet";
      if (onPinchStart) runOnJS(onPinchStart)();
    })
    .onUpdate((e) => {
      "worklet";
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, savedScale.value * e.scale),
      );
      scale.value = newScale;
      // Re-clamp any existing translation whenever scale changes so the image
      // can never drift outside its bounds during a live pinch-out.
      const maxX = (containerWidth.value * (newScale - 1)) / 2;
      const maxY = (containerHeight.value * (newScale - 1)) / 2;
      translateX.value = Math.max(-maxX, Math.min(maxX, translateX.value));
      translateY.value = Math.max(-maxY, Math.min(maxY, translateY.value));
    })
    .onEnd(() => {
      "worklet";
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        // Pinched back to fit — animate translations to zero and disable pan
        // so the inner slider's PanResponder regains control.
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(setPanEnabled)(false);
      } else {
        // Zoomed in — persist the re-clamped position and enable panning.
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        runOnJS(setPanEnabled)(true);
      }
    });

  const pan = Gesture.Pan()
    .enabled(panEnabled)
    .onUpdate((e) => {
      "worklet";
      const maxX = (containerWidth.value * (scale.value - 1)) / 2;
      const maxY = (containerHeight.value * (scale.value - 1)) / 2;
      translateX.value = Math.max(
        -maxX,
        Math.min(maxX, savedTranslateX.value + e.translationX),
      );
      translateY.value = Math.max(
        -maxY,
        Math.min(maxY, savedTranslateY.value + e.translationY),
      );
    })
    .onEnd(() => {
      "worklet";
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      "worklet";
      scale.value = withTiming(1, { duration: 250 });
      savedScale.value = 1;
      translateX.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(0, { duration: 250 });
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      runOnJS(setPanEnabled)(false);
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      // Scale first (from element centre), then translate in viewport space.
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[style, animatedStyle]}
        onLayout={(e) => {
          containerWidth.value = e.nativeEvent.layout.width;
          containerHeight.value = e.nativeEvent.layout.height;
        }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
