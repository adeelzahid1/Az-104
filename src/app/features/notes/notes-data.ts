/** [English, Roman Urdu]. */
type Pair = [string, string];

/** h heading, p paragraph, e example, t trap, w where in the portal, l list, q self-check. */
export type RawBlock =
  | { k: 'h' | 'p' | 'e' | 't' | 'w'; t: Pair }
  | { k: 'l'; items: Pair[] }
  | { k: 'q'; t: Pair; a: Pair };

/** The blocks of every section of a domain, by section id. */
export type NotesFile = Record<string, RawBlock[]>;

export interface Block {
  kind: 'p' | 'e' | 't' | 'w' | 'l';
  text: string;
  items: string[];
}

/** A heading with everything under it. The first part of a section has no heading. */
export interface Part {
  title: string;
  blocks: Block[];
}

export interface Note {
  parts: Part[];
  checks: { question: string; answer: string }[];
  minutes: number;
}

export interface NoteHit {
  /** Index of the part, for the link. */
  part: number;
  title: string;
  excerpt: string;
}

const WORDS_PER_MINUTE = 160;
const EXCERPT = 170;

const plain = (s: string) => s.replace(/\*\*|`|\*(?=\w)|(?<=\w)\*/g, '');

/** Puts the notes of a section in one language (0 = English, 1 = Roman Urdu). */
export function toNote(raw: readonly RawBlock[], lang: 0 | 1): Note {
  const parts: Part[] = [{ title: '', blocks: [] }];
  const checks: Note['checks'] = [];
  let words = 0;
  const say = (p: Pair) => {
    words += p[lang].split(/\s+/).length;
    return p[lang];
  };
  for (const b of raw) {
    if (b.k === 'h') parts.push({ title: say(b.t), blocks: [] });
    else if (b.k === 'q') checks.push({ question: say(b.t), answer: say(b.a) });
    else {
      const block: Block =
        b.k === 'l' ? { kind: 'l', text: '', items: b.items.map(say) } : { kind: b.k, text: say(b.t), items: [] };
      parts[parts.length - 1].blocks.push(block);
    }
  }
  return { parts, checks, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) };
}

/** Position of the first word that starts with the search word, or -1: "soft" isn't found in "Microsoft". */
function wordAt(text: string, word: string): number {
  const t = text.toLowerCase();
  for (let i = t.indexOf(word); i >= 0; i = t.indexOf(word, i + 1)) {
    if (i === 0 || !/[\p{L}\p{N}]/u.test(t[i - 1]) || !/[\p{L}\p{N}]/u.test(word[0])) return i;
  }
  return -1;
}

/** The parts of a note that contain every word of the search, with a piece of the matching text. */
export function searchNote(note: Note, term: string): NoteHit[] {
  const words = plain(term).toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits: NoteHit[] = [];
  note.parts.forEach((p, part) => {
    const texts = p.blocks.flatMap((b) => [...b.items, b.text]).filter(Boolean).map(plain);
    const all = [p.title, ...texts].join(' ');
    if (!words.every((w) => wordAt(all, w) >= 0)) return;
    const count = (t: string) => words.filter((w) => wordAt(t, w) >= 0).length;
    const text = texts.reduce((best, t) => (count(t) > count(best) ? t : best), texts[0] ?? '');
    const found = words.map((w) => wordAt(text, w)).filter((i) => i >= 0);
    const at = found.length ? Math.max(0, Math.min(...found) - 60) : 0;
    const start = at ? text.indexOf(' ', at) + 1 : 0;
    hits.push({
      part,
      title: p.title,
      excerpt:
        (start ? '… ' : '') + text.slice(start, start + EXCERPT) + (start + EXCERPT < text.length ? ' …' : ''),
    });
  });
  return hits;
}
