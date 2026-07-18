import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'signature-viewer',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="viewer-header">
      <h3>{{ data.signerName }}</h3>
      <span class="viewer-role">{{ data.signerRole }}</span>
      <button mat-icon-button mat-dialog-close class="close-btn"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content class="viewer-body">
      <img *ngIf="data.imageSrc" [src]="data.imageSrc" alt="Signature of {{ data.signerName }}" class="viewer-img" />
      <p *ngIf="data.signedAt" class="signed-at">Signed: {{ data.signedAt }}</p>
    </mat-dialog-content>
  `,
  styles: [`
    .viewer-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px 8px;
      background: var(--sig-yellow);
      color: #1a1a2e;
      position: relative;
    }
    .viewer-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    .viewer-role { font-size: 0.8rem; opacity: 0.85; color: #1a1a2e; }
    .close-btn { position: absolute; right: 8px; top: 8px; color: #1a1a2e !important; }

    .viewer-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px !important;
      background: var(--sig-surface-2);
      color: var(--sig-text);
      min-height: 180px;
    }
    .viewer-img {
      width: 100%;
      height: auto;
      max-height: 70vh;
      aspect-ratio: 9 / 4;
      object-fit: contain;
      border: 1px dashed var(--sig-border-solid);
      border-radius: 6px;
      padding: 12px;
      background: #ffffff !important;
    }
    .signed-at {
      margin: 12px 0 0;
      font-size: 0.75rem;
      color: var(--sig-text-muted);
    }
  `],
})
export class SignatureViewerComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { imageSrc: string; signerName: string; signerRole: string; signedAt: string | null },
  ) {}
}
