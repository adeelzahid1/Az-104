import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Shortcuts, needsKey } from './shortcuts';

describe('Shortcuts', () => {
  let shortcuts: Shortcuts;
  let log: string[];
  let added: HTMLElement[];

  beforeEach(() => {
    localStorage.removeItem('az104-keys');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    shortcuts = TestBed.inject(Shortcuts);
    log = [];
    added = [];
  });

  afterEach(() => {
    added.forEach((e) => e.remove());
    localStorage.removeItem('az104-keys');
  });

  const item = (key: string, name: string, when?: () => boolean) => ({
    keys: [key],
    label: name,
    run: () => log.push(name),
    when,
  });
  const add = (...items: ReturnType<typeof item>[]) => shortcuts.add({ title: () => 'x', items: () => items });
  const element = (html: string) => {
    const box = document.createElement('div');
    box.innerHTML = html;
    document.body.append(box);
    added.push(box);
    return box.firstElementChild as HTMLElement;
  };
  const press = (key: string, target: HTMLElement = document.body, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true, ...init });
    target.addEventListener('keydown', (e) => shortcuts.handle(e), { once: true });
    target.dispatchEvent(event);
    return event;
  };

  it('asks the newest group first and skips what does not apply', () => {
    let open = true;
    add(item('d', 'global'));
    const remove = add(item('d', 'page', () => open));
    expect(press('D').defaultPrevented).toBeTrue();
    open = false;
    press('d');
    open = true;
    remove();
    press('d');
    expect(log).toEqual(['page', 'global', 'global']);
  });

  it('runs sequences and leaves browser shortcuts alone', () => {
    add(item('g n', 'notes'), item('n', 'no'));
    press('g');
    press('n');
    press('n');
    expect(press('n', document.body, { ctrlKey: true }).defaultPrevented).toBeFalse();
    expect(log).toEqual(['notes', 'no']);
  });

  it('can be switched off', () => {
    add(item('f', 'full'));
    shortcuts.setEnabled(false);
    press('f');
    expect(log).toEqual([]);
    expect(localStorage.getItem('az104-keys')).toBe('off');
  });

  it('leaves keys to the focused element', () => {
    expect(needsKey(element('<input type="search">'), 'f')).toBeTrue();
    expect(needsKey(element('<select></select>'), 'ArrowRight')).toBeTrue();
    const radio = element('<input type="radio">');
    expect(needsKey(radio, 'ArrowDown')).toBeTrue();
    expect(needsKey(radio, 'ArrowRight')).toBeFalse();
    expect(needsKey(element('<button>x</button>'), 'Enter')).toBeTrue();
    expect(needsKey(element('<button>x</button>'), 'b')).toBeFalse();
  });

  it('takes Space from a button that was clicked, but not from one reached with Tab', () => {
    add(item('Space', 'flip'));
    const button = element('<button>x</button>');
    button.focus();
    press(' ', button);
    expect(log).toEqual([]);
    button.addEventListener('pointerdown', (e) => shortcuts.pointerDown(e));
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    press(' ', button);
    expect(log).toEqual(['flip']);
  });
});
