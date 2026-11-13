# Top Shelf: image prompts for swap-in art

The game ships with drinks drawn in code. Any drink can be replaced by a PNG: drop the
file in `assets/drinks/`, list it in `assets/art.json`, and the game uses it instead.
Nothing else needs to change. The game trims each image to its visible pixels and stands
it on the table automatically, so exact framing does not matter.

## What every drink image needs

- **One drink only**, whole glass visible, nothing cropped.
- **Transparent background** if your tool can do it (ChatGPT can). If it cannot, ask for a
  plain flat background in one solid colour and Claude can cut it out afterwards.
- **No table, no shadow on the ground, no text, no hands, no extra props.**
- **Same camera for all ten**: straight-on, tilted very slightly from above so you can
  just see into the top of the glass.
- **Square, 1024 x 1024**, PNG.
- Save as the file name given under each drink.

**Keeping the set consistent:** make all ten in one conversation. Paste the style block
first, generate drink 1, and when you like it say "use this exact art style, outline
weight and lighting for every drink that follows." If your tool takes a reference image,
attach drink 1 to each later request.

## Style block (paste at the start of every prompt)

```
Glossy cartoon game icon of a single cocktail, vector-illustration look with clean
shapes, a bold dark navy outline of even thickness, bright saturated colours, soft
cel shading with one crisp white highlight streak down the left side of the glass,
and a thin white sticker border around the whole silhouette. Straight-on view tilted
slightly from above so the oval rim of the glass is visible. The glass is centred,
fills most of the frame, and is fully in view. Transparent background. No table, no
ground shadow, no text, no logos, no hands, no other objects.
```

## The ten drinks

Order is smallest to largest. Bigger drinks should look grander and more decorated.

**1. Tequila Shot** - `tequila_shot.png`
```
[style block] The drink: a small tapered shot glass filled with golden tequila, a
white salt rim, and a bright green lime wedge perched on the rim.
```

**2. Whiskey Neat** - `whiskey_neat.png`
```
[style block] The drink: a short, wide cut-crystal tumbler with a thick glass base and
a diamond pattern cut into the lower half, holding two fingers of deep amber whiskey,
no ice, no garnish.
```

**3. Gin & Tonic** - `gin_tonic.png`
```
[style block] The drink: a large round balloon (copa) glass on a short stem, filled
with clear, faintly icy-blue sparkling gin and tonic, big square ice cubes, a few
bubbles, a lime wedge inside and a lime wheel on the rim.
```

**4. Mojito** - `mojito.png`
```
[style block] The drink: a tall straight highball glass of pale green mojito packed
with ice cubes, lime wedges and mint leaves, a generous mint sprig on top, a lime
wheel on the rim and a green-and-white striped straw.
```

**5. Cosmopolitan** - `cosmopolitan.png`
```
[style block] The drink: a classic V-shaped martini glass on a tall thin stem, filled
with vivid pink-red cosmopolitan, with a small orange twist on the rim.
```

**6. Margarita** - `margarita.png`
```
[style block] The drink: a wide stepped margarita glass on a stem, filled with
yellow-green lime margarita, a thick white salt rim and a lime wheel on the rim.
```

**7. Blue Hawaiian** - `blue_hawaiian.png`
```
[style block] The drink: a tall curvy hurricane glass on a short stem, filled with
bright tropical blue cocktail fading to lighter blue at the top, ice cubes, a
pineapple wedge and a red cherry on the rim, a red-and-yellow paper umbrella and a
striped straw.
```

**8. Pina Colada** - `pina_colada.png`
```
[style block] The drink: a big rounded goblet on a stem, filled with creamy
white-yellow pina colada with a fluffy froth top, a pineapple wedge with green
leaves on the rim, a red cherry on top and a red-and-white striped straw.
```

**9. Mai Tai** - `mai_tai.png`
```
[style block] The drink: a large, wide double old-fashioned glass filled with crushed
ice and a layered mai tai, dark rum red-brown at the top blending to orange and
golden yellow at the bottom, a big mint sprig, a lime wheel, a red cherry and a pink
paper umbrella.
```

**10. Scorpion Bowl** - `scorpion_bowl.png`
```
[style block] The drink: a very large, wide glass punch bowl on a low foot, filled
with coral-pink tropical punch and ice, orange slices floating on top, a small flame
burning in a lime shell at the centre, three long striped straws fanning out in pink,
yellow and blue, a red cherry and a paper umbrella. The biggest, most festive drink.
```

## Bar obstacles (optional)

Obstacles sit on the bar and never move; drinks bounce off them. They are drawn in code
now. To replace one, use the same style block and rules as the drinks, save into
`assets/props/`, and list it under `"props"` in `assets/art.json`.

**Cocktail shaker** - `shaker.png`
```
[style block] The object: a polished stainless-steel cobbler cocktail shaker with its
cap on, standing upright, with bright reflections. Not a drink; no glass.
```

**Candle lantern** - `lantern.png`
```
[style block] The object: a small brass table lantern with a glass chimney and a lit
candle glowing warm yellow inside, a ring handle on top. Not a drink.
```

**Ice bucket** - `bucket.png`
```
[style block] The object: a round stainless-steel ice bucket with ring handles, heaped
with ice cubes, with the neck of a green champagne bottle with gold foil sticking out
at an angle. Not a drink.
```

## Stage 1 backdrop (optional)

Portrait, 1170 x 2532 (or any 9:19.5 image). The game draws the bar top, the order
tickets and all the controls over it, so keep the middle and lower two thirds calm.

