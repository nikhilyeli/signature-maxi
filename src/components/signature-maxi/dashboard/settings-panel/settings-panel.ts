import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SignatureMaxiService, SignatureWatermarkConfig } from '../../core/signature-maxi.service';
import { Signer, SignerViewMode } from '../../core/signer.interface';
import { SignatureCaptureConfig } from '../../features/signature-capture/signature-capture';
import { DEFAULT_SIGNERS } from '../signature-maxi/signature-maxi';

interface SignerDraft {
  id: string;
  name: string;
  email: string;
  role: string;
  mandatory: boolean;
  canEdit: boolean;
  canDelete: boolean;
  editing: boolean;
}

const ROLE_OPTIONS = [
  'Author',
  'Co-Author',
  'Approver',
  'Observer',
  'Reviewer',
  'Witness',
  'Editor',
  'Owner',
];

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './settings-panel.html',
  styleUrls: ['./settings-panel.scss'],
})
export class SettingsPanelComponent implements OnInit {
  @Input() contentId!: string;
  @Input() isDarkTheme = false;
  @Input() viewMode: SignerViewMode = 'cards';
  @Output() viewModeChanged = new EventEmitter<SignerViewMode>();
  @Output() closePanel = new EventEmitter<void>();
  @Output() themeToggled = new EventEmitter<boolean>();

  signers: Signer[] = [];
  signerDrafts: SignerDraft[] = [];
  showSignerList = false;
  roleOptions = ROLE_OPTIONS;

  captureConfig!: SignatureCaptureConfig;
  watermarkConfig!: Required<SignatureWatermarkConfig>;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private service: SignatureMaxiService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.captureConfig = this.service.getCaptureConfig(this.contentId);
    this.watermarkConfig = this.service.getWatermarkConfig(this.contentId);

    this.service
      .getSigners(this.contentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((signers) => {
        this.signers = signers;
        this.cdr.detectChanges();
      });
  }

  restoreDefaults(): void {
    if (
      confirm(
        'Are you sure you want to restore all settings and signers to default for this Content ID?',
      )
    ) {
      this.service.restoreDefaults(this.contentId);
      this.captureConfig = this.service.getCaptureConfig(this.contentId);
      this.watermarkConfig = this.service.getWatermarkConfig(this.contentId);
      this.showToast('All settings restored to defaults');
      this.cdr.detectChanges();
    }
  }

  private _syncDrafts(): void {
    this.signerDrafts = this.signers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email ?? '',
      role: s.role,
      mandatory: s.mandatory,
      canEdit: s.canEdit ?? true,
      canDelete: s.canDelete ?? true,
      editing: false,
    }));
  }

  openSignerList(): void {
    this._syncDrafts();
    this.showSignerList = true;
  }

  closeSignerList(): void {
    this.showSignerList = false;
  }

  addSignerRow(): void {
    this.signerDrafts = [
      ...this.signerDrafts,
      {
        id: `signer_${Date.now()}`,
        name: '',
        email: '',
        role: 'Reviewer',
        mandatory: false,
        canEdit: true,
        canDelete: true,
        editing: true,
      },
    ];
  }

  removeSignerRow(draft: SignerDraft): void {
    this.signerDrafts = this.signerDrafts.filter((d) => d.id !== draft.id);
  }

  restoreDefaultSigners(): void {
    if (confirm('Are you sure you want to replace the current list with the default signers?')) {
      this.signerDrafts = DEFAULT_SIGNERS.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email ?? '',
        role: s.role,
        mandatory: s.mandatory,
        canEdit: s.canEdit ?? true,
        canDelete: s.canDelete ?? true,
        editing: false,
      }));
    }
  }

  resetSignerList(): void {
    this._syncDrafts();
  }

  applySigners(): void {
    const valid = this.signerDrafts.filter((d) => d.name.trim());
    const updated: Signer[] = valid.map((d) => {
      const existing = this.signers.find((s) => s.id === d.id);
      return {
        id: d.id,
        name: d.name.trim(),
        email: d.email.trim() || undefined,
        role: d.role || 'Reviewer',
        mandatory: d.mandatory,
        signed: existing?.signed ?? false,
        signedAt: existing?.signedAt ?? null,
        signatureSvg: existing?.signatureSvg ?? null,
        signatureWatermarkedSvg: existing?.signatureWatermarkedSvg ?? null,
        signature: existing?.signature ?? null,
        signatureDataUrl: existing?.signatureDataUrl ?? null,
        canEdit: d.canEdit,
        canDelete: d.canDelete,
      };
    });
    this.service.setSigners(this.contentId, updated);
    this.showSignerList = false;
    this.showToast('Signer list applied successfully');
  }

  updateCaptureConfig(): void {
    this.service.setCaptureConfig(this.contentId, this.captureConfig);
  }

  updateWatermark(partial: Partial<SignatureWatermarkConfig>): void {
    this.watermarkConfig = { ...this.watermarkConfig, ...partial };
    this.service.setWatermarkConfig(this.contentId, this.watermarkConfig);
  }

  trackByDraftId(index: number, d: SignerDraft): string {
    return d.id;
  }

  toggleTheme(): void {
    this.themeToggled.emit(!this.isDarkTheme);
  }

  private showToast(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 3000 });
  }
}
