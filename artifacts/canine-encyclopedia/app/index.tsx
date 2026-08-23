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
  Modal,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { RevenueCatUI } from 'react-native-revenuecat-ui';
import Purchases from 'react-native-purchases';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

// ✨ CAROUSEL IMAGES - Using reliable placeholder URLs
const CAROUSEL_IMAGES = {
  lab: 'https://images.unsplash.com/photo-1633722715463-d30628519b67?w=500&q=80', // Yellow Lab
  doberman: 'https://images.unsplash.com/photo-1633722715463-d30628519b67?w=500&q=80', // Doberman placeholder
  chihuahua: 'https://images.unsplash.com/photo-1633722715463-d30628519b67?w=500&q=80', // Small dog
};

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
  footerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 255, 0.2)',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7c3aff',
  },
  footerButton: {
    backgroundColor: 'rgba(124, 58, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 255, 0.3)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a78bfa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#0a0e27',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 255, 0.3)',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalFeature: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  modalFeatureBold: {
    fontWeight: '700',
    color: '#fff',
  },
  modalFeatures: {
    backgroundColor: 'rgba(124, 58, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aff',
  },
  modalButtons: {
    gap: 12,
  },
  modalPrimaryButton: {
    backgroundColor: '#7c3aff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalSecondaryButton: {
    backgroundColor: 'rgba(124, 58, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 255, 0.3)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
});

export default function HomeScreen() {
  const [cartoonResult, setCartoonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [userEntitlements, setUserEntitlements] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const soundRef = useRef(null);

  const dogSounds = [
    { url: 'https://assets.mixkit.co/active_storage/sfx/2054/2054-preview.mp3', name: 'Dog barking twice' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2056/2056-preview.mp3', name: 'Medium angry bark' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2058/2058-preview.mp3', name: 'Giant aggressive growl' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2061/2061-preview.mp3', name: 'Happy puppy yips' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2059/2059-preview.mp3', name: 'Annoyed big dog' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2052/2052-preview.mp3', name: 'Dog whimper sad' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2063/2063-preview.mp3', name: 'Angry growling' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2067/2067-preview.mp3', name: 'Dog sniffing' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2064/2064-preview.mp3', name: 'Big dog panting' },
    { url: 'https://assets.mixkit.co/active_storage/sfx/2068/2068-preview.mp3', name: 'Labrador playing' },
  ];

  const sampleCartoons = [
    {
      id: 1,
      breed: 'Yellow Labrador',
      image: CAROUSEL_IMAGES.lab,
      story: 'loyal, happy, loves everyone',
    },
    {
      id: 2,
      breed: 'Doberman Pinscher',
      image: CAROUSEL_IMAGES.doberman,
      story: 'sharp, alert, protective',
    },
    {
      id: 3,
      breed: 'Chihuahua',
      image: CAROUSEL_IMAGES.chihuahua,
      story: 'tiny but fearless',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % sampleCartoons.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const playRandomDogSound = async () => {
      try {
        const randomIndex = Math.floor(Math.random() * dogSounds.length);
        const soundData = dogSounds[randomIndex];

        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync({ uri: soundData.url });
        soundRef.current = sound;
        await sound.setVolumeAsync(0.6);
        await sound.playAsync();
      } catch (error) {
        console.warn('Error playing dog sound:', error);
      }
    };

    const initialTimeout = setTimeout(() => {
      playRandomDogSound();
    }, 5000);

    const soundInterval = setInterval(() => {
      playRandomDogSound();
    }, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(soundInterval);
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
          setShowPurchaseModal(true);
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>people are obsessed</Text>
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "this literally made me love my dog even more. the cartoon is hanging on my wall."
            </Text>
            <Text style={styles.rating}>— maya. ⭐⭐⭐⭐⭐</Text>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Powered by <Text style={styles.footerBrand}>ONJJEM</Text> — Turn your cartoon into a physical gift.
          </Text>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => Linking.openURL('https://onjjem.com')}
          >
            <Text style={styles.footerButtonText}>Shop prints, postcards & more</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showPurchaseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Congrats!</Text>
            <Text style={styles.modalSubtitle}>Now turn it into something physical.</Text>

            <View style={styles.modalFeatures}>
              <Text style={styles.modalFeature}>
                <Text style={styles.modalFeatureBold}>Premium Printing Quality</Text> — Museum-grade materials and precision color matching for stunning results.
              </Text>
              <Text style={styles.modalFeature}>
                <Text style={styles.modalFeatureBold}>Top-Class Customer Service</Text> — We're here to help every step of the way.
              </Text>
              <Text style={styles.modalFeature}>
                <Text style={styles.modalFeatureBold}>Fast Shipping</Text> — Your cartoon arrives in days, not weeks.
              </Text>
              <Text style={styles.modalFeature}>
                <Text style={styles.modalFeatureBold}>Wide Selection</Text> — Prints, postcards, mugs, canvas, and more.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowPurchaseModal(false);
                  Linking.openURL('https://onjjem.com');
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>Shop on ONJJEM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowPurchaseModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Continue exploring</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
