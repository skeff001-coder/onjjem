import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { RevenueCatUI } from 'react-native-revenuecat-ui';
import Purchases from 'react-native-purchases';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  heroGradient: {
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 24,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -1.2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    fontWeight: '500',
  },
  ctaButton: {
    marginHorizontal: 24,
    marginTop: -40,
    marginBottom: 50,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(124, 58, 255, 0.4)',
  },
  ctaGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  ctaSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  resultContainer: {
    marginHorizontal: 24,
    marginBottom: 50,
  },
  resultImage: {
    width: '100%',
    height: 420,
    borderRadius: 24,
    backgroundColor: '#1a1f3a',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 255, 0.3)',
  },
  storyMoment: {
    marginBottom: 20,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  storyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonRow: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  primaryButtonSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  carouselSection: {
    marginBottom: 50,
    paddingHorizontal: 24,
  },
  carouselTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 18,
    letterSpacing: -0.5,
  },
  carouselContainer: {
    height: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1f3a',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 255, 0.2)',
    marginBottom: 20,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1f3a',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  carouselBreed: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  carouselStory: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  infoCard: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderLeftWidth: 4,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    fontWeight: '500',
  },
  testimonialCard: {
    backgroundColor: 'rgba(124, 58, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 255, 0.2)',
  },
  testimonialText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '500',
  },
  rating: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '600',
  },
});

