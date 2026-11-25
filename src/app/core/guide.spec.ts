import guide from '../data/guide.json';
import { routes } from '../app.routes';
import { topicOf } from './guide';

describe('guide', () => {
  it('opens at the topic of the page', () => {
    expect(topicOf('/notes?s=1.3')).toBe('notes');
    expect(topicOf('/study?s=1.3')).toBe('study');
    expect(topicOf('/study?s=1.3&m=cards')).toBe('cards');
    expect(topicOf('/')).toBe('start');
  });

  it('has text in both languages, known pages and every topic a page opens', () => {
    const paths = routes.map((r) => `/${r.path}`);
    const ids = guide.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of guide) {
      expect(paths).toContain(g.path);
      expect([g.t, g.lead, g.tip, ...g.steps].every((x) => x.length === 2 && x.every((s) => s.trim()))).toBeTrue();
    }
    for (const r of routes) expect(ids).toContain(topicOf(`/${r.path}`));
  });
});
