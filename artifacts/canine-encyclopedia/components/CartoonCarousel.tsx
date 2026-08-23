import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';

interface CartoonSample {
  uri: string;
  label?: string;
}

interface CartoonCarouselProps {
  samples: CartoonSample[];
  autoPlayInterval?: number;
}

export const CartoonCarousel: React.FC<CartoonCarouselProps> = ({
  samples,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % samples.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [samples.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + samples.length) % samples.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % samples.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentSample = samples[currentIndex];

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
        }}
      >
        <Image
          source={{ uri: currentSample.uri }}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      </View>

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

        <Text style={{ fontSize: 13, color: '#666' }}>
          {currentIndex + 1} / {samples.length}
        </Text>

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
        }}
      >
        {samples.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToSlide(index)}
            style={{
              width: index === currentIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentIndex ? '#E6C673' : '#e0e0e0',
            }}
          />
        ))}
      </View>
    </View>
  );
};

export const CARTOON_SAMPLES: CartoonSample[] = [
  { uri: 'https://placeholder.com/400?text=Cartoon+1', label: 'Sample 1' },
  { uri: 'https://placeholder.com/400?text=Cartoon+2', label: 'Sample 2' },
  { uri: 'https://placeholder.com/400?text=Cartoon+3', label: 'Sample 3' },
];