`assets/stages/nyc/backdrop.jpg`, listed under `"stages"` in `assets/art.json`
```
Stylised cartoon night-time view from a Manhattan rooftop bar, portrait orientation.
Deep navy sky fading to purple and a warm magenta glow at the horizon, a few stars,
a layered skyline of generic skyscraper silhouettes with small warm yellow lit
windows in the upper third of the image. The lower two thirds are a dark, softly
blurred rooftop terrace with out-of-focus party lights in pink, cyan and amber.
Flat vector look, rich colours, no people, no text, no signs, no real landmarks or
recognisable buildings.
```

## App icon (optional)

1024 x 1024, no transparency, no rounded corners (iOS rounds them itself).
```
App icon: a single glossy cartoon cosmopolitan in a martini glass, bold dark navy
outline, white sticker border, centred on a night-sky gradient from deep indigo at
the top to hot pink at the bottom with a soft white glow behind the glass. Simple,
bold, readable at small size. No text.
```

## Las Vegas stage

Four images, written for ChatGPT image generation. The gold High Roller ticket, the felt
table and the marquee lights are drawn in code. Obstacles go in `assets/props/` and the
backdrop in `assets/stages/vegas/`, both listed in `assets/art.json`.

### Before you start

- **Style reference:** attach `C:\sandbox\top-shelf\assets\drinks\tequila_shot.png` to the first obstacle request and say "match this art style exactly; it is a style reference only, not the subject." That is what kept the New York set consistent.
- **Obstacles:** square 1024 x 1024 PNG with a **transparent background**.
- **Backdrop:** portrait 1024 x 1536.
- **Drop folder:** save all four into `art-inbox/vegas/` in this repo (`C:\sandbox\top-shelf\art-inbox\vegas\`) with exactly these file names: `chips.png`, `dice.png`, `roulette.png`, `backdrop.png`. The folder is kept out of the published game, so full-size originals are fine there.

### Style block (paste at the start of the chips and dice prompts)

```
Glossy cartoon game icon, vector-illustration look with clean shapes, a bold dark navy
outline of even thickness, bright saturated colours, soft cel shading with one crisp
white highlight streak down the left side of the object, and a thin white sticker
border around the whole silhouette. Straight-on view tilted slightly from above so the
top surfaces are just visible. The object is centred, fills most of the frame and is
fully in view. Transparent background. No table, no ground shadow, no text, no logos,
no hands, no other objects, no glow or haze outside the sticker border.
```

### 1. Poker chip stack: `chips.png`

```
[style block] The object: a neat stack of six casino poker chips standing upright as a
short cylinder. The chips alternate red, blue and green, each with white stripe
inserts around its edge. The top chip's face is visible: red with a white ring and
white edge inserts. No numbers, no letters, no logos.
```

### 2. Pair of dice: `dice.png`

```
[style block] The object: two casino dice sitting together and touching, one slightly
in front of the other. Translucent ruby-red dice with rounded corners and white pips.
Any faces may show, but no numbers or letters. The two dice together fill most of the
frame.
```

### 3. Roulette wheel: `roulette.png`

This one is different. The game spins it, so it must be drawn **from directly above** as a perfect circle. Do not use the style block's "tilted from above" view.

```
A roulette wheel seen from directly above, a perfectly circular top-down view with no
perspective and no tilt, filling the frame edge to edge and centred. Glossy cartoon
vector-illustration look with clean shapes, a bold dark navy outline, bright saturated
colours and soft cel shading. A polished dark wood outer rim, a thin gold ring inside
it, then a ring of alternating red and black pockets with one single green pocket,
then a sloped dark wood inner cone, and a gold four-armed spindle at the exact centre.
One small white ball resting in a pocket. No numbers, no letters, no text, no logos.
Transparent background outside the circle. No table, no shadow, no hands, no glow.
```

If it comes back tilted or oval, tell it: "Redraw it as a flat, perfectly circular top-down view, like a clock face seen head-on."

### 4. Las Vegas backdrop: `backdrop.png`

Portrait, 1024 x 1536. The game draws the card table, the order tickets and the controls over this, so the middle and lower two thirds must stay dark and calm.

```
Stylised cartoon night-time view of a glittering casino boulevard, portrait
orientation. Deep indigo sky fading to magenta and warm orange at the horizon. In the
upper third only: a layered skyline of generic resort towers outlined in neon pink,
cyan, gold and violet, with rows of small lit windows, marquee light bulbs, and a few
tall palm tree silhouettes in front. The lower two thirds are a dark, softly blurred
casino terrace floor in deep purple and burgundy, with a few out-of-focus bokeh lights
in gold, pink and cyan near the top of that area and nothing else. Flat vector look,
rich colours. No people, no cars, no text, no signs with words, no logos, no real
buildings or recognisable landmarks.
```

If it adds words or a famous sign, tell it: "Remove all lettering and any real landmark; keep only abstract neon shapes."

## Turning the images on

Put the PNGs in `assets/drinks/` and list them in `assets/art.json`:

```json
{
  "sticker": true,
  "drinks": {
    "tequila_shot": "drinks/tequila_shot.png",
    "cosmopolitan": "drinks/cosmopolitan.png"
  }
}
```

- You can swap in one drink at a time; unlisted drinks keep the built-in drawing.
- `"sticker": true` adds the game's own white border. If your images already have a
  white border, set it to `false`.
- A drink that looks too small or too big can be nudged: use
  `{ "file": "drinks/mai_tai.png", "width": 1.15 }` instead of the plain file name.
