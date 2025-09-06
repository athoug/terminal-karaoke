#!/usr/bin/env node
import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import stripAnsi from "strip-ansi";

// ===== CLI =====
const argv = yargs(hideBin(process.argv))
	.usage(
		"Usage: $0 <lrcFile> [--speed=1.0] [--typing=18] [--offsetMs=0] [--finale=rain|fireworks|none] [--bpm=0] [--pulse]"
	)
	.demandCommand(1)
	.number(["speed", "typing", "offsetMs", "bpm"])
	.boolean(["pulse"])
	.default({
		speed: 1.0,
		typing: 18,
		offsetMs: 0,
		finale: "rain",
		bpm: 0,
		pulse: false,
	})
	.help().argv;

// ===== TERMINAL UTILS =====
const ESC = String.fromCharCode(27);
const hideCursor = () => process.stdout.write(`${ESC}[?25l`);
const showCursor = () => process.stdout.write(`${ESC}[?25h`);
const clearScreen = () => process.stdout.write("\x1Bc");
const move = (row, col) => process.stdout.write(`${ESC}[${row};${col}H`);
const save = () => process.stdout.write(`${ESC}[s`);
const restore = () => process.stdout.write(`${ESC}[u`);

process.on("exit", () => showCursor());
process.on("SIGINT", () => {
	showCursor();
	process.exit(0);
});

// ===== READ LRC =====
const lrcPath = argv._[0];
if (!fs.existsSync(lrcPath)) {
	console.error(chalk.red(`File not found: ${lrcPath}`));
	process.exit(1);
}
const raw = fs.readFileSync(lrcPath, "utf8");

// ===== PARSE LRC =====
function parseLrc(text) {
	const events = [];
	const timeTag = /\[(\d{2}):(\d{2})(?:[.,](\d{1,3}))?\]/g; // accept mm:ss.xxx

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;

		const allTags = [...line.matchAll(timeTag)];
		if (allTags.length === 0) continue;

		const lyric = line.replace(timeTag, "").trim();
		if (!lyric) continue;

		for (const m of allTags) {
			const mm = Number(m[1]);
			const ss = Number(m[2]);
			const frac = m[3] || "";
			let fracMs = 0;
			if (frac.length === 1) fracMs = Number(frac) * 100;
			else if (frac.length === 2) fracMs = Number(frac) * 10;
			else if (frac.length >= 3) fracMs = Number(frac.slice(0, 3));
			const ms = mm * 60000 + ss * 1000 + fracMs;
			events.push({ timeMs: ms, text: lyric });
		}
	}
	events.sort((a, b) => a.timeMs - b.timeMs);
	return events;
}

const events = parseLrc(raw);
if (events.length === 0) {
	console.warn(chalk.yellow("No timed lyrics found."));
	process.exit(0);
}

const lastTime = events[events.length - 1].timeMs;

// ===== SETTINGS =====
const speed = argv.speed > 0 ? argv.speed : 1.0;
const offset = Number.isFinite(argv.offsetMs) ? argv.offsetMs : 0;
const typingDelay = Math.max(0, argv.typing | 0);

// ===== DISPLAY INTRO =====
hideCursor();
clearScreen();
console.log(chalk.gray("Terminal Karaoke — words only"));
console.log(chalk.gray("Ctrl+C to exit\n"));

// ===== SCHEDULER =====
const t0 = Date.now();
function schedule(fn, targetMs) {
	const planned = t0 + offset + targetMs / speed;
	const delay = Math.max(0, planned - Date.now());
	setTimeout(fn, delay);
}

// ===== TYPEWRITER =====
function typeLine(text, perCharDelay) {
	if (perCharDelay === 0) {
		process.stdout.write(String(text) + "\n");
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		const chars = [...String(text)];
		let i = 0;
		const timer = setInterval(() => {
			process.stdout.write(chars[i]);
			i++;
			if (i >= chars.length) {
				clearInterval(timer);
				process.stdout.write("\n");
				resolve();
			}
		}, perCharDelay);
	});
}

// ===== RAINBOW (last line) =====
function rainbowCharChunks(text) {
	const palette = [
		(s) => chalk.redBright(s),
		(s) => chalk.yellowBright(s),
		(s) => chalk.greenBright(s),
		(s) => chalk.cyanBright(s),
		(s) => chalk.blueBright(s),
		(s) => chalk.magentaBright(s),
	];
	return [...String(text)].map((ch, i) => palette[i % palette.length](ch));
}

function typeChunks(chunks, perCharDelay) {
	if (perCharDelay === 0) {
		process.stdout.write(chunks.join("") + "\n");
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		let i = 0;
		const timer = setInterval(() => {
			process.stdout.write(chunks[i]);
			i++;
			if (i >= chunks.length) {
				clearInterval(timer);
				process.stdout.write("\n");
				resolve();
			}
		}, perCharDelay);
	});
}

