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
- A freshly slid drink hits like a heavy puck, so an off-centre hit knocks others aside.
- Obstacles (a cocktail shaker, a candle lantern, an ice bucket) sit on the bar from
  level 2 on. They never move and drinks bounce off them, so they block lanes and
  take up room.
- Shake (three per level) jolts every drink toward you and sideways. They settle in a
  new arrangement, which is the way to free a glass stuck between two others.
- If a drink comes to rest past the dashed line and stays there for three seconds, the
  level ends. Coins are kept, and you retry the same level.

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
| `assets/art.json` | Lists the images in use: drinks, obstacles, stage backdrop |
| `assets/drinks/`, `assets/stages/` | Generated drink art (512 px) and the stage backdrop |
| `docs/IMAGE_PROMPTS.md` | Prompts for generating swap-in art |
| `tools/icon.html` | Renders the app icon from the game's own art |

## Tuning

- Drink sizes: `DRINKS` in `js/drinks.js`.
- Table length and launch speed: the constants at the top of `js/main.js`.
- Levels per stage (order lists, where the "full" line sits, obstacles, shakes): `STAGES` in `js/stages.js`.
- Obstacle sizes: `PROPS` in `js/drinks.js`. Leave gaps between obstacles and walls either
  wide enough for the level's biggest drink or closed; a narrow gap traps drinks.
- Coins paid per drink: `COIN` in `js/stages.js`.
- What gets dealt: `deal()` in `js/main.js`.

## Regenerating the icons

With the local server running:

```bash
msedge --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=512,512 --screenshot=icons/icon-512.png "http://localhost:8765/tools/icon.html?s=512"
```

Repeat with 192 and 180 (`apple-touch-icon.png`).

## Status

Stage 1 (New York Nights) is playable with five levels. Four more stages, and something
to spend coins on, are planned.

For testing, the page exposes `window.__topshelf`. `startLevel(n)`, `launchAt(x)`,
`shake()` and `tick(1/60)` let a script play whole levels instantly.
