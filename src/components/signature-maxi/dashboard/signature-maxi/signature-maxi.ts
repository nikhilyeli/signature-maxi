import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductGuideService } from '../../core/product-guide.service';
import { SignatureMaxiService } from '../../core/signature-maxi.service';
import { Signer, SignerViewMode } from '../../core/signer.interface';
import { SignatureDialogComponent } from '../../features/signature-dialog/signature-dialog';
import { SignatureViewerComponent } from '../../features/signature-preview/signature-viewer';
import { ConfirmDialogComponent } from '../../features/confirm-dialog/confirm-dialog';
import { ProductReelComponent } from '../../features/product-reel/product-reel';
import { RoleGroupListComponent } from '../role-group-list/role-group-list';
import { SettingsPanelComponent } from '../settings-panel/settings-panel';
import { SignerCardComponent } from '../signer-card/signer-card';

export const DEFAULT_SIGNERS: Signer[] = [
  { id: '1', name: 'Harry Potter', email: 'harry.potter@example.com', role: 'Owner', mandatory: true, signed: false, signature: null, canEdit: true, canDelete: true },
  { id: '2', name: 'Micheal Jackson', email: 'micheal.jackson@example.com', role: 'Author', mandatory: true, signed: false, signature: null, canEdit: true, canDelete: true },
  { id: '3', name: 'John Belkin', email: 'john.belkin@example.com', role: 'Author', mandatory: true, signed: false, signature: null, canEdit: true, canDelete: true },
  { id: '4', name: 'Sarah Zenkins', email: 'sarah.zenkins@example.com', role: 'Co-Author', mandatory: true, signed: false, signature: null, canEdit: true, canDelete: true },
  { id: '5', name: 'Liam Carter', email: 'liam.carter@example.com', role: 'Approver', mandatory: true, signed: false, signature: null, canEdit: true, canDelete: true },
  { id: '6', name: 'Chloe Brooks', email: 'chloe.brooks@example.com', role: 'Observer', mandatory: false, signed: false, signature: null, canEdit: true, canDelete: true },
  { id: '7', name: 'George Butter', email: 'george.butter@example.com', role: 'Reviewer', mandatory: false, signed: false, signature: null, canEdit: true, canDelete: true },
];

@Component({
  selector: 'signature-maxi',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    SignerCardComponent,
    RoleGroupListComponent,
    SettingsPanelComponent,
  ],
  templateUrl: './signature-maxi.html',
  styleUrls: ['./signature-maxi.scss'],
})
export class SignatureMaxiComponent implements OnInit {
  contentId = '123456_v1_0';
  contentIdDraft = '123456_v1_0';
  editingContentId = false;

