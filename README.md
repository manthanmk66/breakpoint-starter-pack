# Breakpoint London Starter Pack

A tiny isometric 3D London game for Solana Breakpoint 2026 (Olympia London, 15–17 Nov).
Walk an attendee around London, collect the 9 things everyone needs for Breakpoint, and watch
your freshly tokenized starter pack dump in real time.

Built with Next.js (App Router) and three.js. No backend.

## What's in it

- **9 items to pack** across London: Tower Bridge, the Tube, the corner shop, Olympia, the London Eye,
  a Shoreditch side event, the pub, Big Ben and a Zone 3 flat.
- **Tokenize everything.** Every item becomes a parody token ($UMBRLA, $MEALDL, $SLEEP…) with a price
  that mostly goes down. The final screen is your starter pack portfolio.
- **A crowd with opinions.** Walk past people or tap them to hear what Breakpoint attendees really talk about.
- **Share on X** with your pack's final value, plus a generated link preview image.
- **Zoom and follow camera**, with a short push-in whenever you pack something.

Parody only: no real tokens, no wallet, not financial advice.

## Controls

| Action | Desktop | Phone |
|---|---|---|
| Walk | Click the map, or WASD / arrow keys | Tap the map |
| Talk | Click a person | Tap a person |
| Zoom | Scroll, `+` / `-`, `0` to reset | Pinch, or the − / + buttons |
| Guide to the nearest item | `G` or "Guide me" | "Guide me" |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Deploy

Import the repo on [Vercel](https://vercel.com) with the Next.js preset. No environment variables needed.

## Project layout

| File | What it does |
|---|---|
| `lib/items.ts` | The 9 items (copy, tickers, prices, map positions) and the crowd's lines |
| `lib/engine.ts` | The three.js scene: board, landmarks, character, pathfinding, camera, pickups |
| `components/Game.tsx` | The HUD: item card, tray, pack value, final portfolio screen |
| `app/opengraph-image.tsx` | Generates the link preview image |
| `app/globals.css` | Styling; colors are CSS variables at the top |
| `scripts/build-character.mjs` | Generates the player and crowd models |

### Character model

The player (Solana logo tee, gold backpack, Idle and Walk animations) is `public/models/attendee.glb`,
and the crowd is `public/models/person.glb`, which the game recolours for each person. Both are
generated from code by `scripts/build-character.mjs` (the tee print is `scripts/solana-logo.png`).
Tweak colours or proportions there and run:

```bash
npm run character
```

Any rigged `.glb` with clips named like "Idle" and "Walk" also works as a drop-in replacement.
If either file is missing, the game falls back to its built-in figures.

## Credits

Design and build: [@manthan_reddy](https://x.com/manthan_reddy) · #NextStopBreakpoint
