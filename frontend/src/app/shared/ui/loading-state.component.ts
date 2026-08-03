import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: ` <p class="loading-state surface-card" role="status">{{ message }}</p> `,
  styles: `
    .loading-state {
      margin: 0;
      border-style: dashed;
      border-radius: var(--radius-xl);
      padding: 0.7rem 0.8rem;
      color: var(--muted-foreground);
      font-size: 0.9rem;
    }
  `,
})
export class LoadingStateComponent {
  @Input() message = 'Ladowanie...';
}