// ===== BEAT PULSE =====
let pulseTimer = null;
if (argv.pulse || argv.bpm > 0) {
	const bpm = argv.bpm > 0 ? argv.bpm : 0;
	if (bpm > 0) {
		const interval = 60000 / bpm / argv.speed;
		pulseTimer = setInterval(() => {
			save();
			const cols = process.stdout.columns || 80;
			move(1, Math.max(1, cols - 2));
			process.stdout.write(chalk.magentaBright("●"));
			setTimeout(() => {
				move(1, Math.max(1, cols - 2));
				process.stdout.write(" ");
				restore();
			}, 80);
		}, interval);
	}
}
schedule(() => {
	if (pulseTimer) clearInterval(pulseTimer);
}, lastTime + 1500);

// ===== SCHEDULE LYRICS =====
for (let i = 0; i < events.length; i++) {
	const { timeMs, text } = events[i];
	schedule(async () => {
		process.stdout.write(chalk.dim("\n♪ "));
		const isLast = i === events.length - 1;
		if (isLast) {
			const chunks = rainbowCharChunks(text);
			await typeChunks(chunks, typingDelay);
		} else {
			await typeLine(chalk.whiteBright(stripAnsi(text)), typingDelay);
		}
	}, timeMs);
}

// ===== FINALES =====
function emojiRain(durationMs = 2000) {
	const emojis = [
		"✨",
		"💫",
		"🎉",
		"🎊",
		"⭐",
		"🌟",
		"💥",
		"🪄",
		"🔥",
		"🎶",
		"💖",
	];
	const cols = process.stdout.columns || 80;
	const rows = process.stdout.rows || 24;
	const drops = Math.min(30, Math.floor(cols / 2));
	const active = [];
	const start = Date.now();

	function tick() {
		save();
		while (active.length < drops) {
			active.push({
				col: 2 + Math.floor(Math.random() * Math.max(1, cols - 2)),
				row: 3,
				emoji: emojis[Math.floor(Math.random() * emojis.length)],
			});
		}
		active.forEach((d) => {
			move(d.row, d.col);
			process.stdout.write(chalk.yellowBright(d.emoji));
			d.row += 1 + (Math.random() < 0.2 ? 1 : 0);
		});
		for (let i = active.length - 1; i >= 0; i--) {
			if (active[i].row > rows) active.splice(i, 1);
		}
		restore();
		if (Date.now() - start < durationMs) {
			setTimeout(tick, 50);
		}
	}
	tick();
}

function fireworks(durationMs = 2200) {
	const cols = process.stdout.columns || 80;
	const rows = process.stdout.rows || 24;
	const colors = [
		chalk.redBright,
		chalk.yellowBright,
		chalk.cyanBright,
		chalk.greenBright,
		chalk.magentaBright,
		chalk.whiteBright,
	];

	function burst() {
		const cx = 3 + Math.floor(Math.random() * Math.max(1, rows - 6));
		const cy = 5 + Math.floor(Math.random() * Math.max(1, cols - 10));
		const color = colors[Math.floor(Math.random() * colors.length)];

		const frames = [
			[{ r: 0, c: 0, ch: "." }],
			[
				{ r: -1, c: 0, ch: "o" },
				{ r: 1, c: 0, ch: "o" },
				{ r: 0, c: -2, ch: "o" },
				{ r: 0, c: 2, ch: "o" },
			],
			[
				{ r: -2, c: 0, ch: "O" },
				{ r: 2, c: 0, ch: "O" },
				{ r: 0, c: -4, ch: "O" },
				{ r: 0, c: 4, ch: "O" },
				{ r: -1, c: -2, ch: "O" },
				{ r: -1, c: 2, ch: "O" },
				{ r: 1, c: -2, ch: "O" },
				{ r: 1, c: 2, ch: "O" },
			],
			[
				{ r: -3, c: 0, ch: "✦" },
				{ r: 3, c: 0, ch: "✦" },
				{ r: 0, c: -6, ch: "✦" },
				{ r: 0, c: 6, ch: "✦" },
				{ r: -2, c: -3, ch: "✦" },
				{ r: -2, c: 3, ch: "✦" },
				{ r: 2, c: -3, ch: "✦" },
				{ r: 2, c: 3, ch: "✦" },
			],
		];

		let fi = 0;
		const draw = () => {
			save();
			frames[fi].forEach((p) => {
				const rr = cx + p.r,
					cc = cy + p.c;
				if (rr > 2 && rr < rows && cc > 1 && cc < cols) {
					move(rr, cc);
					process.stdout.write(color(p.ch));
				}
			});
			restore();
			fi++;
			if (fi < frames.length) setTimeout(draw, 90);
		};
		draw();
	}

	const timer = setInterval(burst, 130);
	setTimeout(() => clearInterval(timer), durationMs);
}

function scheduleFinale() {
	const finale = (argv.finale || "rain").toLowerCase();
	const when = lastTime + 1200;
	schedule(() => {
		if (finale === "rain") emojiRain(2000);
		else if (finale === "fireworks") fireworks(2200);
	}, when);
}
scheduleFinale();
