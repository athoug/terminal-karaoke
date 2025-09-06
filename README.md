# Terminal Karaoke

Make your terminal “sing” by printing LRC-timed lyrics in sync with your song—styled with colors, a typewriter effect, optional beat pulse, and a fun finale animation (emoji rain or fireworks).

> ⚠️ You must supply your own `.lrc` file for the song (timestamps + lyrics). Do not commit copyrighted lyrics to the repo.
> <br>

### ✨ Features

- Read standard `.lrc` files (supports multiple timestamps per line).
- Typewriter effect per character (configurable or instant).
- Speed control (play faster/slower without editing the LRC).
- Global offset nudge to line up with your audio.
- Optional beat pulse indicator (requires a BPM).
- Finale animation: `rain` (emoji rain) or `fireworks` after the last line.
- Clean terminal UX: hides cursor, clears screen, restores on exit.
  <br>

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

<br>

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

<br>

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

<br>

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

<br>

### 🔧 What each option really does

- `--speed`
  Scales all timestamps. `2.0` plays in half the time (faster); `0.5` plays twice as long (slower).Internally, each lyric is scheduled at `planned = t0 + offset + (timeMs / speed)`.

- `--typing`
  Milliseconds per character for the typewriter effect.
  Set `0` for instant full-line output.

- `--offsetMs`
  Shifts all lyrics in milliseconds to line up with your audio.
  Positive = delay (later). Negative = advance (earlier).
  If an event lands in the past (because of a negative offset), it prints immediately when its turn comes.

- `--finale`
  After the last lyric, show either emoji rain (`rain`) or fireworks (`fireworks`).
  Use none to skip.

- `--bpm` / `--pulse`
  Displays a small pulse dot in the top-right corner at the given BPM.
  For now, you must set `--bpm` to see it; `--pulse` is a no-op without `--bpm`.

<br>

### 🧪 Tips for matching the song perfectly

1. Use an LRC that matches the exact audio version you’ll play in your video.
2. If everything is uniformly early/late, adjust `--offsetMs` in small steps (±20–120 ms) until it “locks.”
3. If your terminal is narrow, lines may wrap; consider widening the window or breaking long lines in your LRC.
4. VS Code Terminal, iTerm2, Windows Terminal all handle ANSI color/position codes well.

<br>

### 🧩 How it works (in simple terms)

- The script reads your .lrc and builds a list of events `{ timeMs, text }`.
- For each event, it calculates when to print it based on:
  - the app start time,
  - your `--offsetMs`,
  - your `--speed`.
- At that moment, it prints `♪` and then types the line (character by character).
- On the last line, it adds a fun rainbow effect.
- After the final timestamp, it plays the finale animation (if enabled).

<br>

### 📝 Creating your own LRC

If you can’t find an LRC for your song, it’s easy to make:

1. Play the song and pause at the start of each line.
2. Note the time (minutes:seconds.milliseconds).
3. Write a line like `[01:12.40] Your lyric text`.
4. Repeat for each line.

<br>

### 🐛 Troubleshooting

- “Nothing prints for a while.”
  Your first line’s timestamp is several seconds into the song—normal. If you want immediate feedback while testing, temporarily change your first time to `[00:00.10]`.

- Pulse doesn’t show up.
  You must pass `--bpm=<number>` (e.g., `--bpm=92`). The `--pulse` flag alone won’t display anything.

- Weird characters / cursor not restored.
  If you killed the process mid-animation, the cursor might stay hidden. Run `reset` in your terminal or re-run the script and exit with `Ctrl+C` once it’s idle.

- Colors not showing.
  Make sure your terminal supports ANSI colors (most modern terminals do). Try a different terminal if needed.
