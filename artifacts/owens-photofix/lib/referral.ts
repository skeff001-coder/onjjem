import AsyncStorage from "@react-native-async-storage/async-storage";

const REFERRAL_KEY = "@onjjem_referral_code";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getReferralCode(): Promise<string> {
  const stored = await AsyncStorage.getItem(REFERRAL_KEY);
  if (stored) return stored;
  const fresh = generateCode();
  await AsyncStorage.setItem(REFERRAL_KEY, fresh);
  return fresh;
}

export function buildReferralLink(code: string): string {
  return `https://onjjem.com/restore?ref=${code}`;
}

export function buildWhatsAppMessage(link: string): string {
  return (
    `✨ *ONJJEM Photo Restoration* ✨\n\n` +
    `I've been using this amazing app to restore old and damaged photos — the results are incredible!\n\n` +
    `Use my link to get *£10 off* your first order:\n${link}\n\n` +
    `_Restore your memories today_ 📸`
  );
}

export function buildEmailBody(link: string): string {
  return (
    `Hi,\n\n` +
    `I wanted to share something special with you — ONJJEM Photo Restoration.\n\n` +
    `They use AI to bring old, damaged, blurry and black-and-white photos back to life. ` +
    `The results are genuinely stunning.\n\n` +
    `Use my personal link to get £10 off your first order:\n${link}\n\n` +
    `You'll love it!\n\n` +
    `Best wishes`
  );
}
