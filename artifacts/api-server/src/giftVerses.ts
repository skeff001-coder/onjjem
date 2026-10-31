// ── ONJJEM's own verses, chosen by the customer for a Jemz Platinum gift card ──
// Original poems written for ONJJEM (31 Oct 2026). Keep in step with the list on
// gift-cards.html (same ids, same words).
export const GIFT_VERSES: Record<string, { title: string; lines: string[] }> = {
  mum: { title: "For Mum", lines: ["You held my hand through every year,", "through every laugh and every tear.", "So here's a moment, kept for you,", "to say the love I can't say through."] },
  dad: { title: "For Dad", lines: ["You taught me how to stand up tall,", "and caught me every time I'd fall.", "Some words are hard to say out loud,", "so let this say: you make me proud."] },
  grandparents: { title: "For Nan & Grandad", lines: ["Your stories warm the coldest night,", "your kitchen always full of light.", "We've framed a memory, made to stay,", "of all the love you give away."] },
  love: { title: "For someone I love", lines: ["Of all the roads I could have known,", "I'm glad that yours became my own.", "Here's one small moment, held in time,", "of every day you've made me shine."] },
  baby: { title: "For a new baby", lines: ["Ten tiny fingers, brand new eyes,", "a whole new world of sweet surprise.", "Before you grow, before you know,", "we'll keep this moment, soft and slow."] },
  pet: { title: "For a pet lover", lines: ["You never cared what day it was,", "you loved us simply just because.", "Four paws, one heart, forever true,", "the best of us looks just like you."] },
  memory: { title: "In loving memory", lines: ["You're in the quiet of the morning,", "the hush before the day.", "Not gone, just held a little closer,", "in every word we say."] },
  christmas: { title: "For Christmas", lines: ["The tree is lit, the fire's aglow,", "outside the window, falling snow.", "Of all the gifts beneath the tree,", "the best is you, my family."] },
  friend: { title: "For a friend", lines: ["Through silly days and serious ones,", "through rainy skies and summer suns,", "you've always been my favourite place.", "Here's to the friend behind this face."] },
  birthday: { title: "For a birthday", lines: ["Another year of being you,", "of all the wonderful things you do.", "Today the world should stop and say,", "we're glad you're here. Happy birthday."] },
};

export interface GiftNote { to?: string; from?: string; recipientEmail?: string; verse?: string; message?: string }

// Tidy what the customer typed, so it fits Stripe metadata (500 chars) and is safe to store.
export function cleanGiftNote(n: unknown): GiftNote | null {
  if (!n || typeof n !== "object") return null;
  const o = n as Record<string, unknown>;
  const t = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "");
  const email = t(o.recipientEmail, 120).toLowerCase();
  const out: GiftNote = {
    to: t(o.to, 40) || undefined,
    from: t(o.from, 40) || undefined,
    recipientEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
    verse: typeof o.verse === "string" && GIFT_VERSES[o.verse] ? o.verse : undefined,
    message: t(o.message, 200) || undefined,
  };
  return Object.values(out).some(Boolean) ? out : null;
}
