import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm-body">
      <h3>{{ data.title }}</h3>
      <p>{{ data.message }}</p>
    </div>
    <div class="confirm-actions">
      <button mat-stroked-button [mat-dialog-close]="false" cdkFocusInitial>Cancel</button>
      <button mat-flat-button class="confirm-danger" [mat-dialog-close]="true">{{ data.confirmLabel }}</button>
    </div>
  `,
  styles: [`
    .confirm-body { padding: 20px 22px 8px; background: var(--sig-surface-2); color: var(--sig-text); }
    h3 { margin: 0 0 6px; font-size: 1rem; font-weight: 600; }
    p { margin: 0; font-size: 0.85rem; color: var(--sig-text-muted); line-height: 1.5; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px 18px; background: var(--sig-surface-2); }
    .confirm-actions button[mat-stroked-button] { color: var(--sig-text-muted); border-color: var(--sig-border-solid); }
    .confirm-danger { background: var(--sig-red) !important; color: #fff !important; font-weight: 600; }
  `],
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}
}
