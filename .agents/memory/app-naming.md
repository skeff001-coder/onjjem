---
name: App naming & brand boundaries
description: Canonical name of the dog app, and which "thatsmydog" strings must NOT be renamed
---

# Dog app naming

The Expo dog-breed-scanner app's canonical user-facing name is **"What's Up Dog!"**
(it went through naming flux: "What's My Dog" → "That's My Dog!" → "What's Up Dog!").

**Why:** The user explicitly confirmed "What's Up Dog!" as the name everywhere
(phone name, in-app text, icon, website).

**How to apply — when renaming the brand, change display text ONLY:**
- DO change: `app.json` `name` + iOS/Android permission description strings, all
  visible UI copy, website `index.html` meta tags. (Website page content already
  says "What's Up Dog!".)
- DO NOT change (these are real owned assets / infra identifiers):
  - Contact emails `support@thatsmydog.app`, `privacy@thatsmydog.app`
  - Domain `thatsmydog.com` (shop delivery line)
  - Expo `slug`/`scheme` `canine-encyclopedia`, bundle ID
    `com.onjjem.canineencyclopedia`, package name `@workspace/thatsmydog-site`

# Separation from Byte 2 Eat

The dog app (`artifacts/canine-encyclopedia`) and the "Byte 2 Eat" ad video
(`artifacts/byte2eat-ad`) are fully separate artifacts and must stay that way.
The dog app must contain NO fridge / green-fridge / Byte 2 Eat references.
