import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <p class="empty-state">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
    </p>
  `,
  styles: `
    .empty-state {
      margin: 0;
      display: grid;
      gap: 0.3rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.65rem;
      background: #f8fafc;
    }
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Brak danych';
  @Input() description = 'Nic do wyswietlenia.';
}
