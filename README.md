# Top Shelf

A small phone game: slide drinks down a bar top, and when two of the same drink touch
they merge into the next bigger one. Fill the orders on the rail to earn coins before
the bar gets too crowded.

It is a plain static web app (HTML, canvas, Web Audio). There is no build step and no
dependencies. On an iPhone, open it in Safari and use Share, then "Add to Home Screen",
to get a full-screen icon that also works offline.

## Run it locally

```bash
python -m http.server 8765
```

Then open http://localhost:8765. It has to be served over HTTP; opening `index.html`
directly from disk will not load the scripts.

## How it plays

- Drag left and right to aim, let go to slide the drink at a fixed speed.
- Two matching drinks merge into the next drink on the ladder (shown along the top).
- Making the drink on the current order ticket serves it: it leaves the bar and pays out.
- A stage is five orders, each for a bigger drink.
- If drinks sit past the dashed line for three seconds, the round ends. Coins are kept.

## Layout

| Path | What it is |
|------|------------|
| `index.html` | Page shell, menus and styles |
| `js/main.js` | Game loop, orders, input, drawing, effects |
| `js/physics.js` | Circle physics for the drinks on the table |
| `js/drinks.js` | The drink ladder and the vector art for each drink |
| `js/stages.js` | Stage themes: orders, backdrop, table colours, song |
| `js/audio.js` | Synthesised sound effects and music |
| `sw.js`, `manifest.webmanifest`, `icons/` | Home-screen install and offline support |
| `assets/art.json` | Lists PNGs that replace the built-in drink drawings |
| `docs/IMAGE_PROMPTS.md` | Prompts for generating swap-in art |
| `tools/icon.html` | Renders the app icon from the game's own art |

## Tuning

- Drink sizes: `DRINKS` in `js/drinks.js`.
- Table length, the "full" line and launch speed: the constants at the top of `js/main.js`.
- Orders and payouts per stage: `STAGES` in `js/stages.js`.
- What gets dealt: `deal()` in `js/main.js`.

## Regenerating the icons

With the local server running:

```bash
msedge --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=512,512 --screenshot=icons/icon-512.png "http://localhost:8765/tools/icon.html?s=512"
```

Repeat with 192 and 180 (`apple-touch-icon.png`).

## Status

Stage 1 (New York Nights) is playable. Four more stages, and something to spend coins
on, are planned.
