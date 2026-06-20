#!/usr/bin/env bash
set -e

echo "=== What's Up Dog! — EAS iOS Build ==="

# Verify required secrets are present
MISSING=()
[[ -z "$expo_token" ]]       && MISSING+=("expo_token")
[[ -z "$asc_api_key_id" ]]   && MISSING+=("asc_api_key_id")
[[ -z "$issuer_id" ]]        && MISSING+=("issuer_id")
[[ -z "$api_key_content" ]]  && MISSING+=("api_key_content")
[[ -z "$team_id" ]]          && MISSING+=("team_id")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "ERROR: Missing secrets: ${MISSING[*]}"
  exit 1
fi

echo "✓ All credentials present"

# Write the .p8 key file that EAS CLI needs
P8_PATH="/tmp/asc_api_key.p8"
echo "$api_key_content" > "$P8_PATH"
chmod 600 "$P8_PATH"
echo "✓ API key file written"

# Export variables in the names EAS CLI understands
export EXPO_TOKEN="$expo_token"
export EXPO_APPLE_TEAM_ID="$team_id"
export APPLE_API_KEY_ID="$asc_api_key_id"
export APPLE_API_ISSUER_ID="$issuer_id"
export APPLE_API_KEY_PATH="$P8_PATH"

echo "✓ Credentials mapped"

# Move into the app directory
cd artifacts/canine-encyclopedia

# Check EAS CLI version
echo "EAS CLI: $(eas --version)"

# Confirm who we're logged in as
echo "Expo account: $(eas whoami)"

# Project already linked by previous run — skip init
echo "✓ Project already linked (ID: JSsMyBRpbjzMTsumbXas-hY8azQbtcH8-_MVISmI)"

# Kick off the iOS production build
echo ""
echo "=== Starting iOS production build ==="
eas build \
  --platform ios \
  --profile production \
  --non-interactive \
  --no-wait

echo ""
echo "=== Build submitted! ==="
echo "Track progress at: https://expo.dev/accounts/[your-account]/projects/canine-encyclopedia/builds"
