import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

const STORAGE_KEY = '@quickgamer_credits';
const REVENUECAT_IOS_KEY = 'appl_uXlJeiiSsMbfvSPyanijeXzukjl';

let purchasesConfigured = false;
function configurePurchases() {
  if (purchasesConfigured) return;
  Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
  purchasesConfigured = true;
}

// ── IAP products (6 total) ──
const GAME_PACKS = [
  { id: 'game_1', label: '1 Game', games: 1, price: '49p', priceNum: 0.49, badge: null },
  { id: 'game_3', label: '3 Games', games: 3, price: '99p', priceNum: 0.99, badge: 'Popular' },
  { id: 'game_8', label: '8 Games', games: 8, price: '£1.99', priceNum: 1.99, badge: 'Value' },
  { id: 'game_20', label: '20 Games', games: 20, price: '£3.99', priceNum: 3.99, badge: 'Best Value' },
];

const POWER_PACKS = [
  {
    id: 'power_mini',
    label: 'Mini Power Pack',
    shields: 2,
    rockets: 2,
    price: '99p',
    priceNum: 0.99,
    badge: null,
  },
  {
    id: 'power_full',
    label: 'Power Pack',
    shields: 10,
    rockets: 10,
    price: '£4.99',
    priceNum: 4.99,
    badge: 'Best Value',
  },
];


const COLORS = {
  bg: '#0F1419',
  card: '#1A1F2E',
  text: '#FFFFFF',
  dimText: '#888888',
  accent: '#00D9FF',
  orange: '#FF6B35',
  green: '#00FF88',
  gold: '#FFD700',
};

export default function StoreScreen({ navigation }) {
  const [credits, setCredits] = useState({
    gamesRemaining: 1, // first game free
    shields: 3,         // 3 free shields
    rockets: 0,
    continueTokens: 1,  // 1 free continue
  });
  const [packages, setPackages] = useState({}); // package id -> RevenueCat package
  const [buying, setBuying] = useState(null);   // product id currently purchasing

  useEffect(() => {
    loadCredits();
    loadOfferings();
  }, []);

  const loadCredits = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setCredits(JSON.parse(data));
      } else {
        // First time: save defaults
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
      }
    } catch (e) {
      console.log('Failed to load credits', e);
    }
  };

  const loadOfferings = async () => {
    try {
      configurePurchases();
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (current) {
        const map = {};
        current.availablePackages.forEach((pkg) => {
          map[pkg.identifier] = pkg;
        });
        setPackages(map);
      }
    } catch (e) {
      console.log('Failed to load offerings', e);
    }
  };

  // Real price from the App Store (falls back to the built-in label)
  const priceFor = (product) =>
    packages[product.id]?.product?.priceString || product.price;

  const handlePurchase = async (product) => {
    if (buying) return;
    let pkg = packages[product.id];
    if (!pkg) {
      // Try loading again once before giving up
      await loadOfferings();
      Alert.alert(
        'Store not ready',
        'We could not reach the App Store. Please check your internet connection and try again.'
      );
      return;
    }
    setBuying(product.id);
    try {
      await Purchases.purchasePackage(pkg);
      await grantProduct(product);
      Alert.alert('Success!', `${product.label} added!`);
    } catch (e) {
      if (!e.userCancelled) {
        console.log('Purchase failed', e);
        Alert.alert('Purchase failed', 'Your payment was not completed. You have not been charged.');
      }
    } finally {
      setBuying(null);
    }
  };

  // Add what was bought to the saved inventory
  const grantProduct = async (product) => {
    let current = credits;
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) current = JSON.parse(data);
    } catch (e) {}
    const updated = { ...current };
    if (product.games) updated.gamesRemaining = (updated.gamesRemaining || 0) + product.games;
    if (product.shields) updated.shields = (updated.shields || 0) + product.shields;
    if (product.rockets) updated.rockets = (updated.rockets || 0) + product.rockets;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCredits(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Store</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>YOUR INVENTORY</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceEmoji}>🎮</Text>
              <Text style={styles.balanceValue}>{credits.gamesRemaining}</Text>
              <Text style={styles.balanceLabel}>Games</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceEmoji}>🛡️</Text>
              <Text style={styles.balanceValue}>{credits.shields}</Text>
              <Text style={styles.balanceLabel}>Shields</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceEmoji}>🚀</Text>
              <Text style={styles.balanceValue}>{credits.rockets}</Text>
              <Text style={styles.balanceLabel}>Rockets</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceEmoji}>💫</Text>
              <Text style={styles.balanceValue}>{credits.continueTokens}</Text>
              <Text style={styles.balanceLabel}>Continues</Text>
            </View>
          </View>
        </View>

        {/* Game packs */}
        <Text style={styles.sectionTitle}>🎮 Game Packs</Text>
        <View style={styles.packGrid}>
          {GAME_PACKS.map((pack) => (
            <TouchableOpacity
              key={pack.id}
              style={styles.packCard}
              onPress={() => handlePurchase(pack)}
            >
              {pack.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pack.badge}</Text>
                </View>
              )}
              <Text style={styles.packGames}>{pack.games}</Text>
              <Text style={styles.packLabel}>
                {pack.games === 1 ? 'Game' : 'Games'}
              </Text>
              <Text style={styles.packPrice}>{buying === pack.id ? '...' : priceFor(pack)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Power packs */}
        <Text style={styles.sectionTitle}>⚡ Power Packs</Text>
        {POWER_PACKS.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            style={styles.powerCard}
            onPress={() => handlePurchase(pack)}
          >
            {pack.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pack.badge}</Text>
              </View>
            )}
            <View style={styles.powerInfo}>
              <Text style={styles.powerTitle}>{pack.label}</Text>
              <Text style={styles.powerDetail}>
                🛡️ ×{pack.shields}  🚀 ×{pack.rockets}
              </Text>
            </View>
            <Text style={styles.powerPrice}>{buying === pack.id ? '...' : priceFor(pack)}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backArrow: { fontSize: 28, color: COLORS.text },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },

  // ── Balance ──
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  balanceTitle: {
    fontSize: 12,
    color: COLORS.dimText,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
  balanceItem: { alignItems: 'center' },
  balanceEmoji: { fontSize: 24 },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.accent,
    fontFamily: 'Courier',
    marginTop: 4,
  },
  balanceLabel: { fontSize: 11, color: COLORS.dimText, marginTop: 2 },

  // ── Sections ──
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.dimText,
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 12,
  },

  // ── Game packs ──
  packGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  packCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  packGames: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.accent,
    fontFamily: 'Courier',
  },
  packLabel: { fontSize: 14, color: COLORS.dimText, marginTop: 2 },
  packPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.orange,
    marginTop: 8,
  },

  // ── Badges ──
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: COLORS.orange,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.text },

  // ── Power packs ──
  powerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  powerInfo: { flex: 1 },
  powerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  powerDetail: { fontSize: 14, color: COLORS.dimText, marginTop: 4 },
  powerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.orange,
  },

  // ── Vehicles ──
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  vehicleOwned: {
    borderColor: COLORS.green,
    opacity: 0.8,
  },
  vehicleEmoji: { fontSize: 36, marginRight: 14 },
  vehicleInfo: { flex: 1 },
  vehicleTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  vehicleDesc: { fontSize: 12, color: COLORS.dimText, marginTop: 4 },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.orange,
  },
  ownedBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.green,
  },
});
