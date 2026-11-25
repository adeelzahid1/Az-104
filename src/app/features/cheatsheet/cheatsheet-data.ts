/** Text that is the same in both languages, or [English, Roman Urdu]. */
export type Bilingual = string | [string, string];

export interface CheatCard {
  t: Bilingual;
  /** Study section this card belongs to, e.g. "1.3". */
  s: string;
  /** Microsoft Learn page. */
  link?: string;
  head?: Bilingual[];
  rows?: Bilingual[][];
  /** Commands with what they do. */
  code?: [string, Bilingual][];
  list?: Bilingual[];
}

export interface CheatGroup {
  id: string;
  t: Bilingual;
  cards: CheatCard[];
}

export interface ShownCard {
  id: string;
  title: string;
  section: string;
  link?: string;
  head: string[];
  rows: string[][];
  code: { command: string; note: string }[];
  list: string[];
}

export interface ShownGroup {
  id: string;
  title: string;
  cards: ShownCard[];
}

const norm = (s: string) => s.toLowerCase().replace(/\*\*|`/g, '');

/**
 * Puts the groups in one language (0 = English, 1 = Roman Urdu). With a search term, a card whose
 * title matches is shown whole; otherwise only its matching rows, commands and points are.
 */
export function filterGroups(groups: CheatGroup[], lang: 0 | 1, term = ''): ShownGroup[] {
  const say = (x: Bilingual) => (typeof x === 'string' ? x : x[lang]);
  const words = norm(term).split(/\s+/).filter(Boolean);
  const hit = (...texts: string[]) => {
    const all = norm(texts.join(' '));
    return words.every((w) => all.includes(w));
  };
  return groups
    .map((g) => ({
      id: g.id,
      title: say(g.t),
      cards: g.cards
        .map((c, i): ShownCard => {
          const title = say(c.t);
          const whole = hit(title);
          return {
            id: `${g.id}-${i}`,
            title,
            section: c.s,
            link: c.link,
            head: (c.head ?? []).map(say),
            rows: (c.rows ?? []).map((r) => r.map(say)).filter((r) => whole || hit(title, ...r)),
            code: (c.code ?? [])
              .map(([command, note]) => ({ command, note: say(note) }))
              .filter((x) => whole || hit(title, x.command, x.note)),
            list: (c.list ?? []).map(say).filter((x) => whole || hit(title, x)),
          };
        })
        .filter((c) => c.rows.length + c.code.length + c.list.length > 0),
    }))
    .filter((g) => g.cards.length > 0);
}
