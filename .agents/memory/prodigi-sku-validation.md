---
name: Prodigi SKU validation findings
description: Confirmed valid/invalid SKUs and required attributes from live Prodigi API (2026-06-01)
---

## Valid SKU formats (live API confirmed)
- Stretched canvas: `GLOBAL-CAN-{W}X{H}` — requires `attributes.wrap`
- Eco canvas: `ECO-CAN-{W}X{H}` — requires `attributes.wrap`
- Eco rolled: `ECO-ROL-{W}X{H}` — no attributes needed
- Rolled canvas: `GLOBAL-CAN-ROL-SC-{W}X{H}` (inches) — NOT `ROL-SC-{W}X{H}`
- Slim canvas: `GLOBAL-SLIMCAN-{W}X{H}` — requires `attributes.wrap`
- Box frames: `GLOBAL-BOX-{W}X{H}` — requires `attributes.color` (white/natural/black)
- Photo tiles: `PHOTIL-FRA-{WW}{HH}` — requires `attributes.color` (white/black)
- Jigsaws: `JIGSAW-PUZZLE-{N}` — needs TWO assets: printArea "jigsaw" AND "lid"
- Playing cards: `PLAY-CARD`
- Tattoos: `GLOBAL-TATT-S`, `GLOBAL-TATT-M`, `GLOBAL-TATT-L` — XL/X/XX not in catalog

## Invalid SKUs (SkuNotFound in live API)
- `FRA-MC-*` (all variants: -B, -V, no suffix) — framed canvas not in live catalog
- `ROL-SC-{W}X{H}` — use `GLOBAL-CAN-ROL-SC-{W}X{H}` instead
- `GLOBAL-TATT-X`, `GLOBAL-TATT-XX` — XL tattoo not in catalog

## Quotes API quirk
- Asset URL field is UNKNOWN in quotes endpoint — send `{"printArea":"default"}` with NO url
- Without URL, quotes return successfully with real pricing

**Why:** Prodigi live API catalog differs from sandbox and HTML docs. Always verify with actual API.
