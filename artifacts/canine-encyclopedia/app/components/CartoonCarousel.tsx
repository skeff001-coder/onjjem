import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Animated } from 'react-native';

interface BeforeAfterPair {
  before: string;
  after: string;
  breed?: string;
}

interface CartoonCarouselProps {
  pairs: BeforeAfterPair[];
  autoPlayInterval?: number;
  onPairChange?: (index: number) => void;
}

export const CartoonCarousel: React.FC<CartoonCarouselProps> = ({
  pairs,
  autoPlayInterval = 5000,
  onPairChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAfter, setShowAfter] = useState(true);
  const fadeAnim = new Animated.Value(1);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % pairs.length);
      setShowAfter(true);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [pairs.length, autoPlayInterval]);

  useEffect(() => {
    onPairChange?.(currentIndex);
  }, [currentIndex, onPairChange]);

  const toggleBeforeAfter = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setShowAfter(!showAfter);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setShowAfter(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length);
    setShowAfter(true);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pairs.length);
    setShowAfter(true);
  };

  const currentPair = pairs[currentIndex];
  const displayImage = showAfter ? currentPair.after : currentPair.before;

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      {/* Main Image Container */}
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
          position: 'relative',
        }}
      >
        <Animated.Image
          source={{ uri: displayImage }}
          style={{
            width: '100%',
            height: '100%',
            opacity: fadeAnim,
          }}
          resizeMode="cover"
        />

        {/* Before/After Toggle Label */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
            {showAfter ? 'After' : 'Before'}
          </Text>
        </View>

        {/* Tap to Toggle Overlay */}
        <TouchableOpacity
          onPress={toggleBeforeAfter}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
          activeOpacity={0.7}
        />
      </View>

      {/* Tap Hint */}
      <Text
        style={{
          fontSize: 13,
          color: '#666',
          fontStyle: 'italic',
          marginBottom: 8,
        }}
      >
        Tap image to toggle before/after
      </Text>

      {/* Navigation Arrows */}
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={goToPrevious}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: '#333' }}>‹</Text>
        </TouchableOpacity>

        {/* Breed Label (optional) */}
        {currentPair.breed && (
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>
            {currentPair.breed}
          </Text>
        )}

        <TouchableOpacity
          onPress={goToNext}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: '#333' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Dot Indicators */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          marginTop: 4,
        }}
      >
        {pairs.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToSlide(index)}
            style={{
              width: index === currentIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentIndex ? '#FF6B6B' : '#e0e0e0',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </View>
    </View>
  );
};

export const EXAMPLE_PAIRS: BeforeAfterPair[] = [
  {
    before: 'https://via.placeholder.com/400?text=Original+Dog',
    after: 'https://via.placeholder.com/400?text=Cartoon+Dog',
    breed: 'Jack Russell',
  },
  {
    before: 'https://via.placeholder.com/400?text=Original+Lab',
    after: 'https://via.placeholder.com/400?text=Cartoon+Lab',
    breed: 'Labrador',
  },
  {
    before: 'https://via.placeholder.com/400?text=Original+Doberman',
    after: 'https://via.placeholder.com/400?text=Cartoon+Doberman',
    breed: 'Doberman',
  },
];
