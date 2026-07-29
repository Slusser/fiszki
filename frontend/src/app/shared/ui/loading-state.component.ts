import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: ` <p class="loading-state">{{ message }}</p> `,
  styles: `
    .loading-state {
      margin: 0;
      border: 1px dashed #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.65rem;
      color: #475569;
      background: #f8fafc;
    }
  `,
})
export class LoadingStateComponent {
  @Input() message = 'Ladowanie...';
}
