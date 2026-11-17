# Steady web app development
_Exported on 11/16/2026 at 23:07:43 EST from Cursor (3.17.8)_

---

**User**

Here's a prompt you can paste into the AI tool you're building with.

```
Build a simple, minimalistic web app called "Steady" as a single self-contained HTML file (HTML, CSS, and JavaScript together, no external libraries or images). It should work on both phones and laptops, and it must open without any login.

PURPOSE
Steady is a 2-minute values warm-up for college students before a stressful event (an exam, presentation, hard conversation, or new group). The user names the event, picks a personal value, writes about why it matters and who else it matters to, gets a one-line "anchor" and a tiny plan, and then returns after the event to check in. The app should let users DO things (reflect, plan, track, and get tailored feedback), not just read information.

DESIGN
- Cream and tan color theme. Suggested palette: background #FAF6EE, cards #FFFFFF or #F3EBDD, tan accents #D8C3A5, darker tan/brown text #4A3F35, a muted warm accent #A67C52 for buttons.
- Minimalistic and calm. Lots of white space, rounded corners, soft shadows, no clutter, no emojis, no gradients.
- Clean sans-serif font (use the system font stack: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif). Large, readable text.
- One screen at a time with a "Next" and "Back" button, and a small progress indicator (for example "Step 3 of 7").
- Mobile-first, fully responsive. Buttons at least 44px tall. Good color contrast.

SCREENS (7 total)
1. Welcome and setup: Short title and one-line explanation. Show this disclaimer clearly: "This application is a class project for educational purposes and is not medical or psychological advice." The user selects what usually stresses them (exams, presentations, hard conversations, new groups). Remember this and skip the intro on return visits, with a small "About" link to bring it back.
2. What's coming up: The user picks or types the event, chooses a date and time, and rates how intense it feels from 1 to 5.
3. Pick a value: Card-style choices. Include self-transcending values (family, friends, helping others, curiosity, fairness, community) and self-enhancing values (achievement, independence, status). The user selects one.
4. Reflect: Two short prompts. (a) "Why does this matter to you, and who else does it matter to?" (text box). (b) A quick sort: the user lists one thing about this event that is in their control and one that is not.
5. Your anchor and plan: Automatically build a one-line anchor from the user's writing, such as "I'm here for [who it helps], and this [event] doesn't change what I value." Let the user edit it. Also let them write a tiny if-then plan ("If I start to spiral, then I will...") and choose one small action to do at the event. Show everything on a clean card the user can screenshot.
6. After the event: The user returns to a saved event, re-rates intensity (1 to 5), writes what they did, and answers "What would you tell a friend in this situation?" Then show a short tailored note based on their data, for example: how their rating changed, which value they used, and a suggestion to reuse what helped. Keep it encouraging and non-judgmental, and never diagnose or give medical advice.
7. My anchors and graduation: Show a history of past events with their value, anchor, and before/after ratings. Show a simple "what's working for you" summary (for example, the value used most often when ratings dropped). After the user has completed 5 events, show a "graduation" card with a message that they now have a skill they can use without the app, and a button to print or download a one-page "anchor card" containing the blank prompts. Also include a small note: "If you are in crisis or thinking about harming yourself, please contact your campus counseling center or call or text 988 (US)."

BEHAVIOR AND DATA
- Save all data in the browser (localStorage), wrapped in try/catch, and fall back to in-memory storage if it is unavailable. Include a "Clear my data" button.
- No accounts, no analytics, no sending data anywhere. Mention that data stays on the user's device.
- If the user types words about self-harm or suicide into any text box, immediately show a gentle message with the crisis resources above instead of continuing.

GUARDRAILS
- Do not give medical or psychological advice, diagnoses, calorie or weight goals, or drug or supplement recommendations.
- Use supportive, plain language. Avoid streaks, points, or guilt-based messaging.

OUTPUT
Return the complete, working code in one HTML file, ready to run as is. Make sure every screen functions and the navigation works. Briefly list the 7 screens at the end.
```

- **Before you use it:** if your tool publishes pages (many require this for the assignment), check that the published link opens without an account.
- **Screenshots:** the assignment needs one per screen, so test all 7 yourself, including the "after the event" and graduation screens, which need saved data to display properly.
- **Citations:** the if-then plan and the friend-advice prompt aren't from your readings, so cite outside sources in the memo if you mention them.

---

**Cursor**

I'll build the Steady app as a single `index.html` in your project folder. First, a quick look at what's already there.

