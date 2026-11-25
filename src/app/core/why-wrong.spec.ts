import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Question } from '../data/schema';
import { QuestionView } from '../shared/question-view';
import { shuffleOptions } from './quiz-logic';
import { WhyWrong, reasonsFor } from './why-wrong';

const q = {
  id: 'D1-001',
  type: 'mcq',
  sub: 'x',
  diff: 1,
  q: '?',
  opts: ['a', 'b', 'c', 'd'],
  ans: [1],
  exp: 'e',
  link: 'l',
} as Question;
const file = { 'D1-001': { '0': ['why a', 'a kyun'], '3': ['why d', 'd kyun'] } } as Record<
  string,
  Record<string, [string, string]>
>;

describe('reasonsFor', () => {
  it('gives each option its own reason, also after shuffling', () => {
    expect(reasonsFor(q, file, 0)).toEqual(['why a', '', '', 'why d']);
    expect(reasonsFor(q, file, 1)[3]).toBe('d kyun');
    for (let i = 0; i < 20; i++) {
      const s = shuffleOptions(q);
      const r = reasonsFor(s, file, 0);
      expect(r[s.opts!.indexOf('a')]).toBe('why a');
      expect(r[s.opts!.indexOf('d')]).toBe('why d');
      expect(r[s.opts!.indexOf('b')]).toBe('');
    }
  });

  it('has nothing for a question without reasons', () => {
    expect(reasonsFor({ ...q, id: 'D1-999' }, file, 0)).toEqual([]);
  });
});

describe('QuestionView', () => {
  it('shows the reasons only in Study, and only while the answer is shown', () => {
    TestBed.configureTestingModule({
      imports: [QuestionView],
      providers: [
        provideZonelessChangeDetection(),
        { provide: WhyWrong, useValue: { reasons: (x: Question) => reasonsFor(x, file, 0) } },
      ],
    });
    const fixture = TestBed.createComponent(QuestionView);
    const shown = () => {
      fixture.detectChanges();
      return [...(fixture.nativeElement as HTMLElement).querySelectorAll('.why-not')].map((e) => e.textContent?.trim());
    };
    fixture.componentRef.setInput('question', q);
    fixture.componentRef.setInput('study', true);
    expect(shown()).toEqual([]);
    fixture.componentRef.setInput('answer', [1]);
    fixture.componentRef.setInput('reveal', true);
    expect(shown()).toEqual(['✗ why a', '✗ why d']);
    fixture.componentRef.setInput('reveal', false);
    expect(shown()).toEqual([]);
    fixture.componentRef.setInput('reveal', true);
    fixture.componentRef.setInput('study', false);
    expect(shown()).toEqual([]);
  });
});
