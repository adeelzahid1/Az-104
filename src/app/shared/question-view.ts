import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { Question } from '../data/schema';
import { Answer, isCorrect } from '../core/quiz-logic';

const LETTERS = 'ABCDEFGHIJ';

@Component({
  selector: 'app-question-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-view.html',
  styleUrl: './question-view.css',
})
export class QuestionView {
  readonly question = input.required<Question>();
  readonly answer = input<Answer | null>(null);
  readonly reveal = input(false);
  readonly answerChange = output<Answer>();

  protected readonly letters = LETTERS;

  /**
   * Local copy of the answer, updated synchronously on every interaction. Reading the input
   * directly loses rapid consecutive clicks, because the parent's update reaches the input only
   * after the next change detection pass.
   */
  private readonly draft = linkedSignal({
    source: () => ({ question: this.question(), answer: this.answer() }),
    computation: (source) => source.answer,
  });

  protected readonly picks = computed(() => (this.draft() as number[] | null) ?? []);
  protected readonly order = computed(
    () => (this.draft() as number[] | null) ?? (this.question().items ?? []).map((_, i) => i),
  );
  protected readonly yesNo = computed(
    () =>
      (this.draft() as (boolean | null)[] | null) ?? (this.question().stmts ?? []).map(() => null),
  );
  protected readonly expectedIndices = computed(() => this.question().ans as number[]);
  protected readonly expectedYesNo = computed(() => this.question().ans as boolean[]);
  protected readonly isRight = computed(() => isCorrect(this.question(), this.answer()));

  protected readonly answerText = computed(() => {
    const q = this.question();
    if (q.type === 'mcq' || q.type === 'multi') {
      return this.expectedIndices()
        .map((i) => LETTERS[i])
        .join(', ');
    }
    if (q.type === 'yesno') return this.expectedYesNo().map((v) => (v ? 'Yes' : 'No')).join(' · ');
    return '';
  });

  protected readonly correctOrder = computed(() =>
    this.expectedIndices().map((i) => this.question().items?.[i] ?? ''),
  );

  protected optionState(i: number): 'correct' | 'wrong' | 'missed' | '' {
    if (!this.reveal()) return '';
    const expected = this.expectedIndices().includes(i);
    const picked = this.picks().includes(i);
    if (expected && picked) return 'correct';
    if (expected) return 'missed';
    return picked ? 'wrong' : '';
  }

  protected yesNoState(i: number): 'correct' | 'wrong' | '' {
    if (!this.reveal()) return '';
    return this.yesNo()[i] === this.expectedYesNo()[i] ? 'correct' : 'wrong';
  }

  protected choose(i: number): void {
    if (this.reveal()) return;
    if (this.question().type === 'mcq') {
      this.commit([i]);
      return;
    }
    const current = this.picks();
    this.commit(
      current.includes(i) ? current.filter((p) => p !== i) : [...current, i].sort((a, b) => a - b),
    );
  }

  protected setYesNo(i: number, value: boolean): void {
    if (this.reveal()) return;
    this.commit(this.yesNo().map((v, idx) => (idx === i ? value : v)));
  }

  protected move(position: number, delta: -1 | 1): void {
    if (this.reveal()) return;
    const target = position + delta;
    const next = [...this.order()];
    if (target < 0 || target >= next.length) return;
    [next[position], next[target]] = [next[target], next[position]];
    this.commit(next);
  }

  private commit(value: Answer): void {
    this.draft.set(value);
    this.answerChange.emit(value);
  }
}
