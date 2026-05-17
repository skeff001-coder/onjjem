# App Store Submission Guide

This guide walks you through submitting **ONJJEM Photo Restoration** to the App Store.
The first run must be done on your Mac because Apple's 2FA login cannot run inside Replit.
After credentials are stored on Expo's servers, all future builds can run from Replit without this step.

---

## Before you start

You need:

- A Mac with Node.js installed (Node 18+ recommended)
- Your Apple Developer account login: `skeff001@yahoo.com`
- Access to your iPhone or the 6-digit 2FA code Apple sends you
- Your Expo account token — get it from [expo.dev/accounts/skeff001/settings/access-tokens](https://expo.dev/accounts/skeff001/settings/access-tokens)

---

## Step 1 — Install EAS CLI on your Mac

```bash
npm install -g eas-cli
```

---

## Step 2 — Log in to your Expo account

```bash
eas login
```

Enter your Expo username and password when prompted.

Alternatively, set your token as an environment variable to skip the login prompt:

```bash
export EXPO_TOKEN=<your-token-here>
```

---

## Step 3 — Run the production build (interactive)

From your Mac, inside the project folder (or with the `--non-interactive` flag removed):

```bash
cd path/to/owens-photofix
EXPO_TOKEN=<your-token> npx eas-cli@latest build --platform ios --profile production
```

During this run, EAS will:

1. Ask you to log in to your Apple Developer account (`skeff001@yahoo.com`)
2. Send a 2FA code to your iPhone — enter it when prompted
3. Generate a Distribution Certificate and Provisioning Profile
4. Upload both to Expo's servers (this only happens once)
5. Queue the build on Expo's build infrastructure

When it completes you will see a build URL such as:
`https://expo.dev/accounts/skeff001/projects/owens-photofix/builds/<build-id>`

Save that URL — you will need the build ID in the next step.

---

## Step 4 — Submit to App Store Connect

Once the build status shows **"Finished"** in the EAS dashboard, run:

```bash
EXPO_TOKEN=<your-token> npx eas-cli@latest submit --platform ios --profile production
```

EAS will pick up the credentials it already stored and submit the build automatically.
The submit config in `eas.json` already has your details filled in:

| Field        | Value                  |
|--------------|------------------------|
| Apple ID     | skeff001@yahoo.com     |
| App ID       | 6770152126             |
| Team ID      | J6N9GAHK44             |

---

## Step 5 — Check App Store Connect

Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and open **ONJJEM Photo Restoration**.
Within a few minutes the build should appear under **TestFlight** or in the **App Review** queue, depending on whether you submitted for external testing or direct review.

---

## After this first run — releasing from Replit

Once credentials are stored on Expo's servers you no longer need a Mac.
All future releases are triggered from the Replit shell.

**Requirements (one-time setup — already done):**
- `EXPO_TOKEN` is stored in Replit Secrets (already configured)
- `eas-cli` is installed as a project dependency

**How to release a new version:**

Open a shell in Replit and run:

```bash
pnpm --filter @workspace/owens-photofix run release:ios
```

This runs the following two commands in sequence, fully non-interactively:

```
eas build --platform ios --profile production --non-interactive
eas submit --platform ios --profile production --non-interactive
```

Watch the output — when both commands complete, the build has been submitted to App Store Connect.

If you have set up push notifications (see below), you will also receive an alert on your iPhone when the build finishes.

The `release:ios` script is defined in `artifacts/owens-photofix/package.json`.

---

## Get a push notification when your build finishes (optional)

Builds take 20–40 minutes. Instead of watching the console, you can get a push alert straight to your iPhone when the build succeeds or fails.

**One-time setup (2 minutes):**

1. Install the free **ntfy** app on your iPhone — search "ntfy" in the App Store or go to [ntfy.sh](https://ntfy.sh).
2. Open the app and tap **Subscribe to topic**.
3. Choose any unique topic name, e.g. `onjjem-builds-skeff001` (make it hard to guess so only you receive it).
4. In Replit, open **Secrets** and add a new secret:
   - **Key:** `NOTIFY_TOPIC`
   - **Value:** the topic name you chose (e.g. `onjjem-builds-skeff001`)

That's it. The next time you run `release:ios`, you will receive:
- A **green** notification when the build is submitted to App Store Connect.
- A **red** notification if the build or submit step fails, so you can fix it quickly.

If you skip this setup the release script still works normally — notifications are silently skipped.

---

## Bundle ID and Project details (for reference)

| Field         | Value                                    |
|---------------|------------------------------------------|
| Bundle ID     | com.onjjem.photorestoration              |
| EAS Project   | 8c029b42-97fc-4a11-97b4-5dd2ed450605    |
| Owner         | skeff001                                 |
| App version   | 1.0.0 (build number auto-increments)    |
