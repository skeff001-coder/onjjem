import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

const { width } = Dimensions.get('window');
const imageSize = width - 48; // 24px padding each side

export default function CartoonifyGallery() {
  const items = [
    {
      type: 'pair',
      breed: 'Doberman',
      before: 'https://via.placeholder.com/400x400?text=Doberman+Before',
      after: 'https://via.placeholder.com/400x400?text=Doberman+Cartoon'
    },
    {
      type: 'pair',
      breed: 'Yellow Labrador',
      before: 'https://via.placeholder.com/400x400?text=Lab+Before',
      after: 'https://via.placeholder.com/400x400?text=Lab+Cartoon'
    },
    {
      type: 'sample',
      breed: 'Jack Russell',
      image: 'https://via.placeholder.com/400x400?text=Jack+Russell+Cartoon'
    },
    {
      type: 'sample',
      breed: 'Shih Tzu',
      image: 'https://via.placeholder.com/400x400?text=Shih+Tzu+Cartoon'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAfter, setShowAfter] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [loading, setLoading] = useState(false);

  const currentItem = items[currentIndex];
  const isPair = currentItem.type === 'pair';

  // Auto-cycle through images
  useEffect(() => {
    if (!autoPlay) return;
    
    const timer = setTimeout(() => {
      if (isPair && !showAfter) {
        setShowAfter(true);
      } else {
        setShowAfter(false);
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    }, 3500);
    
    return () => clearTimeout(timer);
  }, [currentIndex, showAfter, autoPlay, isPair]);

  const getImageSource = () => {
    if (isPair) {
      return showAfter ? currentItem.after : currentItem.before;
    }
    return currentItem.image;
  };

  const getLabel = () => {
    if (isPair) {
      return showAfter ? '✨ Cartoon' : 'Original';
    }
    return '✨ Sample';
  };

  const handleNext = () => {
    setShowAfter(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setAutoPlay(false);
  };

  const handlePrev = () => {
    setShowAfter(false);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setAutoPlay(false);
  };

  const handleToggle = () => {
    setShowAfter(!showAfter);
    setAutoPlay(false);
  };

  const handleDotPress = (idx: number) => {
    setCurrentIndex(idx);
    setShowAfter(false);
    setAutoPlay(false);
  };

  return (
    <View style={{ backgroundColor: '#fff9f0', borderRadius: 12, padding: 24, marginVertical: 16 }}>
      {/* Title */}
      <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', color: '#111', marginBottom: 8 }}>
        See Cartoonify in Action
      </Text>
      <Text style={{ fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 16 }}>
        Real transformations & cartoon samples
      </Text>

      {/* Main Image Container */}
      <View
        style={{
          width: imageSize,
          height: imageSize,
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
          alignSelf: 'center',
        }}
      >
        <Image
          source={{ uri: getImageSource() }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
        {loading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        {/* Label Badge */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
            {getLabel()}
          </Text>
        </View>
      </View>

      {/* Breed Name */}
      <Text style={{ fontSize: 14, fontWeight: '500', textAlign: 'center', color: '#374151', marginBottom: 16 }}>
        {currentItem.breed}
      </Text>

      {/* Toggle Button (only for before/after pairs) */}
      {isPair && (
        <TouchableOpacity
          onPress={handleToggle}
          style={{
            backgroundColor: '#3b82f6',
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center' }}>
            {showAfter ? 'See Original' : 'See Cartoon'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Navigation Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={handlePrev}
          style={{
            flex: 1,
            backgroundColor: '#e5e7eb',
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={{
            flex: 1,
            backgroundColor: '#e5e7eb',
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>Next</Text>
          <Text style={{ fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Dot Indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        {items.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleDotPress(idx)}
            style={{
              width: idx === currentIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: idx === currentIndex ? '#b45309' : '#d1d5db',
            }}
          />
        ))}
      </View>

      {/* Info Text */}
      <Text style={{ fontSize: 12, textAlign: 'center', color: '#666', lineHeight: 18 }}>
        Transform your dog's photos into charming cartoon artwork.{'\n'}
        {isPair && <Text style={{ fontWeight: '600' }}>Tap "See Cartoon" to see the transformation.</Text>}
      </Text>
    </View>
  );
}
