// GitHub contribution calendar, scraped from the public contributions page
// (no token needed) and rendered as a block-character grid.

const USER = 'andrewhall1124';
const URL = `https://github.com/users/${USER}/contributions`;
const CACHE_MS = 60 * 60 * 1000;
const LEVEL_CHARS = ['· ', '░░', '▒▒', '▓▓', '██']; // two chars per day so cells are square
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type Contributions = {
	months: string;
	rows: string[];
	total: number | null;
	legend: string;
};

type Day = { date: string; level: number };

let cache: { at: number; value: Contributions | null } | null = null;

export async function fetchContributions(): Promise<Contributions | null> {
	if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
	let value: Contributions | null = null;
	try {
		const res = await fetch(URL, { headers: { Accept: 'text/html' } });
		if (res.ok) value = render(parse(await res.text()));
	} catch (err) {
		console.error('contributions fetch failed', err);
	}
	cache = { at: Date.now(), value };
	return value;
}

function parse(html: string): { days: Day[]; total: number | null } {
	const days: Day[] = [];
	const cell = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"[^>]*>/g;
	for (const m of html.matchAll(cell)) days.push({ date: m[1], level: Number(m[2]) });
	days.sort((a, b) => a.date.localeCompare(b.date));
	const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/);
	const total = totalMatch ? Number(totalMatch[1].replace(/,/g, '')) : null;
	return { days, total };
}

// Columns are weeks (Sunday first), rows are weekdays, one cell per day.
function render({ days, total }: { days: Day[]; total: number | null }): Contributions {
	if (days.length === 0) return { months: '', rows: [], total, legend: '' };
	const first = new Date(days[0].date + 'T00:00:00Z');
	const firstSunday = new Date(first);
	firstSunday.setUTCDate(first.getUTCDate() - first.getUTCDay());
	const weekOf = (date: string) => {
		const d = new Date(date + 'T00:00:00Z');
		return Math.floor((d.getTime() - firstSunday.getTime()) / (7 * 86400000));
	};
	const weeks = weekOf(days[days.length - 1].date) + 1;
	const grid: string[][] = Array.from({ length: 7 }, () => Array(weeks).fill('  '));
	const monthAtWeek: (number | null)[] = Array(weeks).fill(null);
	for (const day of days) {
		const d = new Date(day.date + 'T00:00:00Z');
		const w = weekOf(day.date);
		grid[d.getUTCDay()][w] = LEVEL_CHARS[day.level] ?? LEVEL_CHARS[0];
		if (d.getUTCDate() <= 7 && monthAtWeek[w] === null) monthAtWeek[w] = d.getUTCMonth();
	}
	// Month labels: print the name at the first week of each month if it fits.
	let months = '';
	for (let w = 0; w < weeks; w++) {
		const m = monthAtWeek[w];
		if (m !== null && months.length <= w * 2 && w * 2 + 3 <= weeks * 2) {
			months = months.padEnd(w * 2) + MONTHS[m];
		}
	}
	return {
		months: months.padEnd(weeks * 2),
		rows: grid.map((r) => r.join('')),
		total,
		legend: `less ${LEVEL_CHARS.map((c) => c.trim() || '·').join(' ')} more`
	};
}
