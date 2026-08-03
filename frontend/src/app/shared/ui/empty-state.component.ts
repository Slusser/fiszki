import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <p class="empty-state surface-card" role="status">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
    </p>
  `,
  styles: `
    .empty-state {
      margin: 0;
      display: grid;
      gap: 0.35rem;
      border-radius: var(--radius-xl);
      padding: 0.8rem;
    }

    .empty-state strong {
      font-size: 0.95rem;
    }

    .empty-state span {
      color: var(--muted-foreground);
      font-size: 0.88rem;
      line-height: 1.45;
    }
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Brak danych';
  @Input() description = 'Nic do wyswietlenia.';
}