The folder is empty, so I'm writing the app from scratch as one file, `steady.html`.

Now a quick syntax check of the embedded script.

I built Steady as one file, `steady.html`, in your project folder. Double-click it to open it in a browser. There's no login, it uses no outside libraries, and the script passed a syntax check. I haven't clicked through it in a real browser yet, so do a full pass of all 7 screens before you take your screenshots.

**Design change from your palette:** buttons use a slightly darker brown (`#8C6239`) than your suggested `#A67C52`. White text on `#A67C52` doesn't meet standard contrast guidelines, and your prompt asks for good contrast. `#A67C52` is still used for accents, selected cards and the progress bar.

**Behavior worth knowing when you test:**
- **Return visits:** after the first run, the app skips the welcome screen and opens at step 2. If a saved event's date has passed, it opens straight to the check-in for that event. The header has "About", "Check in" and "My anchors" links.
- **The anchor:** it's built from the "why" text. If you write something like "my younger brother" or "my team", the anchor becomes "I'm here for my younger brother, and this exam doesn't change what I value." If no person is named, it falls back to a phrase that matches the value you picked. You can edit it or rebuild it.
- **Crisis words:** typing a self-harm or suicide phrase into any text box opens a pop-up with the 988 and counseling-center message. Next and Save stay blocked until that text is changed.
- **Storage:** data is saved in `localStorage` (wrapped in try/catch) and falls back to memory if storage is blocked. "Clear my data" asks for confirmation, then wipes everything.

**For your screenshots:** graduation needs 5 completed check-ins. The quickest way is to plan 5 events with a date in the past, then check in on each one.

**The 7 screens:**
1. **Welcome and setup:** a one-line explanation, the disclaimer, and your usual stressors.
2. **What's coming up:** the event, its date and time, and a 1–5 intensity rating.
3. **Pick a value:** 6 "bigger than me" values and 3 "my own goals" values, as cards.
4. **Reflect:** the "why and who" prompt, plus one thing in your control and one that isn't.
5. **Your anchor and plan:** the editable anchor, the if-then plan, one small action, and a card to screenshot.
6. **After the event:** pick a saved event, re-rate it, say what you did and what you'd tell a friend, then get a tailored note.
7. **My anchors and graduation:** history, a "what's working" summary, the graduation card with print and download options, the 988 note, and "Clear my data".

---

**User**

how do i oepn it as a link

---

**Cursor**

There are two kinds of link: one that only works on your computer, and a public one that anyone can open. For the assignment you need the public one.

**Only on your computer:** paste this into your browser's address bar:

```
file:///C:/Users/ediso/pubhealth%20project/steady.html
```

Nobody else can open that link, so it won't work for submitting.

**Public link with Netlify Drop (about 2 minutes):**
1. Rename `steady.html` to `index.html`. Netlify looks for that name.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag the whole `pubhealth project` folder onto the page.
4. You'll get a link like `https://random-name-123.netlify.app`.
5. Make a free Netlify account when it asks. Without one, the site is deleted after about an hour. You need the account to publish, but people visiting the link don't need one.

**Public link with GitHub Pages, if you already use GitHub:**
1. Make a new public repository and upload `steady.html`, renamed to `index.html`.
2. In the repository, open **Settings → Pages**, set the source to the `main` branch, and save.
3. After a minute or two, your link will be `https://yourusername.github.io/repo-name/`.

Either way, test the link in a private or incognito window. If it opens without asking you to sign in, it meets the "no login" requirement.

Saved data belongs to each browser and each link. Events you add on your computer won't show up on the published link, so make your test entries on the published version before taking screenshots.

I can rename the file to `index.html` for you if you'd like.

---

**User**

delete the current project html. execute this prompt isntead: THE PROMPT
Build a mobile-first web app called Identity Mirror. It is a class project for a course on purpose in life. It must be a single-page app (HTML/CSS/JS, no backend, everything in localStorage) that runs in a mobile browser and can be "installed" to a home screen via a simple manifest.json if easy, but must work as a plain web page too.

Core concept
The user defines 2–4 identity statements — short phrases describing the person they are trying to become, phrased as "someone who ___" (e.g., "someone who shows up for friends," "a curious learner"). Each day they log small actions and tag each action to one identity. The app reframes logs as evidence: "That's one more vote for 'someone who shows up for friends.'" The progress metric is not a habit streak — it is a per-identity evidence tally shown as a percentage of the user's total tagged actions. The app must never rank users, never use leaderboards, and never punish missed days.

