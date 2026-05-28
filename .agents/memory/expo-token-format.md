---
name: EXPO_TOKEN format
description: Valid Expo personal access token is ~40 chars; how to verify and troubleshoot clipboard/paste issues.
---

## Rule
A valid Expo personal access token from expo.dev → Account Settings → Access Tokens is approximately **40 characters** of alphanumeric + hyphens/underscores. No spaces, no URLs, no long strings.

## How to verify before running a build
```bash
echo "Length: ${#EXPO_TOKEN}"
curl -s -o /dev/null -w "%{http_code}" https://api.expo.dev/v2/auth/userinfo -H "Authorization: Bearer $EXPO_TOKEN"
# Should return 200. Anything else = invalid token.
```

## Why
The user repeatedly pasted a 120–160 char invalid string due to browser clipboard/autofill issues on Windows (Chrome kept inserting old values). The Replit secrets panel masked dots make it hard to clear; Ctrl+A before pasting is needed.

## Workaround if EXPO_TOKEN keeps failing
1. Have the user create a new token on expo.dev under a DIFFERENT secret name (e.g. "build_token")
2. Test it in bash: `curl ... -H "Authorization: Bearer $build_token"` — look for 200
3. Once confirmed valid, export it: `export EXPO_TOKEN="$build_token"`
4. Run the EAS build in the same shell session

## How to apply
Before any EAS build, always run the curl test. If 401, do NOT assume the token is correct — check length and try the workaround above.
