# Jemzi Doodles

Jemzi Doodles is a mobile app that brings children's drawings to life as dancing cartoon characters using AI. 

## How it works

1. The child snaps a photo of their crayon drawing in the app
2. The app sends the drawing to our AI backend, which generates an animated version
3. The cartoon character dances and waves on the child's screen
4. They can share the video clip or order it printed on a mug or cushion 

## Tech Stack

- **Expo SDK 54** / React Native 0.81.5 / React 19.1 
- **TypeScript**
- Expo dev client on iOS for easy testing

## Key Dependencies  

- **expo-image-picker**: Lets the user snap a photo or pick one from their camera roll
- **react-native-purchases**: Integrates with RevenueCat for in-app purchases and entitlements
- **expo-av**: Plays the returned MP4 animation in a video component
- expo-dev-client / release channel: Simplifies testing real IAP on-device

## Backend

The backend is an Express API server deployed on Railway, using:

- **Postgres** database via Drizzle ORM
  - Stores each uploaded drawing in the `prodigi_photos` table
- **Replicate** for AI inference
  - Each drawing is sent to the Stable Diffusion Animation v2 model 
  - This outputs an MP4 of the character coming to life
- **Persistent storage** via the Railway volume
  - Tracks each device's free animation credits in a JSON file

### API Endpoints

- `POST /api/doodles/animate`
  - Expects a base64 encoded drawing image, MIME type, and deviceId
  - Checks the device's remaining free credits (5 free animations per install)
  - Saves the original drawing to the DB for later access
  - Starts a Replicate prediction job with the drawing
  - Returns a drawingId and jobId

- `GET /api/doodles/job/:id` 
  - Fetches the status of a Replicate job by its ID
  - Returns `status: "succeeded"` and the MP4 URL when complete

- `GET /api/doodles/drawing/:id`
  - Retrieves an original drawing PNG by its ID
  - Used to prepopulate the drawing when opening a Print/Merch link

## Monetization 

The app uses RevenueCat and Stripe for account management and payments.

- Each install starts with 5 free animations 
- Further animations require a "Jemzi+" in-app purchase
- One SKU: `plus_monthly` at $2.99/mo

The Expo app loads the RevenueCat public SDK key from `app.json` -> `expo.extra.revenueCatPublicSDKKey`.

The Express API server has the secret key and entitlement info in its env vars.

## Expo App Setup

### Dev builds and testing
Check out the monorepo and cd to /artifacts/jemzi-doodles. Then:
```bash
npm install -g pnpm
pnpm i
pnpm expo start --dev-client 
```
On an iOS device, install the Expo Go app and scan the QR code.

### App store builds
The `jemzi-doodles-ios-release` Codemagic workflow creates a signed iOS build and pushes it to TestFlight:
1. Bump the app version and build number in `artifacts/jemzi-doodles/app.json`
2. Commit and push to `main`
3. The Codemagic webhook triggers the Expo build and App Store upload (EAS Build + EAS Submit)
4. Log into App Store Connect to manage beta testing and release

## Links and Credentials
- **Railway API project:** https://railway.app/project/abc123 
- **Replicate:** https://replicate.com/acme-co/doodles
- **RevenueCat:** https://app.revenuecat.com/jemzi-doodles
- **Codemagic:** https://codemagic.io/apps/abc123
- **App Store Connect:** https://appstoreconnect.apple.com/apps/123456

Credentials are in 1Password under "Jemzi Doodles".