Required screens
Onboarding — a short guided flow to write identity statements. Do not use a blank text box alone: first ask "Think of a time you felt most like yourself — what were you doing?", then help the user phrase it as "someone who ___". Let the user add 2–4 identities. Show the required disclaimer on first launch: "This application is a class project for educational purposes and is not medical or psychological advice." Persist acknowledgment.

Home / Today — shows the identities as cards with an evidence percentage bar. A pre-commit prompt at the top: "Which identity do you want to feed today?" (user picks one before acting). A button to log an action: pick identity → one-line action → optional one-line "why it mattered." After logging, show a reframing message, not confetti: e.g., "One more vote for 'a curious learner.'"

Starved nudge — if an identity has no evidence in 5+ days, surface it on Home: "You haven't acted like [identity] this week — one small action?" with 3 hardcoded example actions.

Weekly Reckoning — a 5-minute weekly flow. Show the identity with the least evidence and ask: "What got in the way this week?" User picks from a fixed list (too busy, avoidance, fear, didn't notice, other) and writes one sentence. Then show a reframe (not a fix): "That's a barrier, not a verdict. Which identity could you feed instead this week?" Store a barrier profile (counts of causes per identity) and show it on this screen.

Trade-off ledger — when logging, optionally let the user record a cost: "This action took time from [other identity]." Keep a ledger and show a weekly "who's been getting the short end" chart (simple CSS bars). A monthly purpose audit asks: "Looking at your trades, what does your life say you actually value? Does it match what you said?" — show stated identities vs. revealed evidence percentages side by side.

Wallpaper Studio (the flagship feature — mobile-targeted) — see spec below.

Graduation — after 28 days or when the user chooses, show a "you can do this without me" screen: the 3-question protocol (Which identity did I feed? Which did I starve? One vote tomorrow?) as a single lock-screen-sized card the user can screenshot, plus an exportable evidence portfolio (a styled HTML page the user can print/save as PDF). Then switch the app to optional weekly mode.

About / Ethics — persistent disclaimer, a "your data never leaves this device" statement (because it's all localStorage), and a note that the app contains no medical, diagnostic, calorie, weight, or supplement advice.

Wallpaper Studio — full spec (mobile-first)
This is the retention and identity-reinforcement hook: the user exports a phone-wallpaper-sized image showing their identities and evidence percentages, and sets it as their daily wallpaper so the mirror is always in their pocket.

Requirements:

Render the wallpaper client-side on a <canvas> — no server, no external libraries required (vanilla JS canvas API is fine; html2canvas optional but not required).

Export sizes (offer a picker, default to the user's screen):

1170 × 2532 (iPhone 12/13/14/15 standard)

1290 × 2796 (iPhone 14/15 Pro Max)

1080 × 2400 (common Android)

1440 × 3120 (Android QHD)

Also a "use my screen size" option via window.screen.width * devicePixelRatio.

Layout must respect phone safe areas: keep all text out of the top ~12% and bottom ~15% of the canvas so it isn't hidden by the status bar, notch/Dynamic Island, and home indicator. Show a faint dashed "safe area" guide in the live preview (not in the exported image).

Content on the wallpaper:

A short title: the user's name or "My Mirror" (editable).

Each identity statement, with a thin horizontal percentage bar beneath it and the percentage as a number.

The percentages are share of tagged evidence, computed from localStorage, rounded to whole numbers, and normalized to sum to 100%.

A small footer line with today's date and the app name. Optionally a one-line "today's vote" — the pre-committed identity for the day.

Design controls (keep it simple): 3–4 preset themes (dark, light, warm, high-contrast), a font-size slider, and a toggle for showing/hiding percentages. No color picker needed.

Live preview in a phone-shaped frame, updating as the user changes settings.

Export button that downloads a PNG at the chosen resolution with a filename like identity-mirror-2026-11-16.png. Use canvas.toBlob + a download link. Also offer a "copy image" button if navigator.clipboard supports images (feature-detect; hide if not).

"How to set as wallpaper" helper: a short collapsible instruction block with iOS and Android steps, because the app can't set the wallpaper itself from a browser. Be explicit and honest about this limitation in the UI.

No network calls. Everything is generated locally.

Data model (localStorage)
Use a single JSON key identityMirror.v1 containing:

identities: array of { id, text, createdAt, selfTranscending: boolean }

actions: array of { id, identityId, text, why, costIdentityId|null, timestamp }

preCommits: array of { date, identityId }

reckonings: array of { weekOf, identityId, cause, note }

settings: { theme, fontSize, showPercentages, wallpaperSize, name }

onboarded: boolean, disclaimerAcknowledged: boolean
Provide a "reset all data" button in About with a confirm dialog.

Behavior and copy rules
Never use streak language, "don't break the chain," points, badges, or leaderboards.

Never compare the user to other users.

Every log response should be a narrative reframe, not a reward animation.

The Reckoning must separate barrier from character ("That's a barrier, not a verdict").

All percentages are share-of-evidence, clearly labeled as such, never framed as a score or grade.

The app must not give medical advice, make diagnostic claims, prescribe calorie targets or weight goals, or recommend drugs or supplements.

Include the disclaimer verbatim wherever required: "This application is a class project for educational purposes and is not medical or psychological advice."

Tech constraints
Vanilla HTML/CSS/JS in as few files as practical (index.html, styles.css, app.js), or a single index.html if simpler. No build step.

Mobile-first CSS; must look right on a 390px-wide viewport and scale up gracefully.

Accessible: sufficient contrast, real buttons, aria-live for the post-log reframe message, and the wallpaper preview must have a text alternative summarizing the percentages.

Everything must work offline after first load (no CDN dependencies if avoidable).

Provide the full code in one response, plus a short README section explaining the wallpaper export sizes, the safe-area choice, and how to reset data.

---

**Cursor**

I'll remove `steady.html` and build Identity Mirror as a small set of plain files: `index.html`, `styles.css`, `app.js`, plus a manifest, a service worker for offline use, an icon, and a README.

Now the main app logic.

A few fixes before testing: the preview canvas was stretched by the phone frame border, one portfolio line was garbled, and form field access should use `elements` to be safe.

Now the manifest, offline service worker, icon, and README.

Files are written. Next I'll syntax-check `app.js` and look for a local browser to click through the app with.

Both parse. I'll install `puppeteer-core` in a temporary folder (outside your project) to drive your installed Chrome through every screen at a 390px phone width.

I deleted `steady.html` and built Identity Mirror. I ran it in Chrome at an iPhone-sized 390px width, and every screen worked with no app errors.

That test went through onboarding, logging an action, the "starved" nudge, a weekly reckoning, the monthly audit, wallpaper export, the evidence portfolio, weekly mode and reset. The wallpaper downloaded as `identity-mirror-2026-11-16.png` at 1170 × 2532 with no guide lines in the image, and the portfolio downloaded as an HTML page. After testing I fixed one small thing: a period after the quoted "why it mattered" text now sits inside the quotes. I didn't rerun the test after that change.

To open it, double-click `index.html`. You'll find the full code in these files in your project folder:

| File | What it is |
| --- | --- |
| `index.html` | Page shell and bottom tab bar |
| `styles.css` | Mobile-first styles |
| `app.js` | All screens, saved data and wallpaper drawing |
| `manifest.json`, `icon.svg` | "Add to Home Screen" support |
| `sw.js` | Makes it work offline once it's on a real link |
| `README.md` | The section you asked for: export sizes, safe areas and resetting data |

![Wallpaper exported from the Warm theme](C:\Users\ediso\AppData\Local\Temp\imtest\downloads\identity-mirror-2026-11-16.png)

![Today screen with test data](C:\Users\ediso\AppData\Local\Temp\imtest\shots\05-today-seeded.png)

**Things that differ from the prompt or need explaining:**
- **Audit "Said" numbers:** the prompt didn't say where these come from. In the audit, the user rates each identity from 1 to 5 for how much it matters. Those ratings become the "Said" percentages, shown next to "Lived," which is the last 30 days of evidence. Audits are stored in an extra `audits` list.
- **Lock-screen clock:** the iPhone lock-screen clock covers roughly 12–30% down the screen, which is more than the 12% top margin the prompt asked for. I added a "Leave room for the lock-screen clock" option, on by default, that starts the text 30% down. All text also stays out of the top 12% and bottom 15%.
- **Other extra settings:** there's a "Show today's vote" toggle and a daily/weekly mode setting. There's also a date for when you started (for the 28-day graduation) and one for when you switched to weekly mode.
- **Crisis line:** About includes the 988 and campus counseling note. It wasn't in this prompt, but it carries over from your last project.

**Limits when you open the file straight from your computer:**
- The manifest, home-screen install and offline mode only work once the app is on a real link. Chrome blocks them for local files; that's the only console error, and it goes away once hosted.
- The "Copy image" button appeared in Chrome even for the local file. It falls back to an error message if copying fails, so use Download instead.

To get a link, upload the whole folder to Netlify Drop or GitHub Pages, the same way as before. It's already named `index.html`. If you change the code after publishing, change `CACHE` in `sw.js` to `identity-mirror-v2` so returning visitors get the new version.

**For your screenshots:** "Log an action" is on Today. Graduation needs 28 days, but there's a "Graduate now" button in About so you don't have to wait. The "haven't acted like…" nudge only appears after an identity has gone 5 days without a logged action, so a brand-new setup won't show it.

---

**User**

what is the site to view it on my device

---

**Cursor**

There's no public website yet, but I can serve the app from your computer so your phone can open it over the same Wi-Fi. Starting a small local server now.

The app doesn't have a public website yet. It's only on your computer, so I started a small server that lets your phone open it over Wi-Fi. I confirmed the address below loads the app.

**On your phone:** connect to the same Wi-Fi as your laptop, then open this in Safari or Chrome:

```
http://10.165.0.246:8000
```

**On your laptop:** open `http://localhost:8000`.

**If the phone can't connect:**
- If a Windows Firewall pop-up appeared for Python, choose **Allow** (Private networks is enough). If you missed it, search Start for "Allow an app through Windows Firewall" and allow Python.
- Campus Wi-Fi often blocks devices from reaching each other. If that's the problem, use one of the public options below.

**How long the link lasts:** it only works while your laptop is on, awake, and this Cursor window is running the server. It isn't a shareable website.

**For a real link to submit:** go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the whole `pubhealth project` folder onto the page. Make a free account when it asks so the site doesn't expire. You'll get an `https://….netlify.app` address that opens on any device without anyone needing to sign in. GitHub Pages also works.

The public link also matters for some features. Over the local `http://` address, offline mode, home-screen install and "Copy image" won't work, because phones only allow them on secure `https://` sites. Everything else, including Download PNG, works on the local address.

Data saved on your phone stays separate from your laptop's, and the local address and the Netlify link keep separate data too. Make the test entries for your screenshots on whichever version you'll submit.

---

**User**

ok a few things. when adding identities, remove the start with a memory screen. just move into who were you being? but change the title to add an identity. change the text to Who do you want to be? What do you want to do, achieve, and accomplish? remove the box and text taht says this one is mostly about ot her people or something bigger than me. then, instead of saying today's vote, display today's focus. display the log an action box only after a focus is chosen. 

---

**Cursor**

I'll make those changes in `app.js`. First I'll find every place that says "vote" and every use of the memory step.

Rewriting the onboarding steps: no memory screen, a new title and question, and no "about other people" checkbox.

Now the onboarding action handlers and state.

Now the Today screen: rename "Today's vote" to "Today's focus" and only show "Log an action" once a focus is picked.

Now I'll update the browser test for the new flow and rerun it.

All your changes are in, and I reran the full click-through in Chrome with no errors. Refresh `http://10.165.0.246:8000` on your phone to see them.

- **Adding an identity:** the "Start with a memory" screen is gone. After the disclaimer, and whenever you add another identity, you go straight to a screen titled **Add an identity** that asks "Who do you want to be? What do you want to do, achieve, and accomplish?"
- **Checkbox removed:** the "mostly about other people or something bigger than me" checkbox is gone. Identities still save that field, but it's always set to "no" now. As a result, the "haven't acted like…" nudge always suggests the general small actions, like "Do the smallest possible first step."
- **Today's focus:** "Today's vote" is now "Today's focus" on the Today screen, in the confirmation messages, on the wallpaper footer, and in the Wallpaper Studio toggle ("Show today's focus").
- **Log an action:** the Log an action button only appears after you pick a focus for the day. Until then, the card says "Pick a focus to start logging actions." This now applies in weekly mode too, where picking a focus used to be marked optional.

Two related changes you didn't ask for:
- **Nudge suggestions:** with no focus picked, the nudge's suggested actions would have had no way to open the logging form. Tapping one now also sets that identity as today's focus.
- **Back button:** the old Back button went to the memory screen. It now says "Back to my list" and only shows once you have at least one identity.

I left the other "vote" wording alone, since it isn't about today's pick. That's the "One more vote for…" message after logging, the "Small daily actions are votes…" line on the opening screen, and the graduation question "One vote tomorrow?" I can change those too if you want the word gone everywhere.

![The new Add an identity screen](C:\Users\ediso\AppData\Local\Temp\imtest\shots\02-phrase.png)

If you already made identities on your phone, they're kept. To see the new first-time screens, use **About → Reset all data**.

