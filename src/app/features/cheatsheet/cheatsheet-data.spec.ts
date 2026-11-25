import { parseRichText } from '../../shared/rich-text';
import { CheatGroup, filterGroups } from './cheatsheet-data';

const groups: CheatGroup[] = [
  {
    id: 'a',
    t: ['Numbers', 'Numbers RO'],
    cards: [
      {
        t: 'Storage',
        s: '2.1',
        head: ['', ['Value', 'Qeemat']],
        rows: [
          [['Minimum days', 'Kam se kam din'], '30'],
          ['Keys', '**2**'],
        ],
        list: [['Archive is offline', 'Archive offline hai']],
        code: [['azcopy login', ['Sign in', 'Sign in karein']]],
      },
    ],
  },
];

describe('filterGroups', () => {
  it('shows everything in the chosen language without a search', () => {
    const [g] = filterGroups(groups, 1);
    expect(g.title).toBe('Numbers RO');
    expect(g.cards[0].head).toEqual(['', 'Qeemat']);
    expect(g.cards[0].rows).toEqual([['Kam se kam din', '30'], ['Keys', '**2**']]);
    expect(g.cards[0].list).toEqual(['Archive offline hai']);
  });

  it('keeps only matching entries, ignoring case and marks', () => {
    const [g] = filterGroups(groups, 0, 'KEYS 2');
    expect(g.cards[0].rows).toEqual([['Keys', '**2**']]);
    expect(g.cards[0].list).toEqual([]);
    expect(filterGroups(groups, 0, 'azcopy')[0].cards[0].code.length).toBe(1);
  });

  it('shows the whole card when its title matches, and nothing when no entry does', () => {
    expect(filterGroups(groups, 0, 'storage')[0].cards[0].rows.length).toBe(2);
    expect(filterGroups(groups, 0, 'kubernetes')).toEqual([]);
  });
});

describe('parseRichText', () => {
  it('splits bold and code marks', () => {
    expect(parseRichText('Use **Owner** or `az login`.')).toEqual([
      { kind: 'text', text: 'Use ' },
      { kind: 'bold', text: 'Owner' },
      { kind: 'text', text: ' or ' },
      { kind: 'code', text: 'az login' },
      { kind: 'text', text: '.' },
    ]);
  });
});
