import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Plan } from '../../core/plan';
import { RawBlock, searchNote, toNote } from './notes-data';

const raw: RawBlock[] = [
  { k: 'p', t: ['A vault keeps **copies**.', 'Vault mein **copies** hoti hain.'] },
  { k: 'h', t: ['Policy', 'Policy RO'] },
  { k: 'l', items: [['Schedule', 'Waqt'], ['The `retention` of *daily* points', 'Rakhne ki muddat']] },
  { k: 't', t: ['Same region only.', 'Sirf wahi region.'] },
  { k: 'q', t: ['Which region?', 'Kaun sa region?'], a: ['The same.', 'Wahi.'] },
];

describe('toNote', () => {
  it('groups the blocks under their headings in the chosen language', () => {
    const note = toNote(raw, 1);
    expect(note.parts.map((p) => p.title)).toEqual(['', 'Policy RO']);
    expect(note.parts[1].blocks.map((b) => b.kind)).toEqual(['l', 't']);
    expect(note.parts[1].blocks[0].items[0]).toBe('Waqt');
    expect(note.checks).toEqual([{ question: 'Kaun sa region?', answer: 'Wahi.' }]);
    expect(note.minutes).toBe(1);
  });
});

describe('searchNote', () => {
  const note = toNote(raw, 0);

  it('finds the parts with every word, ignoring case and marks', () => {
    expect(searchNote(note, 'COPIES')).toEqual([{ part: 0, title: '', excerpt: 'A vault keeps copies.' }]);
    expect(searchNote(note, 'daily retention')[0].excerpt).toBe('The retention of daily points');
    expect(searchNote(note, 'vault policy')).toEqual([]);
    expect(searchNote(note, 'egion')).toEqual([]);
    expect(searchNote(note, '  ')).toEqual([]);
  });

  it('shortens a long text around the match', () => {
    const long = toNote([{ k: 'p', t: [`${'before '.repeat(40)}needle${' after'.repeat(60)}`, 'x'] }], 0);
    const { excerpt } = searchNote(long, 'needle')[0];
    expect(excerpt).toContain('needle');
    expect(excerpt.startsWith('… ') && excerpt.endsWith(' …')).toBeTrue();
  });
});

describe('Plan.markRead', () => {
  it('sets and clears read without touching the other marks', () => {
    localStorage.removeItem('az104-plan-v1');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const plan = TestBed.inject(Plan);
    plan.toggleSkill('a', 'lab');
    plan.markRead(['a', 'b'], true);
    expect(plan.skills()).toEqual({ a: { lab: true, read: true }, b: { read: true } });
    plan.markRead(['a', 'b'], false);
    expect(plan.skills()).toEqual({ a: { lab: true } });
    localStorage.removeItem('az104-plan-v1');
  });
});
