import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BackupService, parseBackup } from './backup';
import { LabProgress } from './lab-progress';
import { Plan } from './plan';

const KEYS = ['az104-labs-v1', 'az104-plan-v1'];

describe('LabProgress', () => {
  let before: (string | null)[];
  let labs: LabProgress;

  beforeEach(() => {
    before = KEYS.map((k) => localStorage.getItem(k));
    KEYS.forEach((k) => localStorage.removeItem(k));
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    labs = TestBed.inject(LabProgress);
  });

  afterEach(() => {
    KEYS.forEach((k, i) => (before[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, before[i]!)));
  });

  it('ticks and unticks steps', () => {
    labs.toggle('L01', 2);
    labs.toggle('L01', 0);
    expect(labs.done('L01')).toEqual([0, 2]);
    labs.toggle('L01', 2);
    labs.toggle('L01', 0);
    expect(labs.done('L01')).toEqual([]);
    expect(labs.snapshot()).toEqual({});
  });

  it('is part of the backup and ignores invalid entries', () => {
    labs.toggle('L03', 1);
    const backups = TestBed.inject(BackupService);
    const file = JSON.parse(JSON.stringify(backups.create()));
    file.labs['bad'] = [1];
    file.labs['L04'] = ['x', -1, 2, 2];
    labs.restore({});
    backups.restore(parseBackup(JSON.stringify(file))!);
    expect(labs.snapshot()).toEqual({ L03: [1], L04: [2] });
  });

  it('marks the skills of a finished lab without removing other marks', () => {
    const plan = TestBed.inject(Plan);
    plan.toggleSkill('Create a virtual machine', 'read');
    plan.markLab(['Create a virtual machine', 'Manage virtual machine disks']);
    plan.markLab(['Create a virtual machine']);
    expect(plan.skills()).toEqual({
      'Create a virtual machine': { read: true, lab: true },
      'Manage virtual machine disks': { lab: true },
    });
  });
});