export default function HomeScreen() {
  const [cartoonResult, setCartoonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [userEntitlements, setUserEntitlements] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const soundRef = useRef(null);

  // Dog bark sounds (Mixkit free royalty-free)
  const barkSounds = [
    'https://assets.mixkit.co/active_storage/sfx/2054/2054-preview.mp3', // Dog barking twice
    'https://assets.mixkit.co/active_storage/sfx/2056/2056-preview.mp3', // Medium size angry dog bark
    'https://assets.mixkit.co/active_storage/sfx/2058/2058-preview.mp3', // Giant dog aggressive growl
    'https://assets.mixkit.co/active_storage/sfx/2061/2061-preview.mp3', // Happy puppy barks
    'https://assets.mixkit.co/active_storage/sfx/2059/2059-preview.mp3', // Annoyed big dog barking
  ];

  const sampleCartoons = [
    {
      id: 1,
      breed: 'Golden Retriever',
      image: 'https://xnaggiadvfhrirkdkzwa.supabase.co/storage/v1/object/public/carousel/sample-golden.png',
      story: 'your golden\'s got that loyal energy',
    },
    {
      id: 2,
      breed: 'Siberian Husky',
      image: 'https://xnaggiadvfhrirkdkzwa.supabase.co/storage/v1/object/public/carousel/sample-husky.png',
      story: 'pure chaos wrapped in fluff',
    },
    {
      id: 3,
      breed: 'Dachshund',
      image: 'https://xnaggiadvfhrirkdkzwa.supabase.co/storage/v1/object/public/carousel/sample-dachshund.png',
      story: 'small pup, huge personality',
    },
  ];

  // Carousel auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % sampleCartoons.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Random dog bark every 10 seconds
  useEffect(() => {
    const playRandomBark = async () => {
      try {
        // Pick random bark
        const randomIndex = Math.floor(Math.random() * barkSounds.length);
        const soundUrl = barkSounds[randomIndex];

        // Stop previous sound if playing
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        // Load and play new sound
        const { sound } = await Audio.Sound.createAsync({ uri: soundUrl });
        soundRef.current = sound;
        await sound.playAsync();
      } catch (error) {
        console.warn('Error playing bark sound:', error);
      }
    };

    const barkInterval = setInterval(() => {
      playRandomBark();
    }, 10000); // 10 seconds

    return () => {
      clearInterval(barkInterval);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkEntitlements();
    }, [])
  );

  const checkEntitlements = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const activeEntitlements = Object.keys(customerInfo.entitlements.active || {});
      setUserEntitlements(activeEntitlements);
    } catch (error) {
      console.error('Error checking entitlements:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'dog.jpg',
        });

        const response = await fetch('https://onjjem-api-server-production.up.railway.app/canine', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setCartoonResult(data);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBuyStory = () => {
    setShowPaywall(true);
  };

  const handleCartoonify = () => {
    setShowPaywall(true);
  };

  if (showPaywall) {
    return (
      <RevenueCatUI.Paywall
        options={{
          displayCloseButton: true,
          condensedMode: false,
        }}
        onDismiss={() => setShowPaywall(false)}
        onPurchaseCompleted={async () => {
          await checkEntitlements();
          setShowPaywall(false);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero */}
        <LinearGradient
          colors={['#7c3aff', '#0a0e27']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heroTitle}>What's Up Dog?</Text>
          <Text style={styles.heroSubtitle}>
            snap your pup, watch them come to life as a cartoon, and discover what they're really made of.
          </Text>
        </LinearGradient>

        {/* Main CTA */}
        <View style={styles.ctaButton}>
          <LinearGradient
            colors={['#7c3aff', '#5a1fc8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <TouchableOpacity
              onPress={pickImage}
              disabled={loading}
              style={{ width: '100%', alignItems: 'center' }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.ctaText}>📸 scan your dog now</Text>
                  <Text style={styles.ctaSubtext}>no sign-up, no waiting. it just works.</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Result */}
        {cartoonResult && (
          <Animated.View
            style={{
              marginHorizontal: 24,
              marginBottom: 50,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Image
              source={{ uri: cartoonResult.cartoon_image_url }}
              style={styles.resultImage}
            />

            <View style={styles.storyMoment}>
              <Text style={styles.storyTitle}>oh snap 🤯</Text>
              <Text style={styles.storyText}>
                we just turned your pup into something special. but that's just the beginning — tap below to unlock the full story.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <LinearGradient
                colors={['#7c3aff', '#5a1fc8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryButton, { borderColor: 'rgba(124, 58, 255, 0.5)' }]}
              >
                <TouchableOpacity onPress={handleBuyStory} style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={[styles.primaryButtonText, { color: '#fff' }]}>unlock full story</Text>
                  <Text style={[styles.primaryButtonSub, { color: 'rgba(255,255,255,0.8)' }]}>
                    dna, age, personality — £2.99
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              <TouchableOpacity
                onPress={handleCartoonify}
                style={[
                  styles.primaryButton,
                  { borderColor: 'rgba(124, 58, 255, 0.4)', backgroundColor: 'rgba(124, 58, 255, 0.1)' },
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: '#a78bfa' }]}>cartoonify elite</Text>
                <Text style={[styles.primaryButtonSub, { color: 'rgba(167, 139, 250, 0.8)' }]}>
                  premium illustration — £4.99
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Carousel */}
        <View style={styles.carouselSection}>
          <Text style={styles.carouselTitle}>see it in action</Text>

          <View style={styles.carouselContainer}>
            <Image
              source={{ uri: sampleCartoons[carouselIndex].image }}
              style={styles.carouselImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(10, 14, 39, 0.95)']}
              style={styles.carouselOverlay}
            >
              <Text style={styles.carouselBreed}>{sampleCartoons[carouselIndex].breed}</Text>
              <Text style={styles.carouselStory}>{sampleCartoons[carouselIndex].story}</Text>
            </LinearGradient>
          </View>

          <View style={styles.dotsContainer}>
            {sampleCartoons.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCarouselIndex(idx)}
                style={[
                  styles.dot,
                  {
                    width: idx === carouselIndex ? 28 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: idx === carouselIndex ? '#7c3aff' : 'rgba(124, 58, 255, 0.3)',
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Daily Fact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>did you know?</Text>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: 'rgba(167, 139, 250, 0.08)',
                borderLeftColor: '#a78bfa',
              },
            ]}
          >
            <Text style={styles.infoText}>
              dogs see the world in shades of blue and yellow. but cartoonified? they're in full technicolor 🌈
            </Text>
          </View>
        </View>

        {/* Social Proof */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>people are obsessed</Text>
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "this literally made me love my dog even more. the cartoon is hanging on my wall."
            </Text>
            <Text style={styles.rating}>— maya. ⭐⭐⭐⭐⭐</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
