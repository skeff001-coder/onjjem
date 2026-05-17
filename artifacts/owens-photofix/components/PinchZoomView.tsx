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
}

export function PinchZoomView({
  children,
  style,
  minScale = 1,
  maxScale = 4,
}: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // Container dimensions stored as shared values so the pan clamp worklet
  // can read them without crossing the JS/UI thread boundary.
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  // Pan is only enabled after a successful pinch-in (scale > 1).
  // Keeping it disabled at 1× prevents the RNGH Pan gesture from swallowing
  // touches that belong to the inner BeforeAfterSlider PanResponder.
  const [panEnabled, setPanEnabled] = useState(false);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      scale.value = Math.max(
        minScale,
        Math.min(maxScale, savedScale.value * e.scale),
      );
    })
    .onEnd(() => {
      "worklet";
      savedScale.value = scale.value;
      runOnJS(setPanEnabled)(scale.value > 1);
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
      // Scale first (from the element centre), then translate in viewport space.
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
