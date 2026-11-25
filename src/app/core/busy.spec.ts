import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Busy } from './busy';

describe('Busy', () => {
  it('is active until every download has ended, also when one fails', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const busy = TestBed.inject(Busy);
    let finish = () => {};
    const slow = busy.track(new Promise<void>((resolve) => (finish = resolve)));
    const failed = busy.track(Promise.reject(new Error('down')));
    await expectAsync(failed).toBeRejected();
    await Promise.resolve();
    expect(busy.active()).toBeTrue();
    finish();
    await slow;
    await Promise.resolve();
    expect(busy.active()).toBeFalse();
  });
});
