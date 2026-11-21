import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Clipboard,
} from 'react-native';

const FRIEND_BEST = 456;
const FRIEND_NAME = 'Alex';

export default function ShareScreen({ route }) {
  const { score, gameName } = route.params;
  const [copied, setCopied] = useState(false);

  const shareLink = `https://quickgames.app/share/${Math.random().toString(36).substring(7)}`;

  const handleCopyLink = () => {
    Clipboard.setString(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `I scored ${score} in ${gameName}! Can you beat it? ${shareLink}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const isAhead = score > FRIEND_BEST;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>You scored</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.gameNameText}>in {gameName}</Text>
        </View>

        <View style={styles.friendCompare}>
          <Text style={styles.friendText}>
            {FRIEND_NAME}'s best: {FRIEND_BEST}
          </Text>
          {isAhead ? (
            <Text style={styles.aheadText}>★ You're ahead!</Text>
          ) : (
            <Text style={styles.behindText}>
              Get {FRIEND_BEST - score} more to beat them
            </Text>
          )}
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>Scan to Play</Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>QR CODE</Text>
          </View>
          <Text style={styles.qrHint}>Friends scan code to play</Text>
        </View>

        <View style={styles.linkSection}>
          <Text style={styles.linkText} numberOfLines={1}>
            {shareLink}
          </Text>
          <TouchableOpacity onPress={handleCopyLink}>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shareButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={handleNativeShare}>
            <Text style={styles.shareButtonText}>Share via Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rankSection}>
          <View style={styles.rankRow}>
            <Text style={styles.rankLabel}>Global Rank</Text>
            <Text style={styles.rankValue}>#47</Text>
          </View>
          <Text style={styles.rankHint}>
            You're in the top 1% of players this week
          </Text>
        </View>
      </ScrollView>

      {copied && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ Link copied!</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  scoreHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#888888',
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00D9FF',
    fontFamily: 'Courier',
    marginVertical: 8,
  },
  gameNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  friendCompare: {
    marginHorizontal: 20,
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  friendText: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Courier',
  },
  aheadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 4,
  },
  behindText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 4,
  },
  qrSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  qrHint: {
    fontSize: 12,
    color: '#888888',
    marginTop: 12,
  },
  linkSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    backgroundColor: '#1A1F2E',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Courier',
    flex: 1,
  },
  copyIcon: {
    fontSize: 16,
    marginLeft: 12,
  },
  shareButtons: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  shareButton: {
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rankSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    padding: 16,
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  rankValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D9FF',
    fontFamily: 'Courier',
  },
  rankHint: {
    fontSize: 11,
    color: '#888888',
    marginTop: 8,
  },
  toast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
