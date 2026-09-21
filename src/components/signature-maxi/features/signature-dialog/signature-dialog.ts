import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SignatureCaptureComponent, SignatureCaptureConfig } from '../signature-capture/signature-capture';
import { SignerListComponent } from '../../dashboard/manage-signers/signer-list';
import { SignatureMaxiService } from '../../core/signature-maxi.service';
import { Signer } from '../../core/signer.interface';

export interface SignatureDialogData {
  contentId: string;
  preselectedSignerId?: string;
  captureConfig?: SignatureCaptureConfig;
}

@Component({
  selector: 'signature-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule,
    SignatureCaptureComponent,
    SignerListComponent,
  ],
  template: `
    <!-- ── Header ── -->
    <div class="dlg-header" data-tour="sign-dialog-header">
      <mat-icon svgIcon="stylus_note" style="color: #fff;"></mat-icon>
      <div class="dlg-header-text">
        <h5>{{ preselectedSignerId ? (selectedSigner?.name ?? 'Signer') : 'Signatures Panel' }}</h5>
        <span class="dlg-sub" *ngIf="preselectedSignerId && selectedSigner">
          {{ selectedSigner.role }} · {{ selectedSigner.mandatory ? 'Mandatory' : 'Optional' }}
        </span>
      </div>
      <div class="dlg-header-end">
        <button mat-icon-button matTooltip="Reset all signatures" (click)="resetAll()">
          <mat-icon>restart_alt</mat-icon>
        </button>
        <button mat-icon-button mat-dialog-close matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="dlg-body" [class.split-layout]="!preselectedSignerId" *ngIf="!isConfigEmpty">
      <div class="dlg-sidebar" *ngIf="!preselectedSignerId" data-tour="sign-dialog-users">
        <!-- Signer list (only for the "all signers" mode) -->
        <app-signer-list
          [contentId]="contentId"
          (signerSelected)="onSignerSelected($event)"
        ></app-signer-list>
      </div>

      <!-- Divider label (mobile only or inside main area) -->
      <div class="dlg-divider" *ngIf="!preselectedSignerId">
        <mat-icon svgIcon="stylus_note"></mat-icon>
        <span>Place your signature below</span>
      </div>

      <div class="dlg-main" data-tour="sign-dialog-capture">
        <!-- Completion banner -->
        <div class="dlg-complete-banner" *ngIf="canComplete && !preselectedSignerId">
          <mat-icon>task_alt</mat-icon> All mandatory signatures complete.
        </div>

        <!-- Reusable capture component -->
        <app-signature-capture
          [contentId]="contentId"
          [signer]="selectedSigner"
          [config]="captureConfig"
          (signatureConfirmed)="onSignatureConfirmed($event)"
          (signatureCleared)="onSignatureCleared()"
        ></app-signature-capture>
      </div>
    </div>

    <!-- ── Empty State ── -->
    <div class="dlg-body empty-state" *ngIf="isConfigEmpty">
      <mat-icon class="empty-icon">error_outline</mat-icon>
      <h6>Action Required</h6>
      <p>There are no users in the signer list, or all signature capture modes are disabled.</p>
      <p>Please add users or enable modes from the Settings menu on the dashboard.</p>
    </div>

    <!-- ── Footer ── -->
    <div class="dlg-footer" data-tour="sign-dialog-footer">
      <button mat-stroked-button mat-dialog-close>
        <mat-icon>cancel</mat-icon> Cancel
      </button>
      <button mat-flat-button class="dlg-btn-complete"
        [disabled]="preselectedSignerId ? !selectedSigner?.signed : !canComplete"
        (click)="completeAction()">
        <mat-icon>{{ preselectedSignerId ? 'check' : 'send' }}</mat-icon>
        {{ preselectedSignerId ? 'Done' : 'Complete' }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; max-height: 90vh; }

    /* ── Header ── */
    .dlg-header {
      display: flex; align-items: center; gap: 10px;
      padding: 11px 16px; background: var(--sig-yellow); color: #1a1a2e; flex-shrink: 0;
      .svg-icon-hdr { width: 22px; height: 22px; filter: brightness(0); }
      mat-icon { color: #1a1a2e !important; }
    }
    .dlg-header-text { flex: 1; min-width: 0; }
    .dlg-header-text h5 { margin: 0; font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #1a1a2e; }
    .dlg-sub { font-size: 0.72rem; opacity: 0.85; color: #1a1a2e; }
    .dlg-header-end { display: flex; gap: 2px; }
    .dlg-header-end button { color: #1a1a2e !important; }

    /* ── Body ── */
    .dlg-body {
      padding: 14px 18px; flex: 1; overflow-y: auto;
      background: var(--sig-surface-2, #f9f9fb);
      color: var(--sig-text, #1a1a2e);
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; padding: 40px 20px;
      .empty-icon { font-size: 48px; width: 48px; height: 48px; color: var(--sig-yellow); margin-bottom: 16px; }
      h6 { font-size: 1.1rem; font-weight: 600; margin: 0 0 8px; }
      p { font-size: 0.85rem; color: var(--sig-text-muted); margin: 0 0 4px; max-width: 320px; }
    }
    
    .split-layout { display: flex; flex-direction: column; gap: 10px; }
    .dlg-sidebar {
      width: 320px; flex-shrink: 0;
    }
    .dlg-main { flex: 1; min-width: 0; }

    @media (min-width: 768px) {
      .split-layout { flex-direction: row; gap: 24px; align-items: stretch; }
      .dlg-sidebar { width: 280px; position: sticky; top: 0; }
      .dlg-divider { display: none !important; }
    }

    /* Divider */
    .dlg-divider {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.78rem; color: var(--sig-text-muted, #6b7080);
      border-bottom: 1px solid var(--sig-border-solid, #d0d4e8);
      padding-bottom: 6px; margin: 12px 0 8px;
      .svg-icon-div { width: 14px; height: 14px; filter: invert(0.4) sepia(1) saturate(10) hue-rotate(15deg); }
    }

    /* Complete banner */
    .dlg-complete-banner {
      display: flex; align-items: center; gap: 7px;
      padding: 7px 12px; margin-bottom: 8px; border-radius: 4px; font-size: 0.8rem;
      background: rgba(76,175,80,0.1); color: #4caf50; border: 1px solid rgba(76,175,80,0.4);
      mat-icon { font-size: 16px; height: 16px; width: 16px; }
    }

    /* ── Footer ── */
    .dlg-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 9px 18px; background: var(--sig-surface-3); flex-shrink: 0; border-top: 1px solid var(--sig-border-solid);
    }
    .dlg-footer button[mat-stroked-button] { color: var(--sig-text) !important; border-color: var(--sig-border-solid) !important; }
    .dlg-footer button[mat-stroked-button] mat-icon { font-size: 16px; height: 16px; width: 16px; margin-right: 4px; }

    .dlg-btn-complete {
      background: var(--sig-yellow) !important; color: #1a1a2e !important; font-weight: 600 !important;
      mat-icon { font-size: 16px; height: 16px; width: 16px; margin-right: 4px; color: #1a1a2e; }
      &:disabled { background: var(--sig-border-solid) !important; color: var(--sig-text-muted) !important; }
    }
  `],
})
export class SignatureDialogComponent {
  contentId: string;
  preselectedSignerId: string | undefined;
  captureConfig: SignatureCaptureConfig;
  signers: Signer[] = [];
  selectedSigner: Signer | null = null;
  canComplete = false;
  private readonly destroyRef = inject(DestroyRef);

