import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-retry-state',
  template: `
    <p class="retry-state">
      {{ message }}
      <button type="button" (click)="retry.emit()">{{ buttonLabel }}</button>
    </p>
  `,
  styles: `
    .retry-state {
      margin: 0;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      background: #fef2f2;
      color: #991b1b;
      padding: 0.65rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
  `,
})
export class RetryStateComponent {
  @Input() message = 'Wystapil blad.';
  @Input() buttonLabel = 'Sprobuj ponownie';
  @Output() retry = new EventEmitter<void>();
}
