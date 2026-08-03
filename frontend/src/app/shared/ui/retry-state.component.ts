import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-retry-state',
  template: `
    <section class="retry-state" role="alert">
      <p>{{ message }}</p>
      <button type="button" (click)="retry.emit()">{{ buttonLabel }}</button>
    </section>
  `,
  styles: `
    .retry-state {
      margin: 0;
      border: 1px solid color-mix(in srgb, var(--destructive) 35%, var(--border));
      border-radius: var(--radius-xl);
      background: color-mix(in srgb, var(--destructive) 10%, var(--card));
      color: var(--destructive);
      padding: 0.75rem 0.8rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .retry-state p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .retry-state button {
      border: 1px solid color-mix(in srgb, var(--destructive) 50%, var(--border));
      border-radius: var(--radius-lg);
      background: transparent;
      color: var(--destructive);
      font-weight: 700;
      white-space: nowrap;
      padding: 0.35rem 0.65rem;
      cursor: pointer;
    }

    @media (max-width: 620px) {
      .retry-state {
        flex-wrap: wrap;
      }
    }
  `,
})
export class RetryStateComponent {
  @Input() message = 'Wystapil blad.';
  @Input() buttonLabel = 'Sprobuj ponownie';
  @Output() retry = new EventEmitter<void>();
}
