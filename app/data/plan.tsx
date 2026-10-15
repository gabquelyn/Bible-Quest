/**
 * A "whole Bible in a year" plan, balanced by verses.
 *
 * Chapters are laid out in canonical order and split into 365 consecutive days of roughly
 * equal reading load. Load is measured in verses (plus a small per-chapter overhead), so
 * a day in Numbers 7 or Psalm 119 isn't the same size as a day in Obadiah or Psalms 120-134.
 * Days always contain whole chapters.
 *
 * The plan day is the day of the year (Jan 1 = day 1), so everyone in your group reads
 * the same passage on the same date.
 */

/** Verse count of every chapter, per book (KJV/ESV-style versification). */
const BOOKS: Array<[name: string, verses: number[]]> = [
  ["Genesis", [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26]],
  ["Exodus", [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38]],
  ["Leviticus", [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34]],
  ["Numbers", [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13]],
  ["Deuteronomy", [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12]],
  ["Joshua", [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33]],
  ["Judges", [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25]],
  ["Ruth", [22,23,18,22]],
  ["1 Samuel", [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13]],
  ["2 Samuel", [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25]],
  ["1 Kings", [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53]],
  ["2 Kings", [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30]],
  ["1 Chronicles", [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30]],
  ["2 Chronicles", [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23]],
  ["Ezra", [11,70,13,24,17,22,28,36,15,44]],
  ["Nehemiah", [11,20,32,23,19,19,73,18,38,39,36,47,31]],
  ["Esther", [22,23,15,17,14,14,10,17,32,3]],
  ["Job", [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17]],
  ["Psalms", [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6]],
  ["Proverbs", [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31]],
  ["Ecclesiastes", [18,26,22,16,20,12,29,17,18,20,10,14]],
  ["Song of Solomon", [17,17,11,16,16,13,13,14]],
  ["Isaiah", [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24]],
  ["Jeremiah", [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34]],
  ["Lamentations", [22,22,66,22,22]],
  ["Ezekiel", [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35]],
  ["Daniel", [21,49,30,37,31,28,28,27,27,21,45,13]],
  ["Hosea", [11,23,5,19,15,11,16,14,17,15,12,14,16,9]],
  ["Joel", [20,32,21]],
  ["Amos", [15,16,15,13,27,14,17,14,15]],
  ["Obadiah", [21]],
  ["Jonah", [17,10,10,11]],
  ["Micah", [16,13,12,13,15,16,20]],
  ["Nahum", [15,13,19]],
  ["Habakkuk", [17,20,19]],
  ["Zephaniah", [18,15,20]],
  ["Haggai", [15,23]],
  ["Zechariah", [21,13,10,14,11,15,14,23,17,12,17,14,9,21]],
  ["Malachi", [14,17,18,6]],
  ["Matthew", [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20]],
  ["Mark", [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20]],
  ["Luke", [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53]],
  ["John", [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25]],
  ["Acts", [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31]],
  ["Romans", [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27]],
  ["1 Corinthians", [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24]],
  ["2 Corinthians", [24,17,18,18,21,18,16,24,15,18,33,21,14]],
  ["Galatians", [24,21,29,31,26,18]],
  ["Ephesians", [23,22,21,32,33,24]],
  ["Philippians", [30,30,21,23]],
  ["Colossians", [29,23,25,18]],
  ["1 Thessalonians", [10,20,13,18,28]],
  ["2 Thessalonians", [12,17,18]],
  ["1 Timothy", [20,15,16,16,25,21]],
  ["2 Timothy", [18,26,17,22]],
  ["Titus", [16,15,15]],
  ["Philemon", [25]],
  ["Hebrews", [14,18,19,16,14,20,28,13,28,39,40,29,25]],
  ["James", [27,26,18,17,20]],
  ["1 Peter", [25,25,22,19,14]],
  ["2 Peter", [21,22,18]],
  ["1 John", [10,29,24,21,21]],
  ["2 John", [13]],
  ["3 John", [14]],
  ["Jude", [25]],
  ["Revelation", [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21]],
];

export interface Chapter {
  /** Unique, stable id such as "Genesis 1" (also the label). Used as the key in saved progress. */
  id: string;
  book: string;
  chapter: number;
  verses: number;
}

