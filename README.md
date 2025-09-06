# Terminal Karaoke

Make your terminal “sing” by printing LRC-timed lyrics in sync with your song—styled with colors, a typewriter effect, optional beat pulse, and a fun finale animation (emoji rain or fireworks).

> ⚠️ You must supply your own `.lrc` file for the song (timestamps + lyrics). Do not commit copyrighted lyrics to the repo.

### ✨ Features

- Read standard `.lrc` files (supports multiple timestamps per line).
- Typewriter effect per character (configurable or instant).
- Speed control (play faster/slower without editing the LRC).
- Global offset nudge to line up with your audio.
- Optional beat pulse indicator (requires a BPM).
- Finale animation: `rain` (emoji rain) or `fireworks` after the last line.
- Clean terminal UX: hides cursor, clears screen, restores on exit.

### 🛠️ Quick Start

1. Clone & install

````
git clone https://github.com/<you>/<repo>.git
cd <repo>
npm install

``` bash

2. Ensure ESM is enabled (because the script uses `import`):

Option A (recommended): set `"type": "module"` in package.json

``` json
{
  "name": "terminal-karaoke",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "chalk": "^5.3.0",
    "strip-ansi": "^7.1.0",
    "yargs": "^17.7.2"
  }
}
````

3. Run it

```bash
node index.js path/to/lyrics.lrc --typing=18 --finale=rain --bpm=92
```

### 🎼 LRC Format

This tool expects regular LRC lines like:

```scss
[mm:ss.xx] Your lyric line

```

Example (structure only—use your own words):

```scss
[00:05.20] First line of the verse
[00:10.80] Second line of the verse
[00:14.50] Third line of the verse
```

### 🚀 Usage

```
Usage: index.js <lrcFile>
Options:
  --speed     Playback speed multiplier            [number] [default: 1.0]
  --typing    Per-character delay in ms (0=instant) [number] [default: 18]
  --offsetMs  Shift all times by ms (+delay / –advance)
                                                   [number] [default: 0]
  --finale    Ending animation: rain | fireworks | none
                                                   [default: "rain"]
  --bpm       Show a beat pulse indicator (top right) at this BPM
                                                   [number] [default: 0]
  --pulse     (boolean flag; for now you must also set --bpm to see the pulse)
  -h, --help  Show help

```

#### Examples

Basic (just type the lyrics):

```bash
node index.js ./lyrics.lrc
```

Make typing faster and add fireworks at the end:

```bash
node index.js ./lyrics.lrc --typing=10 --finale=fireworks
```

Song feels a bit late? Nudge everything earlier by 120 ms:

```bash
node index.js ./lyrics.lrc --offsetMs=-120
```

No finale animation:

```bash
node index.js ./lyrics.lrc --finale=none

```

### 🔧 What each option really does

- `--speed`
  Scales all timestamps. 2.0 plays in half the time (faster); 0.5 plays twice as long (slower).Internally, each lyric is scheduled at planned = t0 + offset + (timeMs / speed).

- `--typing`
  Milliseconds per character for the typewriter effect.
  Set 0 for instant full-line output.

- `--offsetMs`
  Shifts all lyrics in milliseconds to line up with your audio.
  Positive = delay (later). Negative = advance (earlier).
  If an event lands in the past (because of a negative offset), it prints immediately when its turn comes.

- `--finale`
  After the last lyric, show either emoji rain (rain) or fireworks (fireworks).
  Use none to skip.

- `--bpm` / `--pulse`
  Displays a small pulse dot in the top-right corner at the given BPM.
  For now, you must set --bpm to see it; --pulse is a no-op without --bpm.
