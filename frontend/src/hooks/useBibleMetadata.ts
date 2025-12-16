import bibleBooks from "@/data/bibleBooks.json";

export type Testament = "OT" | "NT";

export interface BibleBook {
  name: string;
  testament: Testament;
  number: number;
  chapters: number;
}

interface BibleMetadata {
  allBooks: string[];
  oldTestament: string[];
  newTestament: string[];
  bookToNumber: Record<string, number>;
  bookChapterCounts: Record<string, number>;
}

/**
 * Central source of truth for Bible book metadata.
 * Values are derived from the static JSON file and memoized per module.
 */
const books = bibleBooks as BibleBook[];

const allBooks = books.map((b) => b.name);
const oldTestament = books.filter((b) => b.testament === "OT").map((b) => b.name);
const newTestament = books.filter((b) => b.testament === "NT").map((b) => b.name);

const bookToNumber: Record<string, number> = {};
const bookChapterCounts: Record<string, number> = {};

for (const book of books) {
  bookToNumber[book.name] = book.number;
  bookChapterCounts[book.name] = book.chapters;
}

export function useBibleMetadata(): BibleMetadata {
  // Hook shape so it can be used consistently in components.
  return { allBooks, oldTestament, newTestament, bookToNumber, bookChapterCounts };
}
