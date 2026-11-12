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