const ALL_CHAPTERS: Chapter[] = BOOKS.flatMap(([book, verses]) =>
  verses.map((count, i) => ({
    id: `${book} ${i + 1}`,
    book,
    chapter: i + 1,
    verses: count,
  })),
);

export const TOTAL_CHAPTERS = ALL_CHAPTERS.length;
export const TOTAL_VERSES = ALL_CHAPTERS.reduce((sum, c) => sum + c.verses, 0);
export const PLAN_DAYS = 365;

/**
 * Each chapter costs its verse count plus this flat overhead, which stands in for the
 * effort of starting a new chapter. It stops runs of tiny chapters (Psalms 120-134)
 * from piling 15+ chapters into one day. Set to 0 for a pure verse-count split.
 */
const CHAPTER_OVERHEAD = 10;

/* ---------- Dates ---------- */

/** Local "YYYY-MM-DD" key (deliberately not toISOString, which is UTC and can be off by a day). */
export function toDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Day of the year (1-366), clamped to the 365-day plan. */
export function getPlanDay(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.round((current - start) / 86_400_000) + 1;
  return Math.min(dayOfYear, PLAN_DAYS);
}

/* ---------- Plan ---------- */

/**
 * DAY_BOUNDS[d] is the index of the first chapter of plan day d + 1, so plan day `n`
 * covers ALL_CHAPTERS.slice(DAY_BOUNDS[n - 1], DAY_BOUNDS[n]). Built once at load.
 *
 * For each day we aim for an even share of the total weight, then cut at the chapter
 * boundary closest to that target. Because every cut is measured against the running
 * total (not the previous cut), errors never accumulate. Every day keeps at least one
 * chapter, and enough chapters are left for the remaining days.
 */
function buildDayBounds(): number[] {
  const n = ALL_CHAPTERS.length;

  // cumulative[i] = total weight of the first i chapters
  const cumulative: number[] = [0];
  for (const c of ALL_CHAPTERS) {
    cumulative.push(cumulative[cumulative.length - 1] + c.verses + CHAPTER_OVERHEAD);
  }
  const totalWeight = cumulative[n];

  const bounds: number[] = [0];
  for (let day = 1; day < PLAN_DAYS; day++) {
    const target = (day * totalWeight) / PLAN_DAYS;
    const min = bounds[day - 1] + 1; // at least one chapter today
    const max = n - (PLAN_DAYS - day); // leave one chapter for each remaining day

    let cut = min;
    while (
      cut < max &&
      Math.abs(cumulative[cut + 1] - target) <= Math.abs(cumulative[cut] - target)
    ) {
      cut++;
    }
    bounds.push(cut);
  }
  bounds.push(n);
  return bounds;
}

const DAY_BOUNDS = buildDayBounds();

export function getChaptersForPlanDay(day: number): Chapter[] {
  const d = Math.min(Math.max(Math.trunc(day), 1), PLAN_DAYS);
  return ALL_CHAPTERS.slice(DAY_BOUNDS[d - 1], DAY_BOUNDS[d]);
}

/** Total verses in a run of chapters, handy for showing "42 verses today". */
export function countVerses(chapters: Chapter[]): number {
  return chapters.reduce((sum, c) => sum + c.verses, 0);
}

/** "Genesis 1–3 · Exodus 1" style label for a run of chapters. */
export function formatPassage(chapters: Chapter[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < chapters.length) {
    let j = i;
    while (j + 1 < chapters.length && chapters[j + 1].book === chapters[i].book) j++;
    const { book } = chapters[i];
    parts.push(
      i === j ? `${book} ${chapters[i].chapter}` : `${book} ${chapters[i].chapter}–${chapters[j].chapter}`,
    );
    i = j + 1;
  }
  return parts.join(" · ");
}

export interface DayReading {
  planDay: number;
  chapters: Chapter[];
  passage: string;
  verses: number;
}

export function getReadingForDate(date: Date): DayReading {
  const planDay = getPlanDay(date);
  const chapters = getChaptersForPlanDay(planDay);
  return { planDay, chapters, passage: formatPassage(chapters), verses: countVerses(chapters) };
}