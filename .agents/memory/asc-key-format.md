---
name: ASC Key Secret Format
description: The ASC_API_KEY_P8 Replit secret has spaces instead of newlines — fix before writing to disk
---

## Problem
`ASC_API_KEY_P8` is stored in Replit Secrets with all newlines replaced by spaces, e.g.:
```
-----BEGIN PRIVATE KEY----- MIGTAgEA...lDdgG W5AUK1...bzpK ... NfcayjG3 -----END PRIVATE KEY-----
```

## Fix (Python)
```python
import re, os
key = os.environ.get('ASC_API_KEY_P8', '')
m = re.match(r'(-----BEGIN [^-]+-----)\s*(.*?)\s*(-----END [^-]+-----)', key, re.DOTALL)
if m:
    header, body, footer = m.group(1), m.group(2), m.group(3)
    fixed = f'{header}\n{body.replace(" ", chr(10))}\n{footer}\n'
    with open('/tmp/asc_key.p8', 'w') as f:
        f.write(fixed)
```

The release script (`artifacts/owens-photofix/scripts/release-ios.js`) Step 5 now does this automatically.

**Why:** Replit's secret storage collapses newlines in multiline secrets to spaces. openssl/EAS requires proper PEM formatting with actual newlines between base64 lines.
