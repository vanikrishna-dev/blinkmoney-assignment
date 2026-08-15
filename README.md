# BlinkMoney — Frontend Assignment

Built for the BlinkMoney frontend hiring assignment. Everything you'll see is React Native (Expo SDK 57, JS only, no TypeScript). 

---

## What I decided to build

The brief was deliberately open. It calls out five outcomes worth chasing — engagement, referral, wealth gamification, lead magnet, virality — and then flat-out says *"you decide."* 

So I ignored the first idea I had and used the app for a bit. Two things jumped out:

1. The **FAQ has three separate questions about lien marking** (pledging mutual funds against a borrow). That's not accidental. If a company writes three FAQ entries on the same topic, it means real users keep asking. What they're really asking is: *"if I borrow against my money, is my money still mine?"* Nobody has visually answered that yet.
2. The tagline **"Borrow without selling a rupee"** is emotionally loaded but shown as flat text. It's begging for a visual that proves it.

That framing pushed me toward building three connected screens that reuse a single visual language (coins) but attack different outcomes from the brief. Three screens instead of one because the assignment specifically screens out *"static screens with no meaningful interaction"* and I wanted to show range — not just a single hero screen with fancy animations on it.

---

## The three screens

### 1. Lien Vision (`src/screens/LienVisionScreen.js`) — *Gamification + Trust*

Your ₹25,000 shown as 18 real, minted gold coins in a vault. Drag the borrow slider at the bottom → specific coins get a green ring (pledged as collateral for the loan). But every pledged coin still glows, still drifts, still shows a live earning counter that ticks upward in real time. That last part is the point. It's a visual answer to *"can I still get returns on my pledged investments?"*

Tap any coin to inspect it — you see when it was invested, its share of the ₹25K, and how much it's earned so far, whether it's pledged or not.

Small things that matter:
- 60fps physics running on the UI thread (Reanimated worklets + Skia frame callback). Zero JS bridge crossings for the animation loop, so the coin drift is jitter-free even while the borrow slider is being dragged.
- Haptic tick every time the borrow slider crosses a per-coin boundary. That's the tactile equivalent of watching a specific rupee get marked.
- A 3-step onboarding overlay on first launch, because I showed the raw screen to a friend and they said "what am I looking at." Fair. Fixed the story, not the visuals.

### 2. Vault Duel (`src/screens/VaultDuelScreen.js`) — *Referral + Virality + Engagement*

Referral in fintech is usually "here's my code, get ₹100." That's transactional and honestly a bit gross. What actually gets people to invest is accountability, not incentive — same reason people run with a friend but not alone.

Vault Duel lets you dedicate one coin from your vault to a friend. You invite them via WhatsApp (real deep link, not a mock). Both of you SIP toward a shared ₹1,000 target on that paired coin. Live progress bars, streak dots, and a genuine "you vs friend" race. Nobody pays anybody — this is a streak flex, not a bet. That distinction matters ethically.

Why it works for the brief:
- **Referral** — the invite is *structural* to the feature (you literally need a friend for it to make sense), not bolted on.
- **Virality** — the WhatsApp message is something you actually want to send, not something the app begs you to send.
- **Engagement** — accountability is a proven daily-return mechanic (Duolingo streaks, Strava kudos). Nobody in Indian fintech does it because talking about money socially feels taboo. This works around that by never exposing amounts to the friend — just the streak.

### 3. Cost of Waiting (`src/screens/CostOfWaitingScreen.js`) — *Lead Magnet + Virality*

Every fintech onboarding sells the upside — "₹100/day grows to ₹2.7L!" — because that's what training data optimises for. But loss aversion is roughly 2x stronger than gain-seeking in most behavioural research. Nobody's using it in Indian fintech.

Cost of Waiting is a live ₹ meter that ticks upward showing what you've missed by not investing for the last N years. There's a horizontal timeline scrubber ("6 months ago ← ● → 10 years ago") — drag it and the meter redraws + re-accrues at a new per-second rate. A second slider adjusts your daily SIP. Every time either slider snaps to a new stop, there's a haptic tick. When you commit ("Freeze the meter · Start SIP"), the counter locks in green, the entire screen flashes green for half a second with a heavy haptic thunk, and a "meter frozen" confirmation appears. That's the demo money-shot.

Why it belongs:
- **Lead magnet** — this screen works *pre-signup*. Someone can install the app, drag the sliders, screenshot the number, and share it. That's the exact "lead magnet" behaviour the brief asks for.
- **Virality** — "I lost ₹18,400 by waiting 2 years" is a screenshot people actually send to their group chats, because it justifies a decision they were already circling.
- **Ethical guardrail** — this could easily become an anxiety-farming feature. I deliberately made the *freeze* the hero, not the guilt. The design intent is one satisfying moment of "I stopped losing," not a permanent doom counter. That distinction was intentional.

---

## Nav

I skipped `react-navigation` because for three sibling screens it's a lot of native config for very little payoff. Instead there's a hand-built pill-shaped tab bar (`src/nav/TabBar.js`) that lives at the bottom, doesn't intrude on the screens, and animates the active tab with a green glow. Each screen has its own scroll and safe-area handling.

Every screen also has a **"Show demo"** button in the top-right that reopens a 3-step explainer for that screen. The overlay component (`OnboardingOverlay`) takes a `steps` prop so each screen defines its own copy — same UI, different words. First launch of Lien Vision auto-opens it; after that it only shows when the button is tapped.

