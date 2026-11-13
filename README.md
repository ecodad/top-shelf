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
- Whenever the drink on the current order ticket is standing on the bar, it is served:
  it leaves the bar and pays out. It does not matter whether you just made it or made
  it earlier, so it pays to build the "On deck" drink ahead of time.
- A stage has five levels. Each level is a list of orders. Early levels ask for small
  drinks; later levels and stages add the bigger ones and leave less room on the bar.
- Regular deals are always smaller than the smallest drink on the level's order list.
  About one slide in twenty-two is a bigger drink instead.
- The bar is level and drinks behave like pool balls without spin: a slid drink travels
  in a straight line, slows steadily, and trades momentum with whatever it hits. Bigger
  drinks are somewhat heavier. Nothing pulls drinks toward the far end.
- The one exception is the launch area behind the dashed line. It slopes gently back
  onto the bar, like a ball return, so a drink that bounces back toward you is not
  stranded there.
- There are two stages so far, New York Nights and Las Vegas Strip, picked with the
  arrows on the launch screen. A stage opens when the last level of the one before it
  is cleared. Adding `?unlock` to the address opens everything, for trying things out.
- Each stage has its own backdrop, table, score, obstacles and one rule of its own.
  Las Vegas has a roulette wheel that spins and flings drinks sideways, and one gold
  High Roller ticket per level that pays triple if it is served within its allowance
  of slides (and the normal amount if not).
- Obstacles (in New York: a cocktail shaker, a candle lantern, an ice bucket) sit on the
  bar from level 2 on. They never move and drinks bounce off them, so they block lanes and
  take up room.
- Shake (three per level) sends every drink off in a random direction, like a pool
  break. It is the way to free a glass stuck between two others.
- If a drink is held past the dashed line by the drinks in front of it for three
  seconds, the bar is full and the level ends. Coins are kept, and you retry the same level.

## Layout

| Path | What it is |
|------|------------|
| `index.html` | Page shell, menus and styles |
| `js/main.js` | Game loop, orders, input, drawing, effects |
| `js/physics.js` | Circle physics for the drinks on the table |
| `js/drinks.js` | The drink ladder and the vector art for each drink |
| `js/stages.js` | Stage themes: orders, backdrop, table colours, song |
| `js/audio.js` | Synthesised sound effects and music |
| `js/build.js` | Build date and time shown on the launch screen; written by `tools/stamp.py` |
| `sw.js`, `manifest.webmanifest`, `icons/` | Home-screen install and offline support |
| `assets/art.json` | Lists the images in use: drinks, obstacles, stage backdrop |
| `assets/drinks/`, `assets/props/`, `assets/stages/` | Generated drink and obstacle art (512 px) and the stage backdrop |
| `docs/IMAGE_PROMPTS.md` | Prompts for generating swap-in art |
| `tools/icon.html` | Renders the app icon from the game's own art |

## Tuning

- Drink sizes: `DRINKS` in `js/drinks.js`.
- Table length, and the feel of the bar (`PHYS`: slide speed, friction, bounciness, how
  much weight grows with size, launch-area slope): the constants at the top of `js/main.js`.
- Levels per stage (order lists, where the "full" line sits, obstacles, shakes, the High
  Roller order and its slide allowance, the range of drinks dealt): `STAGES` in `js/stages.js`.
- A stage's look and sound (table colours, felt, marquee lights, song, casino ambience):
  the same `STAGES` entries.
- Obstacle sizes: `PROPS` in `js/drinks.js`. Leave gaps between obstacles and walls either
  wide enough for the level's biggest drink or closed; a narrow gap traps drinks.
- Coins paid per drink: `COIN` in `js/stages.js`.
- What gets dealt: `deal()` in `js/main.js`.

## Build stamp

The launch screen shows the date and time of the build. `tools/hooks/pre-commit` runs
`tools/stamp.py` on every commit, so the stamp is the commit time. On a fresh clone,
turn the hook on once:

```bash
git config core.hooksPath tools/hooks
```

## Regenerating the icons

With the local server running:

```bash
msedge --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=512,512 --screenshot=icons/icon-512.png "http://localhost:8765/tools/icon.html?s=512"
```

Repeat with 192 and 180 (`apple-touch-icon.png`).

## Status

New York Nights and Las Vegas Strip are playable, five levels each. Three more stages,
and something to spend coins on, are planned.

For testing, the page exposes `window.__topshelf`. `setStage(i)`, `startLevel(n)`, `launchAt(x)`,
`shake()` and `tick(1/60)` let a script play whole levels instantly.
