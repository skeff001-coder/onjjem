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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { RevenueCatUI } from 'react-native-revenuecat-ui';
import Purchases from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [cartoonResult, setCartoonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [userEntitlements, setUserEntitlements] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sample cartoon dog results (replace with real URLs from Supabase)
  const sampleCartoons = [
    {
      id: 1,
      breed: 'Golden Retriever',
      image: 'https://xnaggiadvfhrirkdkzwa.supabase.co/storage/v1/object/public/carousel/sample-golden.png',
      story: 'Loyal, energetic, loves everyone',
    },
    {
      id: 2,
      breed: 'Siberian Husky',
      image: 'https://xnaggiadvfhrirkdkzwa.supabase.co/storage/v1/object/public/carousel/sample-husky.png',
      story: 'Independent, playful, escape artist',
    },
    {
      id: 3,
      breed: 'Dachshund',
      image: 'https://xnaggiadvfhrirkdkzwa.supabase.co/storage/v1/object/public/carousel/sample-dachshund.png',
      story: 'Small but fearless, loves digging',
    },
  ];

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % sampleCartoons.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check entitlements
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
        
        // Trigger fade animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <ScrollView
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E8E', '#0F0F0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 60 }}
        >
          <Text style={{ fontSize: 48, fontWeight: '800', color: '#FFF', marginBottom: 12 }}>
            What's Up Dog?
          </Text>
          <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 26 }}>
            Snap your pup, instantly cartoonify them, and discover their hidden personality.
          </Text>
        </LinearGradient>

        {/* Main CTA Button */}
        <View style={{ paddingHorizontal: 20, marginTop: -30, marginBottom: 40 }}>
          <LinearGradient
            colors={['#FFD93D', '#FFC700']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
          >
            <TouchableOpacity
              onPress={pickImage}
              disabled={loading}
              style={{
                paddingVertical: 18,
                paddingHorizontal: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="large" />
              ) : (
                <>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 4 }}>
                    📸 Scan Your Dog
                  </Text>
                  <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                    It's free and takes 2 seconds
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Cartoon Result (if exists) */}
        {cartoonResult && (
          <Animated.View
            style={{
              marginHorizontal: 20,
              marginBottom: 40,
              opacity: fadeAnim,
            }}
          >
            <View
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                borderWidth: 2,
                borderColor: '#FF6B6B',
              }}
            >
              <Image
                source={{ uri: cartoonResult.cartoon_image_url }}
                style={{ width: '100%', height: 400, backgroundColor: '#1a1a1a' }}
              />
            </View>

            {/* Hook: "This dog's story" moment */}
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 8 }}>
                ✨ This dog's story is wild
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22 }}>
                {cartoonResult.breed_prediction || 'A beautiful pup'}
                {' '}with a unique personality waiting to be discovered.
              </Text>
            </View>

            {/* Hook buttons: Smooth, not pushy */}
            <View style={{ marginTop: 20, gap: 12 }}>
              {/* Primary: Story Bundle */}
              <TouchableOpacity
                onPress={handleBuyStory}
                style={{
                  backgroundColor: '#FF6B6B',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 }}>
                  🎬 Unlock Full Story
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  DNA + Age + Personality — £2.99
                </Text>
              </TouchableOpacity>

              {/* Secondary: Elite Cartoonify */}
              <TouchableOpacity
                onPress={handleCartoonify}
                style={{
                  backgroundColor: 'rgba(255, 107, 107, 0.15)',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#FF6B6B',
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFD93D', marginBottom: 4 }}>
                  🎨 Cartoonify Elite
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  Premium illustration style — £4.99
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Carousel: Sample cartoon results */}
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#FFF',
              marginLeft: 20,
              marginBottom: 16,
            }}
          >
            ✨ See the magic
          </Text>

          <View style={{ height: 320, marginHorizontal: 20 }}>
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                borderWidth: 2,
                borderColor: 'rgba(255, 107, 107, 0.3)',
                height: '100%',
              }}
            >
              <Image
                source={{ uri: sampleCartoons[carouselIndex].image }}
                style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 120,
                  justifyContent: 'flex-end',
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 }}>
                  {sampleCartoons[carouselIndex].breed}
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {sampleCartoons[carouselIndex].story}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Carousel dots */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16,
            }}
          >
            {sampleCartoons.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: idx === carouselIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: idx === carouselIndex ? '#FF6B6B' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </View>
        </View>

        {/* Trust section: Daily engagement hook */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 16 }}>
            📚 Daily Dog Facts
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderLeftWidth: 4,
              borderLeftColor: '#FF6B6B',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 22 }}>
              Did you know? Dogs have over 250 million scent receptors. Use What's Up Dog to discover your pup's unique breed traits.
            </Text>
          </View>
        </View>

        {/* Social proof section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 16 }}>
            ❤️ Loved by dog parents
          </Text>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 107, 0.2)',
            }}
          >
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
              "Turned my mutt into an adorable cartoon. The personality insights were spot on!" — Sarah
            </Text>
            <Text style={{ fontSize: 12, color: '#FFD93D' }}>⭐⭐⭐⭐⭐</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
