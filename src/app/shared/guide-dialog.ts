import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, effect, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Guide } from '../core/guide';
import guideJson from '../data/guide.json';
import { Language } from '../i18n/language';
import { closeOnBackdrop } from './dialog';
import { RichText } from './rich-text';

/** Popup that explains how to study with the app and how to take the exam. */
@Component({
  selector: 'app-guide-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RichText],
  templateUrl: './guide-dialog.html',
  styleUrl: './guide-dialog.css',
})
export class GuideDialog {
  protected readonly guide = inject(Guide);
  private readonly language = inject(Language);
  protected readonly t = this.language.t;
  protected readonly closeOnBackdrop = closeOnBackdrop;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly topics = computed(() => {
    const lang = this.language.isRoman() ? 1 : 0;
    return guideJson.map((g) => ({
      id: g.id,
      icon: g.icon,
      path: g.path,
      params: g.params,
      title: g.t[lang],
      lead: g.lead[lang],
      steps: g.steps.map((s) => s[lang]),
      tip: g.tip[lang],
    }));
  });
  protected readonly shown = computed(() => this.topics().find((x) => x.id === this.guide.topic()) ?? this.topics()[0]);

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.guide.isOpen() && !dialog.open) dialog.showModal();
    });
    // On a phone the topics are one line that scrolls sideways.
    afterRenderEffect(() => {
      this.guide.topic();
      if (!this.guide.isOpen()) return;
      this.dialog().nativeElement.querySelector('nav .on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  protected choose(id: string): void {
    this.guide.topic.set(id);
    this.dialog().nativeElement.querySelector('.body')?.scrollTo({ top: 0 });
  }
}