Everything below is what the code shows. If you're reviewing, feel free to skim.

---

## Component structure

```
src/
├── nav/
│   └── TabBar.js
├── screens/
│   ├── LienVisionScreen.js       – Screen 1 composition
│   ├── VaultDuelScreen.js        – Screen 2 composition
│   └── CostOfWaitingScreen.js    – Screen 3 composition
├── vault/
│   ├── VaultCanvas.js            – Skia canvas + coin physics
│   └── coinModel.js              – Pure logic: distribution, lien math, earnings
├── controls/
│   ├── BorrowSlider.js           – Gesture-handled slider with haptics
│   └── CoinDetailSheet.js        – Bottom sheet with per-coin trace
├── panels/
│   ├── LiveCounter.js            – 60fps rupee ticker
│   ├── OnboardingOverlay.js      – Reusable 3-step overlay (first launch + "Show demo" on every screen)
│   └── ShareCard.js              – view-shot capture target
└── theme/
    └── tokens.js                 – Colors, spacing, type (BlinkMoney palette)
```

Every "screen file" is composition only. The interesting logic sits in `vault/`, `controls/`, `panels/` — that way each piece can be dropped into a real product later. `coinModel.js` in particular has zero UI dependencies, which makes it trivially testable.

---

## Edge cases I actually thought about

The brief says *"list every edge case you can find,"* so:

- **₹0 invested** — vault renders with the target but no coins, share card handles the divide-by-zero.
- **Slider at 0** — no lien state lingers on any coin.
- **Slider at max** — every coin gets marked pledged but the earning counter keeps running (the whole trust point of the feature).
- **Rapid slider drag** — lien assignment uses a spring, not an abrupt swap, so it doesn't jitter.
- **Tap a coin mid-drag** — pan gesture and tap gesture are set up as simultaneous, so this doesn't stall.
- **Cold start** — coins fade in via the drift physics, not a jarring pop.
- **Landscape rotation** — vault canvas resizes without re-seeding positions (positions are memoised on invested + dimensions).
- **Rendering 18 coins with 6 shared values each** — hooks called in a `for` loop with a compile-time-constant count, so React's hook order stays stable across renders. Learned this the hard way when I changed the count mid-session.
- **WhatsApp not installed on the phone** — falls back with an Alert instead of crashing.
- **Metro cache leaks between builds** — noted in a "run" section below.
- **Java 24 on the Mac** — Android Gradle Plugin breaks with anything above 17. Docs on the run section.
- **Skia `<Paint>` inside `<Circle>` leaks blur to sibling elements in Skia RN 2.x** — burned an hour on this one; using plain circles now.
- **Cost of Waiting looking like anxiety farming** — deliberately made the freeze the hero, not the guilt. See the screen 3 note above.

---

## Running it

You need an Android phone (or emulator) and a Mac with Android SDK + JDK 17. The build is native because Skia, Reanimated worklets, gesture-handler, view-shot, and haptics all need it — Expo Go can't load this project.

```bash
# One-time — pin JDK 17 to this shell
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Install deps
npm install

# Build + install on connected Android device
npx expo run:android
```

First build is ~14 min because Gradle downloads the Android SDK, CMake, and Skia's C++ toolchain the first time. Subsequent builds are ~30s.

If the app boots weirdly after a code change, kill Metro and run with `--clear` to nuke the bundle cache:

```bash
npx expo start --clear
```

Then press `a` to reopen on the phone.

---

## What's real vs mocked

Honestly:
- The **animation, physics, gestures, haptics, live tickers, share sheet, WhatsApp deep link** are all real and work on device.
- The **investment amounts** are static demo data (₹25,000 hardcoded). Wiring to a real backend would take an afternoon but wasn't the point of the exercise.
- The **duel state** is local — a real product would push to a shared backend. The current version demonstrates the interaction pattern.
- The **projected returns** (15% p.a.) use a proper daily-compounded calc but are marked as "informational" per BlinkMoney's own convention.

---

## What I skipped (and why)

- **No react-navigation.** Three sibling screens don't need a nav library. Hand-built tab bar in ~120 LOC.
- **No design system tokens beyond colors/spacing/type.** For a hackathon-scale project this is right-sized. Real product = full atomic component library.
- **No unit tests.** `coinModel.js` is set up to be testable but I didn't ship tests — 24 hours is 24 hours.
- **No dark/light toggle.** BlinkMoney's product is a dark app. That was a decision, not an omission.
- **No i18n.** Rupee-first, English-first. Straightforward to add later.

---

## Stack

- **Expo SDK 57** with React 19.2 / RN 0.86.2
- **React Native Skia 2.6** for the vault canvas
- **Reanimated 4.5** with worklets 0.6 for 60fps physics on the UI thread
- **Gesture Handler 2.32** for pan + tap on the slider and vault
- **expo-haptics** for the tactile ticks
- **expo-sharing + react-native-view-shot** for the share card
- No CSS-in-JS lib, no state manager — plain `StyleSheet` and `useState`

---

## A note

The brief also says *"Automatic reject: a bug fix, a mutual fund analyser, a minor UI fix, static screens with no meaningful interaction."* I re-read that line every time I was tempted to add a Home dashboard or a "Portfolio" tab. What's here is designed to fail that test in the opposite direction — every screen has one interaction that's the reason to open it, and none of them are calculators.

Good luck sifting through the submissions. If you want to see specific animations or discuss decisions, my email is on the form.