  get isConfigEmpty(): boolean {
    if (!this.captureConfig) return true;
    const noModes = !this.captureConfig.enableDraw && !this.captureConfig.enableType && !this.captureConfig.enableUpload;
    return this.signers.length === 0 || noModes;
  }

  constructor(
    private dialogRef: MatDialogRef<SignatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: SignatureDialogData,
    private service: SignatureMaxiService,
    private cdr: ChangeDetectorRef,
  ) {
    this.contentId          = this.data.contentId;
    this.preselectedSignerId = this.data.preselectedSignerId;
    this.captureConfig       = this.data.captureConfig ?? { enableDraw: true, enableType: true, enableUpload: true };

    this.service.getSigners(this.contentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((signers) => {
        this.signers = signers;
        if (this.preselectedSignerId) {
          this.selectedSigner = signers.find((s) => s.id === this.preselectedSignerId) ?? null;
        } else {
          if (!this.selectedSigner && signers.length > 0) this.selectedSigner = signers[0];
          if (this.selectedSigner) this.selectedSigner = signers.find((s) => s.id === this.selectedSigner?.id) ?? null;
        }
        const m = signers.filter((s) => s.mandatory);
        this.canComplete = m.length > 0 && m.every((s) => s.signed);
        this.cdr.markForCheck();
      });
  }

  onSignerSelected(s: Signer): void { this.selectedSigner = s; }

  onSignatureConfirmed(payload: { watermarked: string; raw: string; omitSignerName?: boolean }): void {
    if (!this.selectedSigner) return;
    const signedAt = new Date().toISOString();
    
    // Dialog handles the watermarking for the decoupled capture component
    const watermarked = this.service.stampSignatureSvg({
      contentId: this.contentId,
      signerName: this.selectedSigner.name,
      signerRole: this.selectedSigner.role,
      signatureSvgXml: payload.raw,
      omitSignerName: payload.omitSignerName
    });

    this.service.upsertSignerSignature(this.contentId, this.selectedSigner.id, watermarked, signedAt, payload.raw);
    
    if (this.preselectedSignerId) {
      this.dialogRef.close('signed');
    }
  }

  onSignatureCleared(): void {
    if (!this.selectedSigner) return;
    this.service.resetSignerSignature(this.contentId, this.selectedSigner.id);
  }

  resetAll(): void { this.service.resetSignatures(this.contentId); }

  completeAction(): void {
    this.dialogRef.close(this.preselectedSignerId ? 'signed' : 'completed');
  }
}
