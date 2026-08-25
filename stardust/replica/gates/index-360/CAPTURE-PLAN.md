# Replica source-fidelity gate — homepage @360 (mobile) — SETUP / BLOCKED

**Status:** not started — blocked on a live mobile ground-truth capture.

## Why this is blocked
- The prototype (`stardust/prototypes/index-proposed.html`) is currently **desktop-only**
  — no `@media` rules. At 360 it renders the 1440 layout (overflow/scale); the skill's own
  validation measured **24%** at 360 for a 1440-tuned prototype. Mobile is a separate build.
- Extract captured **desktop only** (`current/assets/screenshots/index.png` is 1440-wide;
  no mobile screenshot). There is **no 360 ground truth** to recreate from or gate against.
- The replica contract is recreation *from the capture*, never invented layout — so the
  mobile CSS cannot be authored faithfully until the live mobile render is captured.
- www.1800contacts.com is behind PerimeterX "Press & Hold"; a mobile capture needs an
  interactive **human solve** (headed Chrome). Cookie-replay does not work (clearance is
  fingerprint-bound), and the passive `--headed` wait clears Cloudflare but not PerimeterX.

## One-step capture (run when you can solve, ~30–60s)
From the project root, with the prototype server still up on :8791:

```bash
# 1. LIVE mobile ground truth — headed; solve the Press & Hold in the Chrome window
node scripts/replica/stitch-shot.mjs "https://www.1800contacts.com/" \
  stardust/replica/gates/index-360/live.png --width 360 --headed --settle
```

That gives `gates/index-360/live.png` — the mobile ground truth. Then I:
1. Author the 360 layout from it (hamburger nav, stacked hero, full-width cards/carousel,
   stacked FAQ) as a `@media (max-width:600px)` block, values lifted from the live mobile CSS.
2. Run the gate at 360 (proto capture + pixel/height/content probes), iterate ≤3×:

```bash
node scripts/replica/stitch-shot.mjs "http://localhost:8791/index-proposed.html" \
  stardust/replica/gates/index-360/proto.png --width 360
node scripts/replica/pixel-compare.mjs stardust/replica/gates/index-360/live.png \
  stardust/replica/gates/index-360/proto.png --out stardust/replica/gates/index-360/diff.png
node scripts/replica/content-parity.mjs stardust/current/pages/index.json \
  http://localhost:8791/index-proposed.html --proto-main body   # content unchanged by breakpoint
```

Pass bar (same as 1440): pixel ≤10% full-page · height |Δ|≤8px · content-diff 0 genuine
structural drop · visual-diff none/justified.

## Alternative if you'd rather not solve
Re-run extract with a mobile viewport + `--headed` to add a mobile screenshot to the
capture set, or supply a mobile screenshot/URL-behind-solve another way. Either gives the
ground truth this gate needs.
