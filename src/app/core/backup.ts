import { Injectable, inject } from '@angular/core';
import { LabProgress } from './lab-progress';
import { MockHistory } from './mock-history';
import { Plan } from './plan';
import { Progress } from './progress';
import { StudyProgress } from './study-progress';

const APP = 'az104-prep';

export interface Backup {
  app: typeof APP;
  version: 1;
  exportedAt: string;
  progress: Record<string, unknown>;
  study: Record<string, unknown>;
  /** Missing in backups made before these existed. */
  plan?: unknown;
  mocks?: unknown;
  labs?: unknown;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Reads a backup file's text. Returns null when it isn't a backup of this app. */
export function parseBackup(text: string): Backup | null {
  try {
    const v: unknown = JSON.parse(text);
    if (!isRecord(v) || v['app'] !== APP || v['version'] !== 1) return null;
    if (typeof v['exportedAt'] !== 'string' || !isRecord(v['progress']) || !isRecord(v['study'])) return null;
    return v as unknown as Backup;
  } catch {
    return null;
  }
}

/** Saves and restores everything the learner has done in this browser. */
@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly progress = inject(Progress);
  private readonly study = inject(StudyProgress);
  private readonly plan = inject(Plan);
  private readonly mocks = inject(MockHistory);
  private readonly labs = inject(LabProgress);

  create(now = new Date()): Backup {
    return {
      app: APP,
      version: 1,
      exportedAt: now.toISOString(),
      progress: this.progress.snapshot(),
      study: this.study.snapshot(),
      plan: this.plan.snapshot(),
      mocks: this.mocks.results(),
      labs: this.labs.snapshot(),
    };
  }

  /** Replaces the current progress with the backup's. Entries that aren't valid are left out. */
  restore(backup: Backup): void {
    this.progress.restore(backup.progress);
    this.study.restore(backup.study);
    if (backup.mocks) this.mocks.replace(backup.mocks);
    if (backup.labs) this.labs.restore(backup.labs);
    if (backup.plan) this.plan.restore(backup.plan);
  }
}
