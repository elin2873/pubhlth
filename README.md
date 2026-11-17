# Identity Mirror

A mobile-first, single-page web app for a course on purpose in life. Users write 2 to 4 identity statements ("someone who shows up for friends"), log small daily actions as evidence for them, and see each identity's share of their evidence. There are no streaks, scores, badges, or leaderboards.

> This application is a class project for educational purposes and is not medical or psychological advice.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell, tab bar, live region |
| `styles.css` | Mobile-first styles (designed at 390px wide, scales up) |
| `app.js` | All screens, storage, wallpaper rendering |
| `manifest.json`, `icon.svg` | "Add to Home Screen" support |
| `sw.js` | Caches the app so it works offline after the first load (only over http/https) |

No build step and no external libraries. Open `index.html` directly, or host the folder on any static host (GitHub Pages, Netlify). Offline support and "Copy image" need http/https. Everything else also works from `file://`.

## Wallpaper export sizes

The Wallpaper Studio draws the image on a `<canvas>` in the browser, then downloads it as `identity-mirror-YYYY-MM-DD.png` using `canvas.toBlob`.

| Option | Pixels | Typical device |
| --- | --- | --- |
| My screen (default) | `screen.width × devicePixelRatio` by `screen.height × devicePixelRatio` | Whatever phone you're on. On a laptop the result is turned to portrait, so pick a phone size instead. |
| iPhone 12 to 15 | 1170 × 2532 | iPhone 12, 13, 14, 15 (standard) |
| iPhone 14/15 Pro Max | 1290 × 2796 | Large iPhones |
| Common Android | 1080 × 2400 | Most mid-range Android phones |
| Android QHD | 1440 × 3120 | High-resolution Android phones |

All layout is computed from the image width (1170px is the reference), so text and bars scale the same way at every size. If the identities don't fit, the text automatically shrinks until they do.

## Safe-area choice

Phones cover the top and bottom of the wallpaper with the status bar, the notch or Dynamic Island, and the home indicator. Identity Mirror keeps all text out of:

- the **top 12%** (status bar, notch, Dynamic Island), and
- the **bottom 15%** (home indicator, lock-screen flashlight and camera buttons).

The live preview shows these as dashed pink bands. They are only drawn on the screen, never on the exported PNG.

The iPhone lock-screen clock covers roughly the 12% to 30% band as well, so the "Leave room for the lock-screen clock" option (on by default) starts the content at 30% of the height. Turn it off if you only use the image as a home-screen wallpaper.

Browsers can't set a phone's wallpaper. The studio says so plainly and includes step-by-step iOS and Android instructions.

## Data and resetting

Everything lives in `localStorage` under one key, `identityMirror.v1`:

```
identities:  [{ id, text, createdAt, selfTranscending }]   (selfTranscending is always false; the onboarding no longer asks)
actions:     [{ id, identityId, text, why, costIdentityId | null, timestamp }]
preCommits:  [{ date, identityId }]
reckonings:  [{ weekOf, identityId, cause, note }]
audits:      [{ date, stated, revealed, note }]          (added for the monthly audit)
settings:    { theme, fontSize, showPercentages, wallpaperSize, name,
               showVote, clockSpace, mode }              (last three added)
onboarded, disclaimerAcknowledged, startedAt, graduatedAt
```

If `localStorage` is blocked (some private-browsing modes), the app keeps data in memory for the session and says so on the About screen. Nothing is ever sent over the network.

**To reset:** open **About**, then tap **Reset all data** and confirm. This deletes the `identityMirror.v1` key and returns you to the first-launch disclaimer. You can also clear the site's data in your browser settings.

**When you update the code on a host:** change `CACHE` in `sw.js` (for example to `identity-mirror-v2`) so returning visitors get the new files instead of the cached ones.