  signers: Signer[] = [];
  showSettings = false;
  isDarkTheme = false;
  viewMode: SignerViewMode = 'cards';
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly service: SignatureMaxiService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly productGuide: ProductGuideService,
  ) {
    this.iconRegistry.addSvgIcon(
      'stylus_note',
      this.sanitizer.bypassSecurityTrustResourceUrl('stylus_note_24dp.svg'),
    );
  }

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('sig-maxi-theme');
    if (savedTheme === 'dark') {
      this.setTheme(true);
    }

    const savedView = localStorage.getItem('sig-maxi-view-mode');
    if (savedView === 'list' || savedView === 'roles') {
      this.viewMode = 'list';
    } else if (savedView === 'cards') {
      this.viewMode = 'cards';
    }

    this._subscribeSigners();
    // Default signers if empty after subscription
    if (this.signers.length === 0) {
      this.service.setSigners(this.contentId, DEFAULT_SIGNERS);
    }
  }

  /* ── Content ID Handlers ────────────────────────────────────────────────── */
  startEditContentId(): void {
    this.contentIdDraft = this.contentId;
    this.editingContentId = true;
  }

  applyContentId(): void {
    const newId = this.contentIdDraft.trim();
    if (!newId || newId === this.contentId) {
      this.editingContentId = false;
      return;
    }
    const oldId = this.contentId;
    this.contentId = newId;

    this.service.setWatermarkConfig(newId, this.service.getWatermarkConfig(oldId));
    this.service.setCaptureConfig(newId, this.service.getCaptureConfig(oldId));

    const newSigner = {
      id: crypto.randomUUID(),
      name: 'Author',
      role: 'Creator',
      mandatory: true,
      signed: false,
      signature: null,
      signatureSvg: null,
      signatureWatermarkedSvg: null,
      signatureDataUrl: null,
      signedAt: null,
      canEdit: true,
      canDelete: true,
    };
    this.service.setSigners(newId, [newSigner]);

    this._subscribeSigners();
    this.editingContentId = false;
    this.showToast(`Content ID updated to ${this.contentId}`);
  }

  cancelEditContentId(): void {
    this.editingContentId = false;
    this.contentIdDraft = this.contentId;
  }

  setTheme(isDark: boolean): void {
    this.isDarkTheme = isDark;
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('sig-maxi-theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('sig-maxi-theme', 'light');
    }
  }

  setViewMode(mode: SignerViewMode): void {
    this.viewMode = mode;
    localStorage.setItem('sig-maxi-view-mode', mode);
  }

  completeAll(): void {
    if (!this.mandatoryComplete) return;
    this.showToast('Content signatures finalized');
  }

  resetAll(): void {
    this.service.resetSignatures(this.contentId);
    this.showToast('All signatures have been reset');
  }

  submitDocument(): void {
    this.snackBar.open('Document submitted successfully!', 'OK', { duration: 3000 });
    this.resetAll();
  }

  /* ── Product guide ───────────────────────────────────────────────────────── */
  startFeatureTour(): void {
    this.showSettings = false;
    this.productGuide.startFeatureTour({
      openSignDialog: () => this.openSignatureDialog(),
      closeDialogs: () => {
        if (this.dialog.openDialogs.length === 0) return Promise.resolve();
        this.dialog.closeAll();
        return new Promise<void>((resolve) => setTimeout(resolve, 300));
      },
    });
  }

  startCustomizationTour(): void {
    this.showSettings = true;
    this.cdr.detectChanges();
    setTimeout(() => this.productGuide.startCustomizationTour(), 150);
  }

  openProductReel(): void {
    this.dialog.open(ProductReelComponent, {
      panelClass: 'product-reel-panel',
      width: '1040px',
      maxWidth: '96vw',
    });
  }

  /* ── Computed ────────────────────────────────────────────────────────────── */
  get signedCount(): number {
    return this.signers.filter((s) => s.signed).length;
  }
  get mandatoryCount(): number {
    return this.signers.filter((s) => s.mandatory).length;
  }
  get mandatoryComplete(): boolean {
    const m = this.signers.filter((s) => s.mandatory);
    return m.length > 0 && m.every((s) => s.signed);
  }

  /* ── Dialogs ─────────────────────────────────────────────────────────────── */
  openSignatureDialog(): void {
    const ref = this.dialog.open(SignatureDialogComponent, {
      data: {
        contentId: this.contentId,
        captureConfig: { ...this.service.getCaptureConfig(this.contentId) },
      },
      panelClass: 'signature-dialog-panel',
      backdropClass: 'signature-dialog-backdrop',
      disableClose: true,
      width: '800px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((res) => {
      if (res === 'completed' || res === 'signed') {
        this.showToast('All signatures processed');
      }
    });
  }

  openSignerDialog(signer: Signer): void {
    const isEdit = signer.signed;
    const ref = this.dialog.open(SignatureDialogComponent, {
      data: {
        contentId: this.contentId,
        preselectedSignerId: signer.id,
        captureConfig: { ...this.service.getCaptureConfig(this.contentId) },
      },
      panelClass: 'signature-dialog-panel',
      backdropClass: 'signature-dialog-backdrop',
      disableClose: false,
      width: '560px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((res) => {
      if (res === 'signed') {
        this.showToast(
          isEdit ? `Signature updated for ${signer.name}` : `Signature recorded for ${signer.name}`,
        );
      }
    });
  }

  viewSignature(signer: Signer): void {
    if (!signer.signatureDataUrl) return;
    this.dialog.open(SignatureViewerComponent, {
      data: {
        imageSrc: signer.signatureDataUrl,
        signerName: signer.name,
        signerRole: signer.role,
        signedAt: signer.signedAt ?? null,
      },
      panelClass: 'signature-viewer-panel',
      width: '520px',
      maxWidth: '96vw',
    });
  }

  deleteSignature(s: Signer): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete signature?',
        message: `${s.name}'s signature will be removed and they will need to sign again.`,
        confirmLabel: 'Delete',
      },
      panelClass: 'signature-viewer-panel',
      width: '380px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.resetSignerSignature(this.contentId, s.id);
      this.showToast(`Signature deleted for ${s.name}`);
    });
  }

  trackById(_i: number, s: Signer): string {
    return s.id;
  }

  /* ── Private ─────────────────────────────────────────────────────────────── */
  private _subscribeSigners(): void {
    this.service
      .getSigners(this.contentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((s) => {
        this.signers = s;
        this.cdr.detectChanges();
      });
  }

  showToast(msg: string): void {
    this.snackBar.open(msg, 'OK', {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
